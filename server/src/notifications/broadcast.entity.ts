import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum BroadcastTarget {
  ALL = 'all',
  CUSTOMERS = 'customers',
  EXECUTORS = 'executors',
}

@Entity('broadcasts')
export class Broadcast {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: BroadcastTarget })
  target: BroadcastTarget;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: 0 })
  sentCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
