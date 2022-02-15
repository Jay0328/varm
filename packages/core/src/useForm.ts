import { markRaw, reactive } from 'vue';
import { MaybeRefs } from '@varm/shared';
import { FieldsOfGroup } from './field';
import { Form, FormOptions } from './form';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type UseFormOptions<TFields extends FieldsOfGroup<any>> = MaybeRefs<FormOptions<TFields>>;

export function useForm<TFields extends FieldsOfGroup<any>>(
  fields: TFields,
  options: UseFormOptions<TFields>
): Form<TFields> {
  const parsedOptions = reactive(options) as FormOptions<TFields>;

  return markRaw(new Form(fields, parsedOptions));
}

/* eslint-enable */
