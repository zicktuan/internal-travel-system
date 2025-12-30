import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity('tour_features')
export class TourFeature extends BaseEntity {
    @Column({ type: 'int', nullable: false })
    tourId!: number;

    @Column({ type: 'varchar', length: 100, nullable: false })
    tourType!: string; // 'highlight', 'inclusion', 'exclusion'

    @Column({ type: 'text', nullable: true })
    content?: string;
}