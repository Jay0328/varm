import { Field, useField, useFieldArray } from '@varm/core';
import { expectType } from '.';

/**
 * @todo
 */
// describe('infer value', () => {
//   const a = useFieldArray([useField(1)]);

//   expectType<number[]>(a.value.value);
// });

describe('infer fields', () => {
  const a = useFieldArray([useField(1)]);

  expectType<Field<number>[]>(a.fields);
});
