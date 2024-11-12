import {
  ValidationOptions,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsNonEmptyArray', async: false })
export class IsNonEmptyArrayConstraint implements ValidatorConstraintInterface {
  validate(value: any[]) {
    return Array.isArray(value) && value.length > 0;
  }

  defaultMessage() {
    return 'Array should not be empty.';
  }
}

export function IsNonEmptyArray(validationOptions?: ValidationOptions) {
  return Validate(IsNonEmptyArrayConstraint, validationOptions);
}
