import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsSafeString(validationOptions?: ValidationOptions) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isSafeString',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					if (typeof value !== 'string') return false;
					// Regular expression to detect HTML and JavaScript code
					const htmlJsRegex = /<[^>]*>|javascript:/i;
					return !htmlJsRegex.test(value);
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} contains unsafe HTML or JavaScript content`;
				},
			},
		});
	};
}
