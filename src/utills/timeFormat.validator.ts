import {
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';

export function IsTimeFormat(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isTimeFormat',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate(value: any, args: ValidationArguments) {
          if (!value) {
            return false;
          }
          // Regular expression to match time in "hh:mm[am|pm]" format
          const regex = /^(1[0-2]|0?[1-9]):[0-5][0-9][ap][m]$/i;
          return regex.test(value);
        },
      },
    });
  };
}
