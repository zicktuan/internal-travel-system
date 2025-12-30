import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('locations')
export class Location {
    @PrimaryGeneratedColumn()
    id!: number;

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

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;
}