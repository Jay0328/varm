import { Ref } from 'vue';
import { FieldStatus, useField } from '@varm/core';
import { expectType } from '.';

describe('infer value', () => {
  const f = useField('foo');

  expectType<Ref<string>>(f.value);
});

describe('readonly dirty', () => {
  const f = useField('foo');

  // @ts-expect-error
  f.dirty.value = true;
});

describe('readonly status', () => {
  const f = useField('foo');

  // @ts-expect-error
  f.status.value = FieldStatus.VALID;
});
