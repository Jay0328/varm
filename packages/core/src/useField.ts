import { markRaw } from 'vue';
import { MaybeRefs } from '@varm/shared';
import { Field, FieldOptions } from './field';
import { parseFieldArgsToOptions } from './utils';

export type UseFieldOptions = MaybeRefs<FieldOptions>;

export function useField<TValue>(initialValue: TValue, validators?: UseFieldOptions['validators']): Field<TValue>;
export function useField<TValue>(
  initialValue: TValue,
  validators?: UseFieldOptions['validators'],
  asyncValidators?: UseFieldOptions['asyncValidators']
): Field<TValue>;
export function useField<TValue>(initialValue: TValue, options?: UseFieldOptions): Field<TValue>;
export function useField<TValue>(
  initialValue: TValue,
  validatorsOrOptions?: UseFieldOptions['validators'] | UseFieldOptions,
  asyncValidators?: UseFieldOptions['asyncValidators']
): Field<TValue> {
  const options = parseFieldArgsToOptions(validatorsOrOptions, asyncValidators);
  const field = new Field(initialValue, options);

  return markRaw(field);
}
