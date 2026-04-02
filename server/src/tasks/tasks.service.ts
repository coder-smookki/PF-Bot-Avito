import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { Task, TaskStatus, TaskImage } from './task.entity';
import { Submission, SubmissionStatus } from '../submissions/submission.entity';
import { User } from '../users/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskImage)
    private readonly taskImageRepository: Repository<TaskImage>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async create(customerId: number, dto: CreateTaskDto): Promise<Task> {
    const customer = await this.usersService.findById(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const availableBalance = Number(customer.balance) - Number(customer.frozenBalance);
    if (availableBalance < dto.totalBudget) {
      throw new BadRequestException('Insufficient balance for the total budget');
    }

    const maxExec = dto.maxExecutions || Math.floor(dto.totalBudget / dto.pricePerExecution);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Freeze the totalBudget on customer balance
      customer.frozenBalance = Number(customer.frozenBalance) + dto.totalBudget;
      await queryRunner.manager.save(customer);

      const task = queryRunner.manager.create(Task, {
        customerId,
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        pricePerExecution: dto.pricePerExecution,
        totalBudget: dto.totalBudget,
        verificationType: dto.verificationType,
        controlQuestion: dto.controlQuestion,
        controlAnswer: dto.controlAnswer,
        maxExecutions: maxExec,
        status: TaskStatus.ACTIVE,
      });

      const savedTask = await queryRunner.manager.save(task);

      const urls = dto.imageUrls?.filter(Boolean) || [];
      for (const imageUrl of urls) {
        const img = queryRunner.manager.create(TaskImage, {
          taskId: savedTask.id,
          imageUrl,
        });
        await queryRunner.manager.save(img);
      }

      await queryRunner.commitTransaction();
      return this.findById(savedTask.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters: TaskFilterDto): Promise<{ data: Task[]; total: number }> {
    const { page = 1, limit = 20, status, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.title = ILike(`%${search}%`);
    }

    const [data, total] = await this.taskRepository.findAndCount({
      where,
      relations: ['images', 'customer'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async findById(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['images', 'customer'],
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async findByCustomer(customerId: number): Promise<Task[]> {
    return this.taskRepository.find({
      where: { customerId },
      relations: ['images'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: number, status: TaskStatus, customerId?: number): Promise<Task> {
    const task = await this.findById(id);

    if (customerId && task.customerId !== customerId) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    if (
      task.status === TaskStatus.COMPLETED &&
      status !== TaskStatus.COMPLETED
    ) {
      throw new BadRequestException('Cannot change status of a completed task');
    }

    task.status = status;
    return this.taskRepository.save(task);
  }

  async getAvailableForExecutor(executorId: number): Promise<Task[]> {
    // Get task IDs already submitted by this executor
    const submittedTaskIds = await this.dataSource
      .getRepository(Submission)
      .find({
        where: { executorId },
        select: ['taskId'],
      });

    const excludeIds = submittedTaskIds.map((s) => s.taskId);

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.images', 'images')
      .where('task.status = :status', { status: TaskStatus.ACTIVE })
      .andWhere('task.currentExecutions < task.maxExecutions');

    if (excludeIds.length > 0) {
      queryBuilder.andWhere('task.id NOT IN (:...excludeIds)', { excludeIds });
    }

    return queryBuilder.orderBy('task.createdAt', 'DESC').getMany();
  }

  async incrementExecutions(taskId: number): Promise<Task> {
    const task = await this.findById(taskId);
    task.currentExecutions += 1;

    if (task.currentExecutions >= task.maxExecutions) {
      task.status = TaskStatus.COMPLETED;
    }

    return this.taskRepository.save(task);
  }

  async remove(id: number, customerId: number): Promise<void> {
    const task = await this.findById(id);
    if (task.customerId !== customerId) {
      throw new ForbiddenException('You can only delete your own tasks');
    }
    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete a completed task');
    }

    const pending = await this.dataSource.getRepository(Submission).count({
      where: { taskId: id, status: SubmissionStatus.PENDING },
    });
    if (pending > 0) {
      throw new BadRequestException('Cannot delete a task with pending submissions');
    }

    const refund =
      Number(task.totalBudget) - Number(task.currentExecutions) * Number(task.pricePerExecution);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (refund > 0) {
        const customer = await queryRunner.manager.findOne(User, { where: { id: customerId } });
        if (!customer) {
          throw new NotFoundException('Customer not found');
        }
        customer.frozenBalance = Number(customer.frozenBalance) - refund;
        customer.balance = Number(customer.balance) + refund;
        await queryRunner.manager.save(customer);
      }
      await queryRunner.manager.remove(task);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
