import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity('customers')
export class Customer extends BaseEntity {
    @Column({ type: 'varchar', length: 100, nullable: false })
    fullName!: string;

    @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 50 })
    phone?: string;

    @Column({ type: 'varchar', length: 255 })
    address?: string;

    @Column({ type: 'varchar', length: 50 })
    nationality?: string;

    @Column({ type: 'varchar', length: 10 })
    nationalCode?: string;

}