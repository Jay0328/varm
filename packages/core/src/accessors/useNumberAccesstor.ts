import { computed, ComputedRef, unref } from 'vue';
import { MaybeRef } from '@varm/shared';
import { Field } from '../field';

export interface NumberAccessor {
  modelValue: number | null;
  ['onUpdate:modelValue'](value: string | number | null): void;
  modelModifiers: Record<string, boolean> & {
    number: true;
  };
  onBlur(): void;
}

export function useNumberAccessor(
  field: MaybeRef<Field<number | null>>,
  modelModifiers?: MaybeRef<Record<string, boolean> | undefined>
): ComputedRef<NumberAccessor> {
  return computed(() => toNumberAccessor(unref(field), unref(modelModifiers)));
}

function toNumberAccessor(field: Field<number | null>, modelModifiers?: Record<string, boolean>): NumberAccessor {
  const { value } = field;

  return {
    modelValue: value.value,
    ['onUpdate:modelValue'](rawNewValue: string | number | null) {
      let rawValue: number;

      if (typeof rawNewValue === 'string') {
        if (rawNewValue) {
          rawValue = parseFloat(rawNewValue);
        } else {
          rawValue = NaN;
        }
      } else {
        rawValue = rawNewValue ?? NaN;
      }

      value.value = isNaN(rawValue) ? null : rawValue;
    },
    modelModifiers: {
      ...modelModifiers,
      number: true,
    },
    onBlur() {
      field.setTouched(true);
    },
  };
}
