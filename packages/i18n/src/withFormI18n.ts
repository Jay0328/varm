import { I18n } from 'vue-i18n';
import { ValidationError } from '@varm/core';

declare module 'vue-i18n' {
  interface Composer {
    tf(result: ValidationError): string;
  }
}

export function withFormI18n<I extends I18n<unknown, unknown, unknown, false>>(i18n: I): I {
  const { t } = i18n.global;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (i18n.global as any)['tf'] = (error: ValidationError): string => {
    if (typeof error === 'string') {
      return t(error);
    }

    return t(error.message, error.payload);
  };

  return i18n;
}
