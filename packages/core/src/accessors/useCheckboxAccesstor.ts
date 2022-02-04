import { computed, ComputedRef, isRef, Ref } from 'vue';
import { MaybeRef } from '@varm/shared';
import { Field } from '../field';

export interface CheckboxAccessor {
  modelValue: boolean | null;
  ['onUpdate:modelValue'](value: boolean | null): void;
}

export function useCheckboxAccessor(field: Field<boolean | null>): CheckboxAccessor;
export function useCheckboxAccessor(field: Ref<Field<boolean | null>>): ComputedRef<CheckboxAccessor>;
export function useCheckboxAccessor(field: MaybeRef<Field<boolean | null>>) {
  if (isRef(field)) {
    return computed(() => toCheckboxAccessor(field.value));
  }

  return toCheckboxAccessor(field);
}

function toCheckboxAccessor(field: Field<boolean | null>): CheckboxAccessor {
  const { value } = field;

  return {
    modelValue: value.value,
    ['onUpdate:modelValue'](newValue: boolean | null) {
      value.value = newValue;
    },
  };
}
