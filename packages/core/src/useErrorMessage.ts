import { computed, ComputedRef, unref } from 'vue';
import { MaybeRef } from '@varm/shared';
import { AbstractField } from './field';
import { ValidationError } from './validation';

export type ErrorMessageShowOn = 'touched' | 'dirty' | ((field: AbstractField<unknown>) => boolean);

export function useErrorMessage(
  field: MaybeRef<AbstractField<unknown>>,
  showOn: MaybeRef<ErrorMessageShowOn>,
  format: MaybeRef<(error: ValidationError) => string>
): ComputedRef<string | null> {
  return computed(() => {
    const f = unref(field);
    const showOnValue = unref(showOn);
    const formatFn = unref(format);

    if (!shouldShow(f, showOnValue) || !f.errors.value) {
      return null;
    }

    return formatFn(f.errors.value[0]);
  });
}

function shouldShow(field: AbstractField<unknown>, showOn: ErrorMessageShowOn) {
  if (typeof showOn === 'string') {
    {
      return field[showOn].value;
    }
  }

  return showOn(field);
}
