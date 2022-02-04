import { computed, Ref, shallowReactive, shallowReadonly, shallowRef, watch } from 'vue';
import { DeepPartial, NonUndefined } from '@varm/shared';
import {
  AsyncValidator,
  coercionValidationErrors,
  composeAsyncValidators,
  composeValidators,
  ValidationError,
  Validator,
} from './validation';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type FieldParent = AbstractFieldGroup<any, any, any>;

export enum FieldStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
  PENDING = 'PENDING',
}

export interface FieldResetOptions<TValue> {
  value?: TValue;
  touched?: boolean;
}

export interface AbstractFieldOptions {
  validators?: Validator | Validator[] | null;
  asyncValidators?: AsyncValidator | AsyncValidator[] | null;
  /**
   * @default true
   */
  abortEarly?: boolean;
  /**
   * @default true
   */
  asyncAbortEarly?: boolean;
  enabled?: boolean;
}

let asyncValidationSeed = 0;

export abstract class AbstractField<TValue> {
  readonly parent = shallowRef<FieldParent | null>(null);

  protected readonly inheritEnabledOption: Readonly<Ref<boolean>> = computed(() => {
    const currentEnabled = this.options.enabled ?? true;
    const parentEnabled = this.parent.value?.inheritEnabledOption.value ?? true;

    if (!parentEnabled) {
      return false;
    }

    return currentEnabled;
  });
  abstract readonly enabled: Readonly<Ref<boolean>>;

  abstract readonly value: Ref<TValue>;

  private readonly _errors = shallowRef<readonly ValidationError[] | null>(null);
  readonly errors = shallowReadonly(this._errors);

  protected readonly selfStatus: Ref<FieldStatus> = shallowRef(FieldStatus.VALID);
  abstract readonly status: Readonly<Ref<FieldStatus>>;
  readonly valid: Readonly<Ref<boolean>> = computed(() => this.status.value === FieldStatus.VALID);
  readonly pending: Readonly<Ref<boolean>> = computed(() => this.status.value === FieldStatus.PENDING);

  private readonly composedValidator = computed(() => {
    const { validators, abortEarly = true } = this.options;

    return validators ? composeValidators(validators, abortEarly) : null;
  });
  private readonly composedAsyncValidator = computed(() => {
    const { asyncValidators, asyncAbortEarly = true } = this.options;

    return asyncValidators ? composeAsyncValidators(asyncValidators, asyncAbortEarly) : null;
  });
  private lastAsyncValidationCtx: {
    id: number;
    promise: Promise<unknown>;
  } | null = null;
  private get hasPendingAsyncValidation() {
    return this.lastAsyncValidationCtx != null;
  }
  private isLastAsyncValidation(id: number) {
    return this.lastAsyncValidationCtx?.id === id;
  }

  abstract readonly touched: Readonly<Ref<boolean>>;
  abstract readonly dirty: Readonly<Ref<boolean>>;

  constructor(protected readonly options: AbstractFieldOptions) {}

  setParent = (parent: FieldParent | null) => {
    this.parent.value = parent;
  };

  abstract setTouched(touched: boolean): void;

  abstract setValue(value: TValue): void;
  abstract patchValue(value: any): void;

  setErrors = (errors: ValidationError | readonly ValidationError[] | null) => {
    this._errors.value = coercionValidationErrors(errors);
    this.selfStatus.value = this.calculateSelfStatus();
  };

  abstract reset(options?: FieldResetOptions<any>): void;

  validate = () => {
    this.cancelPendingAsyncValidation();

    if (this.enabled.value) {
      const { value } = this.value;
      const { value: validateFn } = this.composedValidator;
      const { value: validateAsyncFn } = this.composedAsyncValidator;

      const errors = validateFn ? validateFn(value) : null;
      this.setErrors(errors);

      if (this.selfStatus.value === FieldStatus.VALID || this.selfStatus.value === FieldStatus.PENDING) {
        if (validateAsyncFn) {
          const asyncValidationId = asyncValidationSeed++;

          this.selfStatus.value = FieldStatus.PENDING;
          this.lastAsyncValidationCtx = {
            id: asyncValidationId,
            promise: validateAsyncFn(value).then((errors) => {
              if (this.isLastAsyncValidation(asyncValidationId)) {
                this.cancelPendingAsyncValidation();
                this.setErrors(errors);
              }
            }),
          };
        }
      }
    } else {
      this._errors.value = null;
      this.selfStatus.value = FieldStatus.VALID;
    }
  };

  validateAsync = async () => {
    this.validate();

    if (this.lastAsyncValidationCtx) {
      await this.lastAsyncValidationCtx.promise;
    }
  };

  /**
   * should be triggered at last
   */
  protected triggerValidationEffect = () => {
    watch([this.value, this.composedValidator, this.composedAsyncValidator, this.enabled], () => this.validate(), {
      immediate: true,
      flush: 'sync',
    });
  };

  private cancelPendingAsyncValidation() {
    this.lastAsyncValidationCtx = null;
  }

  private calculateSelfStatus() {
    if (!this.enabled.value || !this.errors.value) {
      return FieldStatus.VALID;
    } else if (this.hasPendingAsyncValidation) {
      return FieldStatus.PENDING;
    }

    return FieldStatus.INVALID;
  }
}

export type FieldOptions = AbstractFieldOptions;

export class Field<TValue> extends AbstractField<TValue> {
  override readonly enabled: Readonly<Ref<boolean>> = shallowReadonly(this.inheritEnabledOption);

  readonly initialValue: Ref<TValue>;
  override readonly value: Ref<TValue>;

  override readonly status: Readonly<Ref<FieldStatus>> = shallowReadonly(this.selfStatus);

  private readonly _touched: Ref<boolean>;
  override readonly touched: Readonly<Ref<boolean>>;
  override readonly dirty: Readonly<Ref<boolean>>;

  constructor(initialValue: TValue, options: FieldOptions) {
    super(options);

    this.initialValue = shallowRef(initialValue);
    this.value = shallowRef(initialValue);

    this._touched = shallowRef(false);
    this.touched = shallowReadonly(this._touched);
    this.dirty = computed(() => this.value.value !== this.initialValue.value);

    this.triggerValidationEffect();
  }

  override setTouched = (touched: boolean) => {
    this._touched.value = touched;
  };

  override setValue = (value: TValue) => {
    this.value.value = value;
  };
  override patchValue = (value: TValue) => {
    this.setValue(value);
  };

  override reset = (options: FieldResetOptions<TValue> = {}) => {
    const { value, touched = false } = options;

    if (value !== undefined) {
      this.initialValue.value = value;
    }

    this.setValue(this.initialValue.value);
    this.setTouched(touched);
  };
}

export type AbstractFieldGroupOptions = AbstractFieldOptions;

export abstract class AbstractFieldGroup<
  TFieldName extends string | symbol | number,
  TValue extends Record<TFieldName, any>,
  TFields extends Record<TFieldName, AbstractField<any>>
> extends AbstractField<TValue> {
  override enabled: Readonly<Ref<boolean>> = computed(() => {
    if (!this.inheritEnabledOption.value) {
      return false;
    }

    return !this.everyField((field) => !field.enabled.value);
  });

  override readonly status: Readonly<Ref<FieldStatus>> = computed(() => {
    if (!this.enabled.value) {
      return FieldStatus.VALID;
    }

    if (this.selfStatus.value === FieldStatus.PENDING || this.selfStatus.value === FieldStatus.INVALID) {
      return this.selfStatus.value;
    }

    let status: FieldStatus | null = null;

    this.forEachField((field) => {
      if (!field.enabled.value) {
        return;
      }

      if (field.status.value === FieldStatus.PENDING) {
        status = FieldStatus.PENDING;
      } else if (field.status.value === FieldStatus.INVALID && !status) {
        status = FieldStatus.INVALID;
      }
    });

    return status || FieldStatus.VALID;
  });

  override readonly touched = computed(() =>
    this.someField((child) => {
      const touched = child.touched.value;
      const enabled = child.enabled.value;

      return touched && enabled;
    })
  );
  override readonly dirty = computed(() =>
    this.someField((child) => {
      const dirty = child.dirty.value;
      const enabled = child.enabled.value;

      return dirty && enabled;
    })
  );

  abstract readonly fields: TFields;

  override setTouched = (touched: boolean) => {
    this.forEachField((field) => field.setTouched(touched));
  };

  override reset = (options?: FieldResetOptions<DeepPartial<TValue>>) => {
    const { value, ...restOptions } = options || {};

    this.forEachField((field, name) => {
      const fieldOptions: FieldResetOptions<any> = restOptions;

      if (value) {
        fieldOptions.value = (value as any)[name];
      }

      field.reset(fieldOptions);
    });
  };

  protected shouldFieldValueCollected = (field: AbstractField<any>) => field.enabled.value || !this.enabled.value;

  protected abstract forEachField(cb: (field: AbstractField<any>, name: TFieldName) => void): void;
  protected abstract someField(condition: (field: AbstractField<any>) => boolean): boolean;
  protected abstract everyField(condition: (field: AbstractField<any>) => boolean): boolean;
  protected abstract reduceFields<T>(
    fn: (acc: T, child: AbstractField<any>, name: TFieldName) => T,
    initialValue: T
  ): T;
}

export type FieldsOfGroup<TValueOrFields extends Record<string, any>> = {
  [K in keyof TValueOrFields]: NonUndefined<TValueOrFields[K]> extends AbstractField<any>
    ? TValueOrFields[K]
    : NonUndefined<TValueOrFields[K]> extends (infer R)[]
    ? FieldArray<R>
    : NonUndefined<TValueOrFields[K]> extends Record<any, any>
    ? FieldGroup<FieldsOfGroup<TValueOrFields[K]>>
    : Field<TValueOrFields[K]>;
};

export type FieldGroupOptions = AbstractFieldGroupOptions;

export type ValuesOfGroup<TFields extends FieldsOfGroup<any>> = {
  [K in keyof TFields]: NonUndefined<TFields[K]> extends Field<infer R>
    ? R
    : NonUndefined<TFields[K]> extends FieldGroup<infer R>
    ? ValuesOfGroup<R>
    : NonUndefined<TFields[K]> extends FieldArray<infer R>
    ? R[]
    : NonUndefined<TFields[K]>;
};

export class FieldGroup<TFields extends FieldsOfGroup<any>> extends AbstractFieldGroup<
  keyof TFields,
  ValuesOfGroup<TFields>,
  TFields
> {
  override readonly fields: TFields = shallowReactive({} as TFields);

  override readonly value = computed({
    get: () =>
      this.reduceFields((acc, field, name) => {
        if (this.shouldFieldValueCollected(field)) {
          acc[name] = field.value.value;
        }

        return acc;
      }, {} as ValuesOfGroup<TFields>),
    set: (newValue) => {
      this.setValue(newValue);
    },
  });

  constructor(fields: TFields, options: FieldGroupOptions) {
    super(options);

    groupFieldsHelpers.forEachField(fields, (field, name) => this.registerField(name, field));
    this.triggerValidationEffect();
  }

  override setValue = (value: ValuesOfGroup<TFields>) => {
    this.forEachField((field, name) => {
      if (value[name] !== undefined) {
        field.setValue(value[name]);
      } else if (__DEV__) {
        console.warn(`Must supply a value for field with name: '${name}'`);
      }
    });
  };
  override patchValue = (value: DeepPartial<ValuesOfGroup<TFields>>) => {
    Object.keys(value as any).forEach((key) => {
      const field: AbstractField<any> | undefined = this.fields[key];

      if (field) {
        field.patchValue((value as any)[key]);
      }
    });
  };

  override forEachField = (cb: (field: AbstractField<any>, name: keyof TFields) => void) => {
    groupFieldsHelpers.forEachField(this.fields, cb);
  };

  override someField = (condition: (field: AbstractField<any>) => boolean) =>
    groupFieldsHelpers.someField(this.fields, condition);

  override everyField = (condition: (field: AbstractField<any>) => boolean) =>
    groupFieldsHelpers.everyField(this.fields, condition);

  override reduceFields = <T>(fn: (acc: T, child: AbstractField<any>, name: keyof TFields) => T, initialValue: T): T =>
    groupFieldsHelpers.reduceFields(this.fields, fn, initialValue);

  addField = <T extends keyof TFields>(name: T, field: TFields[T]): AbstractField<any> => {
    return this.fields[name] || this.registerField(name, field);
  };

  setField = <T extends keyof TFields>(name: T, field: TFields[T]) => {
    this.removeField(name);
    this.registerField(name, field);
  };

  removeField = (name: keyof TFields) => {
    const field: AbstractField<any> = this.fields[name];

    if (field) {
      field.setParent(null);
      delete this.fields[name];
    }
  };

  private registerField(name: keyof TFields, field: AbstractField<any>) {
    field.setParent(this);
    this.fields[name] = field as TFields[keyof TFields];

    return field;
  }
}

export type FieldArrayOptions = AbstractFieldGroupOptions;

export type FieldOfArray<TValue> = TValue extends Record<any, any> ? FieldGroup<FieldsOfGroup<TValue>> : Field<TValue>;

export class FieldArray<TValue, TField extends AbstractField<any> = FieldOfArray<TValue>> extends AbstractFieldGroup<
  number,
  TValue[],
  readonly TField[]
> {
  override readonly fields: TField[] = shallowReactive([]);
  override readonly value = computed<TValue[]>({
    get: () => this.fields.filter((field) => this.shouldFieldValueCollected(field)).map((field) => field.value.value),
    set: (newValue) => {
      this.setValue(newValue);
    },
  });

  constructor(fields: TField[], options: FieldArrayOptions) {
    super(options);

    fields.forEach((field) => this.push(field));
    this.triggerValidationEffect();
  }

  override setValue = (value: TValue[]) => {
    value.forEach((v, index) => {
      if (v !== undefined) {
        const field = this.fields[index];

        if (field) {
          field.setValue(v);
        } else if (__DEV__) {
          console.warn(`Cannot find field at index ${index}`);
        }
      } else {
        console.warn(`Must supply a value for field at index ${index}`);
      }
    });
  };
  override patchValue = (value: DeepPartial<TValue>[]) => {
    value.forEach((v, index) => {
      const field = this.fields[index];

      if (field) {
        field.patchValue(v);
      }
    });
  };

  override forEachField = (cb: (field: AbstractField<any>, index: number) => void) => this.fields.forEach(cb);
  override someField = (condition: (field: AbstractField<any>) => boolean) => this.fields.some(condition);
  override everyField = (condition: (field: AbstractField<any>) => boolean) => this.fields.every(condition);
  override reduceFields = <T>(fn: (acc: T, child: AbstractField<any>, index: number) => T, initialValue: T): T =>
    this.fields.reduce(fn, initialValue);

  at = (index: number) => this.fields[this.adjustIndex(index)];

  push = (field: TField) => {
    field.setParent(this);
    this.fields.push(field);
  };

  insert = (index: number, field: TField) => {
    field.setParent(this);
    this.fields.splice(index, 0, field);
  };

  removeAt = (index: number) => {
    const adjustedIndex = this.adjustIndex(index);

    this.fields[adjustedIndex]?.setParent(null);
    this.fields.splice(adjustedIndex, 1);
  };

  private adjustIndex(index: number): number {
    if (!this.fields.length) {
      return 0;
    }

    if (index < 0) {
      return this.adjustIndex(index + this.fields.length);
    }

    if (index >= this.fields.length) {
      return this.adjustIndex(index - this.fields.length);
    }

    return index;
  }
}

const groupFieldsHelpers = {
  forEachField: (fields: Record<string, AbstractField<any>>, cb: (field: AbstractField<any>, name: string) => void) => {
    Object.entries(fields).forEach(([name, field]) => {
      cb(field, name);
    });
  },
  someField: (fields: Record<string, AbstractField<any>>, condition: (field: AbstractField<any>) => boolean) => {
    for (const fieldName of Object.keys(fields)) {
      const field = fields[fieldName];

      if (field && condition(field)) {
        return true;
      }
    }

    return false;
  },
  everyField: (fields: Record<string, AbstractField<any>>, condition: (field: AbstractField<any>) => boolean) => {
    for (const fieldName of Object.keys(fields)) {
      const field = fields[fieldName];

      if (field && !condition(field)) {
        return false;
      }
    }

    return true;
  },
  reduceFields: <T>(
    fields: Record<string, AbstractField<any>>,
    fn: (acc: T, child: AbstractField<any>, name: string) => T,
    initialValue: T
  ): T => Object.entries(fields).reduce((acc, [name, field]) => fn(acc, field, name), initialValue),
};
