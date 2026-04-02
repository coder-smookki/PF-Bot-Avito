import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Broadcast, BroadcastTarget } from './broadcast.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Broadcast)
    private readonly broadcastRepo: Repository<Broadcast>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async broadcast(target: BroadcastTarget, message: string) {
    const qb = this.userRepo.createQueryBuilder('u').where('u.isActive = true');

    if (target === BroadcastTarget.CUSTOMERS) {
      qb.andWhere('u.role = :role', { role: UserRole.CUSTOMER });
    } else if (target === BroadcastTarget.EXECUTORS) {
      qb.andWhere('u.role = :role', { role: UserRole.EXECUTOR });
    }

    const users = await qb.getMany();
    const userIds = users.map((u) => u.id);

    const broadcast = this.broadcastRepo.create({
      target,
      message,
      sentCount: userIds.length,
    });
    await this.broadcastRepo.save(broadcast);

    return { broadcast, userIds };
  }

  async getBroadcasts() {
    return this.broadcastRepo.find({ order: { createdAt: 'DESC' } });
  }
}
