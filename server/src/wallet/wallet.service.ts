import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './transaction.entity';
import { User } from '../users/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getBalance(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const balance = Number(user.balance);
    const frozenBalance = Number(user.frozenBalance);
    return {
      balance,
      frozenBalance,
      available: balance - frozenBalance,
    };
  }

  async getTransactions(
    userId: number,
    filters?: { type?: TransactionType; status?: TransactionStatus; limit?: number; offset?: number },
  ) {
    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId })
      .orderBy('t.createdAt', 'DESC');

    if (filters?.type) {
      qb.andWhere('t.type = :type', { type: filters.type });
    }
    if (filters?.status) {
      qb.andWhere('t.status = :status', { status: filters.status });
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    qb.take(limit).skip(offset);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async createWithdrawalRequest(userId: number, amount: number): Promise<Transaction> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const availableBalance = Number(user.balance) - Number(user.frozenBalance);
    if (availableBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    user.frozenBalance = Number(user.frozenBalance) + amount;
    await this.userRepo.save(user);

    const transaction = this.transactionRepo.create({
      userId,
      type: TransactionType.WITHDRAWAL,
      amount,
      status: TransactionStatus.PENDING,
      description: 'Withdrawal request',
    });

    return this.transactionRepo.save(transaction);
  }

  async processWithdrawal(transactionId: number, approved: boolean): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({ where: { id: transactionId } });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    if (transaction.type !== TransactionType.WITHDRAWAL || transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not a pending withdrawal');
    }

    const user = await this.userRepo.findOne({ where: { id: transaction.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (approved) {
      transaction.status = TransactionStatus.COMPLETED;
      user.balance = Number(user.balance) - Number(transaction.amount);
      user.frozenBalance = Number(user.frozenBalance) - Number(transaction.amount);
    } else {
      transaction.status = TransactionStatus.FAILED;
      user.frozenBalance = Number(user.frozenBalance) - Number(transaction.amount);
      transaction.description = 'Withdrawal rejected by admin';
    }

    await this.userRepo.save(user);
    return this.transactionRepo.save(transaction);
  }
}
