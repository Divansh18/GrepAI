import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PrAnalysis } from '../../analysis/entities/analysis.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'repositories' })
export class Repo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  owner!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255 })
  fullName!: string;

  @Column({ type: 'varchar', nullable: true, name: 'githubWebhookId' })
  githubWebhookId!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => User, (user) => user.repos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => PrAnalysis, (analysis) => analysis.repo)
  analyses!: PrAnalysis[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
