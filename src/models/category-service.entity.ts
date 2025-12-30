import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity('category_services')
export class CategoryService extends BaseEntity {
    @Column({ type: 'integer', nullable: true })
    categoryId?: number;

    @Column({ type: 'integer', nullable: true })
    serviceId?: number;

    @Column({ type: 'varchar', length: 20, default: 'tour' })
    serviceType?: string;
}