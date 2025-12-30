import { Column, Decimal128, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity('tours')
export class Tour extends BaseEntity {
    @Column({ type: 'varchar', length: 100, unique: true })
    code!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    title!: string;

    @Column({ type: 'text', nullable: true })
    shortDescription?: string;

    @Column({ type: 'number', nullable: true })
    locationStart?: number;

    @Column({ type: 'number', nullable: true })
    locationEnd?: number;

    @Column({ type: 'number', nullable: false })
    duaration!: number;

    @Column({ type: 'varchar', length: 20, default: 'days' })
    duration_unit!: string;

    @Column({ type: 'int', default: 1 })
    minPersons!: number;

    @Column({ type: 'int', nullable: true })
    maxPersons?: number;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ type: 'boolean', default: false })
    isFeatured!: boolean;

    @Column({ type: 'boolean', default: false })
    isHotDeal!: boolean;

    @Column({ type: 'decimal', nullable: false })
    price!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    promotionalPrice!: number;

    @Column({ type: 'int', default: 0 })
    promotionalPercentage!: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    status?: string;
}