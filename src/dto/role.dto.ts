import { PermissionResponseDto } from "./permission.dto";

export class CreateRoleDto {
    name!: string;
    description?: string;
    isSystem?: boolean = false;
    permissionIds!: number[];
}

export class UpdateRoleDto {
    name!: string;
    description?: string;
    isSystem?: boolean;
    permissionIds!: number[];
}

export class RoleResponseDto {
    id!: number;
    name!: string;
    description?: string;
    isSystem!: boolean;
    permissions!: PermissionResponseDto[];
    userCount!: number;
    createdAt!: Date;
    updatedAt!: Date;
}

