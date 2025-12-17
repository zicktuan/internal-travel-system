import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, ManyToOne } from 'typeorm';
import { Role } from './role.model';
import { UserGender, UserStatus } from '../common/enums';
import { BaseEntity } from './base.entity';

@Entity('users')
export class User extends BaseEntity {

    @Column({ type: 'varchar', length: 50, unique: true })
    username!: string;

    @Column({ type: 'varchar', length: 255 })
    password!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    firstName?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    lastName?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    displayName?: string;

    @Column({ type: 'date', nullable: true })
    birthday?: Date;

    @Column({ type: 'enum', enum: UserGender, enumName: 'user_gender_enum' ,nullable: true })
    gender?: UserGender;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    avatarUrl?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    coverUrl?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'text', nullable: true })
    bio?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    website?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    location?: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    language?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    timezone?: string;

    @Column({ type: 'boolean', default: false })
    isVerified: boolean = false;

    @Column({ type: 'boolean', default: true })
    isActive: boolean = true;

    @Column({ type: 'boolean', default: false })
    isLocked: boolean = false;

    @Column({ type: 'timestamptz', nullable: true })
    lastLoginAt?: Date;

    @Column({ type: 'integer', default: 0 })
    loginAttempts!: number;

    @ManyToMany(() => Role, role => role.users)
    @JoinTable({
        name: 'user_roles',
        joinColumn: { name: 'userId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' }
    })
    roles!: Role[];

    @ManyToOne(() => User, { nullable: true })
    createdBy?: User;

    @ManyToOne(() => User, { nullable: true })
    updatedBy?: User;

    get fullName(): string {
        return `${this.firstName ?? ''} ${this.lastName ?? ''}`.trim();
    }

    get status(): UserStatus {
        if (this.isLocked) return UserStatus.LOCKED;
        if (!this.isActive) return UserStatus.INACTIVE;
        return UserStatus.ACTIVE;    
    }

    constructor(partial?: Partial<User>) {
        super();
        if (partial) {
            Object.assign(this, partial);
        }
    }
}