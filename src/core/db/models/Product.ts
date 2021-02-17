import {
  Entity,
  PrimaryColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm'
import User from './User'

@Entity()
export default class Product extends BaseEntity {
  @PrimaryColumn()
  barcode!: string

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

  @ManyToOne(() => User, (user) => user.products)
  user!: User

  public toJSON(): Partial<Product> {
    const json: Partial<Product> = Object.assign({}, this)
    /* const { password, ...jsonUser } = json*/
    return json
  }
}
