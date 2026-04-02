import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('submissions')
@Unique(['taskId', 'executorId'])
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taskId: number;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  executorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'executorId' })
  executor: User;

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.PENDING })
  status: SubmissionStatus;

  @Column({ nullable: true })
  proofImageUrl: string;

  @Column({ type: 'text', nullable: true })
  answerText: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  reviewedAt: Date;
}
