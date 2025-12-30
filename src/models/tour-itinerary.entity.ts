import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity('tour_itineraies')
export class TourItinerary extends BaseEntity {
    @Column({ type: 'int', nullable: false })
    tourId!: number;

    @Column({ type: 'int', nullable: false })
    dayNumber!: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    title!: string;

    @Column({ type: 'text', nullable: true })
    content?: string;
}