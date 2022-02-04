import { isSchema } from 'yup';
import { SchemaLike } from 'yup/lib/types';
import {
  registerCustomAsyncValidator,
  registerCustomValidator,
  unregisterCustomAsyncValidator,
  unregisterCustomValidator,
} from '@varm/core';
import { toYupValidator, toYupAsyncValidator, ToYupValidatorOptions } from './converters';

declare module '@varm/core' {
  interface CustomValidatorConfigs {
    yup: SchemaLike;
  }

  interface CustomAsyncValidatorConfigs {
    yup: SchemaLike;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const name = 'yup';

export function registerYupValidator<TContext = Record<string, any>>(options?: ToYupValidatorOptions<TContext>) {
  registerCustomValidator({
    name,
    is: isSchema,
    convert: (arg) => toYupValidator(arg, options),
  });
  registerCustomAsyncValidator({
    name,
    is: isSchema,
    convert: (arg) => toYupAsyncValidator(arg, options),
  });
}

export function unregisterYupValidator() {
  unregisterCustomValidator(name);
  unregisterCustomAsyncValidator(name);
}
