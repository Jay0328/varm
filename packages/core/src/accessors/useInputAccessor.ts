import { computed, ComputedRef, isRef, Ref } from 'vue';
import { MaybeRef } from '@varm/shared';
import { Field } from '../field';

export interface InputAccessor {
  modelValue: string | null | undefined;
  ['onUpdate:modelValue'](value: string | null | undefined): void;
  onBlur(): void;
}

export function useInputAccessor(field: Field<string | null>): InputAccessor;
export function useInputAccessor(field: Ref<Field<string | null>>): ComputedRef<InputAccessor>;
export function useInputAccessor(field: MaybeRef<Field<string | null>>) {
  if (isRef(field)) {
    return computed(() => toInputAccessor(field.value));
  }

  return toInputAccessor(field);
}

function toInputAccessor(field: Field<string | null>): InputAccessor {
  const { value } = field;

  return {
    modelValue: value.value,
    ['onUpdate:modelValue'](newValue: string | null) {
      value.value = newValue;
    },
    onBlur() {
      field.setTouched(true);
    },
  };
}
