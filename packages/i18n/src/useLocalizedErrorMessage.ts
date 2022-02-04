import { useI18n } from 'vue-i18n';
import { MaybeRef } from '@varm/shared';
import { AbstractField, ErrorMessageShowOn, useErrorMessage } from '@varm/core';

export function useLocalizedErrorMessage(
  field: MaybeRef<AbstractField<unknown>>,
  showOn: MaybeRef<ErrorMessageShowOn>
) {
  const { tf } = useI18n();

  return useErrorMessage(field, showOn, tf);
}
