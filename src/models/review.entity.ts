import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity('reviews')
export class Review extends BaseEntity {
    @Column({ type: 'int', nullable: false })
    serviceId!: number; // id tour, cruise, hotel

    @Column({ type: 'varchar', length: 20, default: 'tour' })
    serviceType!: string; // 'tour', 'cruise', 'hotel'

    @Column({ type: 'varchar', length: 100, nullable: false })
    customerName!: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    customerEmail!: string;

    @Column({ type: 'int', nullable: true })
    rating?: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    title?: string;

    @Column({ type: 'text', nullable: true })
    contentReview?: string;

    @Column({ type: 'varchar', length: 50, default: 'pending' })
    status!: string;
}