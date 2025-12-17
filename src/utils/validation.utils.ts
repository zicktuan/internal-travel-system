export const isEmpty = (value: any): boolean =>
  value === undefined || value === null || value === '';

export const isBlank = (value: string): boolean =>
  typeof value === 'string' && value.trim() === '';

export const isValidString = (value: any): value is string =>
  typeof value === 'string';

export const isValidArray = (value: any): value is any[] =>
  Array.isArray(value);

export const isPositiveInteger = (value: any): value is number =>
  Number.isInteger(value) && value > 0;