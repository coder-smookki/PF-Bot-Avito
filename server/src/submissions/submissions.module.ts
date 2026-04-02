import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from './submission.entity';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { Transaction } from '../wallet/transaction.entity';
import { Setting } from '../admin/setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, Transaction, Setting]),
    TasksModule,
    UsersModule,
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
