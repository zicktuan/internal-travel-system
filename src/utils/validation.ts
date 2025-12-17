import { BadRequestException } from "../exceptions/app.exception";
import { isBlank, isEmpty, isPositiveInteger, isValidArray } from "./validation.utils";

export interface ValidationResult {
    valid: boolean;
    message?: string;
    suggestion?: string[];
}

export const validateEmailAvanced = (email: string): ValidationResult => {
    if (!email) {
        return {
            valid: false,
            message: "Email is required"
        }
    };

    const trimmedEmail = email.trim().toLowerCase();

    const basicEmaiRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!basicEmaiRegex.test(trimmedEmail)) {
        return {
            valid: false,
            message: "Please enter a valid email address (example: user@gmail.com)"
        };
    }

    if (trimmedEmail.length > 254) {
        return {
            valid: false,
            message: "Email is too long (maximum 254 characters)"
        };
    }
    
    const atIndex = trimmedEmail.indexOf('@');
    if (atIndex === -1 || atIndex !== trimmedEmail.lastIndexOf('@')) {
    return {
        valid: false,
        message: "Email must contain exactly one '@'"
    };
    }

    const localPart = trimmedEmail.slice(0, atIndex);
    const domain = trimmedEmail.slice(atIndex + 1);

    if (localPart.length > 64) {
        return { 
            valid: false, 
            message: 'Email username part is too long' 
        };
    }

    const domainRegex = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
    if (!domainRegex.test(domain)) {
        return { 
            valid: false, 
            message: 'Email domain is invalid' 
        };
    }

    const fakeDomains = ['example.com', 'test.com', 'domain.com'];
    if (fakeDomains.includes(domain)) {
        return { 
        valid: false, 
        message: 'Please use a real email domain' 
        };
    }

    return { valid: true };
}

export const validateString = (
    value: any,
    fieldName: string,
    options: {
        required?: boolean,
        minLength?: number,
        maxLength?: number,
        allowBlank?: boolean,
        regex?: RegExp;
        regexMessage?: string
    } = {},
): string => {
    const {
        required = true,
        minLength,
        maxLength = 255,
        allowBlank = false,
        regex,
        regexMessage,
    } = options;

    if (required && (value === required || value === null)) {
        throw new BadRequestException(`${fieldName} is required`);
    }

    if (!required && (value === required || value === null)) {
        return '';
    }

    const str = String(value).trim();

    if (!allowBlank && isBlank(str)) {
        throw new BadRequestException(`${fieldName} cannot be blank`);
    }

    if (isEmpty(str) && !required) {
        return '';
    }

    if (minLength !== undefined && str.length < minLength) {
        throw new BadRequestException(
            `${fieldName} must be at least ${minLength} characters`
        );
    }

    if (str.length > maxLength) {
        throw new BadRequestException(
        `${fieldName} must not exceed ${maxLength} characters`,
        );
    }

    if (regex && !regex.test(str)) {
        throw new BadRequestException(
            regexMessage || `${fieldName} has invalid format`,
        );
    }

    return str;
}

export const validateIdArray = async <T>(
  ids: any[],
  fieldName: string,
  findFn: (ids: number[]) => Promise<T[]>,
  options: {
    required?: boolean;
    minItems?: number;
    allowEmpty?: boolean;
  } = {},
): Promise<T[]> => {
    const { required = true, minItems = 1, allowEmpty = false } = options;

    if (!isValidArray(ids)) {
        throw new BadRequestException(`${fieldName} must be an array`);
    }

    if (required && (!ids || ids.length === 0)) {
        throw new BadRequestException(`${fieldName} is required`);
    }

    if (!required && (!ids || ids.length === 0)) {
        return [];
    }

    for (const id of ids) {
        if (!isPositiveInteger(id)) {
            throw new BadRequestException(
                `${fieldName} must contain only positive integers`,
            );
        }
    }

    if (!allowEmpty && ids.length === 0) {
        throw new BadRequestException(`${fieldName} cannot be empty`);
    }

    if (minItems && ids.length < minItems) {
        throw new BadRequestException(
            `${fieldName} must have at least ${minItems} item(s)`,
        );
    }

    const entities = await findFn(ids);
    if (entities.length !== ids.length) {
        const foundIds = entities.map((e: any) => e.id);
        const missing = ids.filter(id => !foundIds.includes(id));
        throw new BadRequestException(
            `${fieldName} contains invalid ID(s): ${missing.join(', ')}`,
        );
    }

    return entities;
};