import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'signups' })
export class Signup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  workEmail!: string;

  @Column({ type: 'varchar', length: 500 })
  github!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
