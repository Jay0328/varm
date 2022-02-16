import { NOOP } from '@vue/shared';
import { useField, useForm } from '@varm/core';

describe('onSubmit can return unknown or Promise<unknown>', () => {
  useForm(
    {
      foo: useField(''),
    },
    {
      onSubmit: NOOP,
    }
  );
  useForm(
    {
      foo: useField(''),
    },
    {
      onSubmit: NOOP as () => Promise<void>,
    }
  );
  useForm(
    {
      foo: useField(''),
    },
    {
      onSubmit: NOOP as () => Promise<unknown>,
    }
  );
});
