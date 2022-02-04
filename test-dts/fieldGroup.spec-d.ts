import { Ref } from 'vue';
import { FieldStatus, useField, useFieldGroup } from '@varm/core';
import { expectType } from '.';

describe('infer value', () => {
  const f = useFieldGroup({
    a: useField(''),
    b: useField(1),
  });

  expectType<
    Ref<{
      a: string;
      b: number;
    }>
  >(f.value);
});

describe('readonly dirty', () => {
  const f = useFieldGroup({
    a: useField(''),
  });

  // @ts-expect-error
  f.dirty.value = true;
});

describe('readonly status', () => {
  const f = useFieldGroup({
    a: useField(''),
  });

  // @ts-expect-error
  f.status.value = FieldStatus.VALID;
});

describe('removeField only accept key of fields', () => {
  const f = useFieldGroup({
    a: useField(''),
  });

  f.removeField('a');
  // @ts-expect-error
  f.removeField('b');
});
