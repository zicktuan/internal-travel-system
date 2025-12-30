import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity('galleries')
export class Gallery extends BaseEntity {
    @Column({ type: 'varchar', length: 20, default: 'tour' })
    serviceType!: string; // 'tour', 'cruise', 'hotel'

    @Column({ type: 'int', nullable: false })
    serviceId!: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    imageUrl!: string;

    @Column({ type: 'boolean', default: false })
    isThumbnail!: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    caption?: string;
}