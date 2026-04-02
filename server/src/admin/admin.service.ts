import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { Transaction, TransactionType, TransactionStatus } from '../wallet/transaction.entity';
import { Setting } from './setting.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  async getStats() {
    const totalUsers = await this.userRepo.count();
    const totalCustomers = await this.userRepo.count({ where: { role: UserRole.CUSTOMER } });
    const totalExecutors = await this.userRepo.count({ where: { role: UserRole.EXECUTOR } });
    const totalTasks = await this.taskRepo.count();
    const activeTasks = await this.taskRepo.count({ where: { status: 'active' as any } });

    const revenueResult = await this.transactionRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.type = :type', { type: TransactionType.COMMISSION })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    return {
      totalUsers,
      totalCustomers,
      totalExecutors,
      totalTasks,
      activeTasks,
      totalRevenue: Number(revenueResult?.total || 0),
    };
  }

  async getFinanceStats() {
    const deposits = await this.transactionRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.type = :type', { type: TransactionType.DEPOSIT })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    const withdrawals = await this.transactionRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.type = :type', { type: TransactionType.WITHDRAWAL })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    const commissions = await this.transactionRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.type = :type', { type: TransactionType.COMMISSION })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    const pendingWithdrawals = await this.transactionRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.type = :type', { type: TransactionType.WITHDRAWAL })
      .andWhere('t.status = :status', { status: TransactionStatus.PENDING })
      .getRawOne();

    const totalUserBalances = await this.userRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.balance), 0)', 'total')
      .getRawOne();

    return {
      totalDeposits: Number(deposits?.total || 0),
      totalWithdrawals: Number(withdrawals?.total || 0),
      totalCommissions: Number(commissions?.total || 0),
      pendingWithdrawals: Number(pendingWithdrawals?.total || 0),
      totalUserBalances: Number(totalUserBalances?.total || 0),
    };
  }

  async getCommission(): Promise<number> {
    const setting = await this.settingRepo.findOne({ where: { key: 'commission' } });
    return setting ? Number(setting.value) : 10;
  }

  async setCommission(amount: number): Promise<{ commission: number }> {
    let setting = await this.settingRepo.findOne({ where: { key: 'commission' } });
    if (setting) {
      setting.value = String(amount);
    } else {
      setting = this.settingRepo.create({ key: 'commission', value: String(amount) });
    }
    await this.settingRepo.save(setting);
    return { commission: amount };
  }

  async getUsers(filters?: { role?: UserRole; search?: string; limit?: number; offset?: number }) {
    const qb = this.userRepo.createQueryBuilder('u').orderBy('u.createdAt', 'DESC');

    if (filters?.role) {
      qb.andWhere('u.role = :role', { role: filters.role });
    }
    if (filters?.search) {
      qb.andWhere('(u.username ILIKE :search OR u.firstName ILIKE :search OR u.email ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    qb.take(limit).skip(offset);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async banUser(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = false;
    return this.userRepo.save(user);
  }

  async unbanUser(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = true;
    return this.userRepo.save(user);
  }

  async getPendingWithdrawals() {
    return this.transactionRepo.find({
      where: {
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PENDING,
      },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }
}
