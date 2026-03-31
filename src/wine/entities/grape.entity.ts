import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity('grapes')
export class Grape {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column('simple-array')
  colors!: string[];
}
