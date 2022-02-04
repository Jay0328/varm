import { AnySchema, ObjectSchema, ValidationError as YupValidationError } from 'yup';
import { ValidateOptions } from 'yup/lib/types';
import Lazy from 'yup/lib/Lazy';
import { ValidatorFn, ValidationError, AsyncValidatorFn } from '@varm/core';
import { isYupError } from './utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

const defaultToErrors = (error: YupValidationError) => error.errors;

export interface ToYupValidatorOptions<TContext = Record<string, any>> extends ValidateOptions<TContext> {
  toErrors?: (error: YupValidationError) => ValidationError | readonly ValidationError[];
}

export function toYupValidator<TContext = Record<string, any>>(
  schema: AnySchema<any, TContext, any> | ObjectSchema<any, TContext, any, any> | Lazy<any, unknown>,
  options?: ToYupValidatorOptions<TContext>
): ValidatorFn {
  const { toErrors = defaultToErrors } = options || {};

  return function yupValidator(value) {
    try {
      schema.validateSync(value, options);
      return null;
    } catch (error) {
      if (isYupError(error)) {
        return toErrors(error);
      }

      /* istanbul ignore next */
      throw error;
    }
  };
}

export function toYupAsyncValidator<TContext = Record<string, any>>(
  schema: AnySchema<any, TContext, any> | ObjectSchema<any, TContext, any, any> | Lazy<any, unknown>,
  options?: ToYupValidatorOptions<TContext>
): AsyncValidatorFn {
  const { toErrors = defaultToErrors } = options || {};

  return async function yupAsyncValidator(value) {
    try {
      await schema.validate(value, options);
      return null;
    } catch (error) {
      if (isYupError(error)) {
        return toErrors(error);
      }

      /* istanbul ignore next */
      throw error;
    }
  };
}
