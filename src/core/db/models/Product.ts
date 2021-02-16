import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm'
import User from './User'

@Entity()
export default class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ nullable: false })
  product_name!: string

  @Column({ nullable: false })
  image!: string

  @Column({ nullable: false })
  mark!: string

  @Column({ nullable: false, default: 'false' })
  isFavorite!: boolean

  @CreateDateColumn()
  createdAt!: string

  @UpdateDateColumn()
  updatedAt!: string

  @ManyToMany(() => User)
  @JoinTable()
  users!: User[]

  public toJSON(): Partial<Product> {
    const json: Partial<Product> = Object.assign({}, this)
    /* const { password, ...jsonUser } = json*/
    return json
  }
}