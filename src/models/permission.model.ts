import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.model';
import { PermissionModule, PermissionAction } from '../common/enums';
import { BaseEntity } from './base.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
    
    @Column({ type: 'varchar', length: 100, unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: PermissionModule,
    })
    module!: PermissionModule;

    @Column({
        type: 'enum',
        enum: PermissionAction,
    })
    action!: PermissionAction;

    @ManyToMany(() => Role, role => role.permissions)
    roles!: Role[];

    constructor(partial?: Partial<Permission>) {
        super()
        if (partial) {
            Object.assign(this, partial);
        }
    }
}