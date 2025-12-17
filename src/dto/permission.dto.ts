import { PermissionAction, PermissionModule } from "../common/enums";

export class CreateAndUpdatePermissionDto {
    name!: string;
    module!: PermissionModule;
    action!: PermissionAction;
    description?: string;
}

export class PermissionResponseDto {
    id!: number;
    name!: string;
    module!: string;
    action!: string;
    description?: string;
    createdAt!: Date;
    updatedAt!: Date;
}