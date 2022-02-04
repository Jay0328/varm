import { markRaw } from 'vue';
import { MaybeRefs } from '@varm/shared';
import { FieldGroup, FieldGroupOptions, FieldsOfGroup } from './field';
import { parseFieldArgsToOptions } from './utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type UseFieldGroupOptions = MaybeRefs<FieldGroupOptions>;

export function useFieldGroup<TFields extends FieldsOfGroup<any>>(
  fields: TFields,
  validators?: UseFieldGroupOptions['validators']
): FieldGroup<TFields>;
export function useFieldGroup<TFields extends FieldsOfGroup<any>>(
  fields: TFields,
  validators?: UseFieldGroupOptions['validators'],
  asyncValidators?: UseFieldGroupOptions['asyncValidators']
): FieldGroup<TFields>;
export function useFieldGroup<TFields extends FieldsOfGroup<any>>(
  fields: TFields,
  options?: UseFieldGroupOptions
): FieldGroup<TFields>;
export function useFieldGroup<TFields extends FieldsOfGroup<any>>(
  fields: TFields,
  validatorsOrOptions?: UseFieldGroupOptions['validators'] | UseFieldGroupOptions,
  asyncValidators?: UseFieldGroupOptions['asyncValidators']
): FieldGroup<TFields> {
  const options = parseFieldArgsToOptions(validatorsOrOptions, asyncValidators);
  const group = new FieldGroup(fields, options);

  return markRaw(group);
}
