import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Submission, SubmissionStatus } from './submission.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { TasksService } from '../tasks/tasks.service';
import { UsersService } from '../users/users.service';
import { Transaction, TransactionType, TransactionStatus } from '../wallet/transaction.entity';
import { Setting } from '../admin/setting.entity';
import { TaskStatus } from '../tasks/task.entity';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async create(executorId: number, dto: CreateSubmissionDto): Promise<Submission> {
    const task = await this.tasksService.findById(dto.taskId);

    if (task.status !== TaskStatus.ACTIVE) {
      throw new BadRequestException('Task is not active');
    }

    if (task.currentExecutions >= task.maxExecutions) {
      throw new BadRequestException('Task has reached maximum executions');
    }

    // Check unique constraint - executor can only submit once per task
    const existing = await this.submissionRepository.findOne({
      where: { taskId: dto.taskId, executorId },
    });
    if (existing) {
      throw new ConflictException('You have already submitted for this task');
    }

    const submission = this.submissionRepository.create({
      taskId: dto.taskId,
      executorId,
      proofImageUrl: dto.proofImageUrl,
      answerText: dto.answerText,
      status: SubmissionStatus.PENDING,
    });

    return this.submissionRepository.save(submission);
  }

  async findByTask(taskId: number): Promise<Submission[]> {
    return this.submissionRepository.find({
      where: { taskId },
      relations: ['executor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByExecutor(executorId: number): Promise<Submission[]> {
    return this.submissionRepository.find({
      where: { executorId },
      relations: ['task'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ['task', 'executor'],
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  async review(
    submissionId: number,
    customerId: number,
    approved: boolean,
  ): Promise<Submission> {
    const submission = await this.findById(submissionId);

    if (submission.task.customerId !== customerId) {
      throw new ForbiddenException('You can only review submissions for your own tasks');
    }

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException('Submission has already been reviewed');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = submission.task;
      const price = Number(task.pricePerExecution);

      if (approved) {
        // Get commission rate from settings
        const commissionSetting = await queryRunner.manager.findOne(Setting, {
          where: { key: 'commission' },
        });
        const commission = commissionSetting ? Number(commissionSetting.value) : 0;
        const executorPayment = price - commission;

        // Deduct from customer frozen balance
        const customer = await this.usersService.findById(task.customerId);
        customer.frozenBalance = Number(customer.frozenBalance) - price;
        await queryRunner.manager.save(customer);

        // Pay executor
        const executor = await this.usersService.findById(submission.executorId);
        executor.balance = Number(executor.balance) + executorPayment;
        await queryRunner.manager.save(executor);

        // Record customer payment transaction
        const customerTx = queryRunner.manager.create(Transaction, {
          userId: task.customerId,
          type: TransactionType.TASK_PAYMENT,
          amount: -price,
          status: TransactionStatus.COMPLETED,
          description: `Payment for task: ${task.title}`,
        });
        await queryRunner.manager.save(customerTx);

        // Record executor earning transaction
        const executorTx = queryRunner.manager.create(Transaction, {
          userId: submission.executorId,
          type: TransactionType.TASK_EARNING,
          amount: executorPayment,
          status: TransactionStatus.COMPLETED,
          description: `Earning for task: ${task.title}`,
        });
        await queryRunner.manager.save(executorTx);

        // Record commission transaction
        if (commission > 0) {
          const commissionTx = queryRunner.manager.create(Transaction, {
            userId: task.customerId,
            type: TransactionType.COMMISSION,
            amount: commission,
            status: TransactionStatus.COMPLETED,
            description: `Commission for task: ${task.title}`,
          });
          await queryRunner.manager.save(commissionTx);
        }

        // Increment task executions
        task.currentExecutions += 1;
        if (task.currentExecutions >= task.maxExecutions) {
          task.status = TaskStatus.COMPLETED;
        }
        await queryRunner.manager.save(task);

        submission.status = SubmissionStatus.APPROVED;
      } else {
        // Rejected: unfreeze the price amount back to customer's available balance
        const customer = await this.usersService.findById(task.customerId);
        customer.frozenBalance = Number(customer.frozenBalance) - price;
        customer.balance = Number(customer.balance) + price;
        await queryRunner.manager.save(customer);

        // Record refund transaction
        const refundTx = queryRunner.manager.create(Transaction, {
          userId: task.customerId,
          type: TransactionType.REFUND,
          amount: price,
          status: TransactionStatus.COMPLETED,
          description: `Refund for rejected submission on task: ${task.title}`,
        });
        await queryRunner.manager.save(refundTx);

        submission.status = SubmissionStatus.REJECTED;
      }

      submission.reviewedAt = new Date();
      const savedSubmission = await queryRunner.manager.save(submission);

      await queryRunner.commitTransaction();
      return savedSubmission;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async autoVerifyQuestion(submissionId: number): Promise<Submission> {
    const submission = await this.findById(submissionId);
    const task = submission.task;

    if (!task.controlAnswer) {
      throw new BadRequestException('Task has no control answer configured');
    }

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException('Submission has already been reviewed');
    }

    const isCorrect =
      submission.answerText?.trim().toLowerCase() ===
      task.controlAnswer.trim().toLowerCase();

    if (isCorrect) {
      return this.review(submissionId, task.customerId, true);
    } else {
      return this.review(submissionId, task.customerId, false);
    }
  }
}
