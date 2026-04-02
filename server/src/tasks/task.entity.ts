import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum TaskStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum VerificationType {
  SCREENSHOT = 'screenshot',
  QUESTION = 'question',
  MANUAL = 'manual',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  pricePerExecution: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalBudget: number;

  @Column({ type: 'enum', enum: VerificationType, default: VerificationType.SCREENSHOT })
  verificationType: VerificationType;

  @Column({ nullable: true })
  controlQuestion: string;

  @Column({ nullable: true })
  controlAnswer: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.ACTIVE })
  status: TaskStatus;

  @Column({ default: 0 })
  maxExecutions: number;

  @Column({ default: 0 })
  currentExecutions: number;

  @OneToMany(() => TaskImage, (image) => image.task, { cascade: true })
  images: TaskImage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('task_images')
export class TaskImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taskId: number;

  @ManyToOne(() => Task, (task) => task.images)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  imageUrl: string;
}
