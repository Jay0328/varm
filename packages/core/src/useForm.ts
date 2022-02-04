import { markRaw } from 'vue';
import { FieldsOfGroup } from './field';
import { Form, FormOptions } from './form';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useForm<TFields extends FieldsOfGroup<any>>(
  fields: TFields,
  options: FormOptions<TFields>
): Form<TFields> {
  return markRaw(new Form(fields, options));
}

/* eslint-enable */
