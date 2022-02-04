import { markRaw } from 'vue';
import { MaybeRefs } from '@varm/shared';
import { AbstractField, FieldArray, FieldArrayOptions, FieldOfArray } from './field';
import { parseFieldArgsToOptions } from './utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type UseFieldArrayOptions = MaybeRefs<FieldArrayOptions>;

export function useFieldArray<TValue, TField extends AbstractField<any> = FieldOfArray<TValue>>(
  fields: TField[],
  validators?: UseFieldArrayOptions['validators']
): FieldArray<TValue, TField>;
export function useFieldArray<TValue, TField extends AbstractField<any> = FieldOfArray<TValue>>(
  fields: TField[],
  validators?: UseFieldArrayOptions['validators'],
  asyncValidators?: UseFieldArrayOptions['asyncValidators']
): FieldArray<TValue, TField>;
export function useFieldArray<TValue, TField extends AbstractField<any> = FieldOfArray<TValue>>(
  fields: TField[],
  options?: UseFieldArrayOptions
): FieldArray<TValue, TField>;
export function useFieldArray<TValue, TField extends AbstractField<any> = FieldOfArray<TValue>>(
  fields: TField[],
  validatorsOrOptions?: UseFieldArrayOptions['validators'] | UseFieldArrayOptions,
  asyncValidators?: UseFieldArrayOptions['asyncValidators']
): FieldArray<TValue, TField> {
  const options = parseFieldArgsToOptions(validatorsOrOptions, asyncValidators);
  const array = new FieldArray<TValue, TField>(fields, options);

  return markRaw(array);
}
