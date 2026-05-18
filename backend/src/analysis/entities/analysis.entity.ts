import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Repo } from '../../repos/entities/repo.entity';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity({ name: 'pr_analyses' })
export class PrAnalysis {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  prNumber!: number;

  @Column({ length: 255 })
  prTitle!: string;

  @Column({
    type: 'enum',
    enum: RiskLevel,
  })
  riskLevel!: RiskLevel;

  @Column({ type: 'int', default: 0 })
  confidence!: number;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ type: 'text' })
  findings!: string;

  @Column({ type: 'text', nullable: true })
  affectedFiles!: string | null;

  @ManyToOne(() => Repo, (repo) => repo.analyses, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'repoId' })
  repo!: Repo;

  @CreateDateColumn()
  createdAt!: Date;
}
