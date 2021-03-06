import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeInsert,
    OneToMany,
} from 'typeorm'

import bcrypt from 'bcryptjs'
import Score from './Score'

@Entity()
export default class User extends BaseEntity {
    public static SALT_ROUND = 8

    @PrimaryGeneratedColumn('uuid')
    uuid!: string

    @Column({ nullable: false, unique: true })
    email!: string

    @Column({ nullable: false })
    password!: string

    @Column({ nullable: false })
    name!: string

    @OneToMany(() => Score, score => score.user)
    scores!: Score[]

    @CreateDateColumn()
    createdAt!: string

    @UpdateDateColumn()
    updatedAt!: string

    /**
     * Hooks
     */
    @BeforeInsert()
    public hashPassword(): void | never {
        if (!this.password) {
            throw new Error('Password is not defined')
        }

        this.password = bcrypt.hashSync(this.password, User.SALT_ROUND)
    }

    /**
     * Methods
     */
    public checkPassword(uncryptedPassword: string): boolean {
        return bcrypt.compareSync(uncryptedPassword, this.password)
    }

    public toJSON(): Partial<User> {
        const json: Partial<User> = Object.assign({}, this)
        delete json.password
        /* const { password, ...jsonUser } = json*/
        return json
    }
}