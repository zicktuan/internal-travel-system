import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity('categories')
export class Category extends BaseEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'integer', default: 0 })
    parentId?: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    slug!: string;

    @Column({ type: 'varchar', length: 50, default: null })
    serviceType?: string;

    children?: Category[];
}