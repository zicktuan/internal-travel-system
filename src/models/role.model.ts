import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Permission } from './permission.model';
import { User } from './user.model';
import { BaseEntity } from './base.entity';

@Entity('roles')
export class Role extends BaseEntity {

    @Column({ type: 'varchar', length: 50, unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: false })
    isSystem!: boolean;

    @ManyToMany(() => Permission, permission => permission.roles, { eager: true, cascade: true })
    @JoinTable({
        name: 'role_permissions',
        joinColumn: { name: 'roleId',  referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' }
    })
    permissions!: Permission[];

    @ManyToMany(() => User, user => user.roles)
    users!: User[];

    constructor(partial?: Partial<Role>) {
        super()
        if (partial) {
            Object.assign(this, partial);
        }
    }

}