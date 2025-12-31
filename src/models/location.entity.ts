import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity('locations')
export class Location extends BaseEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    slug!: string;

    @Column({ type: 'integer', default: 0 })
    parentId!: number;

    @Column({ type: 'varchar', length: 50, default: null })
    locationType?: string;

    @Column({ type: 'varchar', length: 50, default: null })
    locationCode?: string;

    children?: Location[];
}