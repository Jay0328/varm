import { shallowRef } from 'vue';
import { DeepPartial } from '@varm/shared';
import { FieldsOfGroup, ValuesOfGroup, FieldGroup, FieldGroupOptions, FieldResetOptions } from './field';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface FormOptions<TFields extends FieldsOfGroup<any>> extends FieldGroupOptions {
  onSubmit(values: ValuesOfGroup<TFields>): Promise<void>;
  /**
   * @default false
   */
  validateOnSubmit?: boolean;
}

export class Form<TFields extends FieldsOfGroup<any>> extends FieldGroup<TFields> {
  isSubmitting = shallowRef(false);

  constructor(fields: TFields, protected override readonly options: FormOptions<TFields>) {
    super(fields, options);
  }

  override reset = (options?: FieldResetOptions<DeepPartial<ValuesOfGroup<TFields>>>) => {
    super.reset(options);
    this.isSubmitting.value = false;
  };

  onSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();

    const { onSubmit, validateOnSubmit = false } = this.options;

    try {
      if (validateOnSubmit) {
        this.isSubmitting.value = true;
        await this.validateAsync();
      }

      if (this.valid.value) {
        this.isSubmitting.value = true;
        await onSubmit(this.value.value);
      }
    } finally {
      this.isSubmitting.value = false;
    }
  };
}

/* eslint-enable */
