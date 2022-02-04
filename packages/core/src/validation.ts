/* eslint-disable @typescript-eslint/no-explicit-any */

export type ValidationError =
  | string
  | {
      message: string;
      payload: Record<string, any>;
    };

export type Validator = ValidatorFn | CustomValidatorConfigs[keyof CustomValidatorConfigs];

export type ValidatorFn = (value: unknown) => ValidationError | readonly ValidationError[] | null;

type CoercionValidatorFn = (...args: Parameters<ValidatorFn>) => readonly ValidationError[] | null;

export type AsyncValidator = AsyncValidatorFn | CustomAsyncValidatorConfigs[keyof CustomAsyncValidatorConfigs];

export type AsyncValidatorFn = (value: unknown) => Promise<ValidationError | readonly ValidationError[] | null>;

type CoercionAsyncValidatorFn = (value: unknown) => Promise<readonly ValidationError[] | null>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CustomValidatorConfigs {}

export interface CustomValidatorConfig<TName extends keyof CustomValidatorConfigs> {
  name: TName;
  is: (arg: unknown) => arg is CustomValidatorConfigs[TName];
  convert: (validator: CustomValidatorConfigs[TName]) => ValidatorFn | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CustomAsyncValidatorConfigs {}

export interface CustomAsyncValidatorConfig<TName extends keyof CustomAsyncValidatorConfigs> {
  name: keyof CustomAsyncValidatorConfigs;
  is: (arg: unknown) => arg is CustomAsyncValidatorConfigs[TName];
  convert: (validator: CustomAsyncValidatorConfigs[TName]) => AsyncValidatorFn | null;
}

export function composeValidators(
  validators: Validator | readonly Validator[] | null,
  abortEarly: boolean
): CoercionValidatorFn | null {
  if (!validators) return null;
  if (!isValidators(validators)) return convertValidator(validators);
  if (validators.length === 0) return null;

  const validatorFns = validators.map(convertValidator).filter(Boolean) as CoercionValidatorFn[];

  if (abortEarly) {
    return (value) => {
      for (const validator of validatorFns) {
        const errors = validator(value);

        if (errors) {
          return errors;
        }
      }

      return null;
    };
  }

  return (value) => flatValidationErrors(validatorFns.map((validator) => validator(value)));
}

export function composeAsyncValidators(
  validators: AsyncValidator | readonly AsyncValidator[] | null,
  abortEarly: boolean
): CoercionAsyncValidatorFn | null {
  if (!validators) return null;
  if (!isAsyncValidators(validators)) return convertAsyncValidator(validators);
  if (validators.length === 0) return null;

  const validatorFns = validators.map(convertAsyncValidator).filter(Boolean) as CoercionAsyncValidatorFn[];

  if (abortEarly) {
    return (value) =>
      validatorFns.reduce<Promise<readonly ValidationError[] | null>>(async (acc, validator) => {
        const errors = await acc;

        if (errors) {
          return errors;
        }

        return validator(value);
      }, Promise.resolve(null));
  }

  return (value) => Promise.all(validatorFns.map((validator) => validator(value))).then(flatValidationErrors);
}

let registeredCustomValidators: CustomValidatorConfig<keyof CustomValidatorConfigs>[] = [];
let registeredCustomAsyncValidators: CustomAsyncValidatorConfig<keyof CustomAsyncValidatorConfigs>[] = [];

export function registerCustomValidator<TName extends keyof CustomValidatorConfigs>(
  custom: CustomValidatorConfig<TName>
) {
  registeredCustomValidators.push(custom as any as CustomValidatorConfig<keyof CustomValidatorConfigs>);
}

export function unregisterCustomValidator(name: keyof CustomValidatorConfigs) {
  registeredCustomValidators = registeredCustomValidators.filter((v) => v.name !== name);
}

export function registerCustomAsyncValidator<TName extends keyof CustomAsyncValidatorConfigs>(
  custom: CustomAsyncValidatorConfig<TName>
) {
  registeredCustomAsyncValidators.push(custom as any as CustomAsyncValidatorConfig<keyof CustomAsyncValidatorConfigs>);
}

export function unregisterCustomAsyncValidator(name: keyof CustomValidatorConfigs) {
  registeredCustomAsyncValidators = registeredCustomAsyncValidators.filter((v) => v.name !== name);
}

export function isValidator(arg: unknown): arg is Validator {
  return typeof arg === 'function' || registeredCustomValidators.some(({ is }) => is(arg));
}

export function isAsyncValidator(arg: unknown): arg is AsyncValidator {
  return typeof arg === 'function' || registeredCustomAsyncValidators.some(({ is }) => is(arg));
}

function isValidators(validators: Validator | readonly Validator[] | null): validators is readonly Validator[] {
  return Array.isArray(validators);
}

function isAsyncValidators(
  validators: AsyncValidator | readonly AsyncValidator[] | null
): validators is readonly AsyncValidator[] {
  return Array.isArray(validators);
}

function convertValidator(validator: Validator): CoercionValidatorFn | null {
  if (typeof validator === 'function') {
    return asCoercionValidator(validator);
  }

  for (const { is, convert } of registeredCustomValidators) {
    if (is(validator)) {
      const convertedValidator = convert(validator);

      if (convertedValidator) {
        return asCoercionValidator(convertedValidator);
      }
    }
  }

  return null;
}

function convertAsyncValidator(validator: AsyncValidator): CoercionAsyncValidatorFn | null {
  if (typeof validator === 'function') {
    return asCoercionAsyncValidator(validator);
  }

  for (const { is, convert } of registeredCustomAsyncValidators) {
    if (is(validator)) {
      const convertedValidator = convert(validator);

      if (convertedValidator) {
        return asCoercionAsyncValidator(convertedValidator);
      }
    }
  }

  return null;
}

function asCoercionValidator(validator: ValidatorFn): CoercionValidatorFn {
  return (value) => coercionValidationErrors(validator(value));
}

function asCoercionAsyncValidator(validator: AsyncValidatorFn): CoercionAsyncValidatorFn {
  return (value) => validator(value).then(coercionValidationErrors);
}

export function coercionValidationErrors(
  errors: ValidationError | readonly ValidationError[] | null
): readonly ValidationError[] | null {
  if (typeof errors === 'string' || (errors && 'message' in errors)) {
    return [errors];
  }

  return errors;
}

function flatValidationErrors(errorsArray: (readonly ValidationError[] | null)[]) {
  return errorsArray.reduce<readonly ValidationError[] | null>((allErrors, errors) => {
    if (errors) {
      if (!allErrors) {
        return errors;
      }

      return allErrors.concat(errors);
    }

    return allErrors;
  }, null);
}

/* eslint-enable */
