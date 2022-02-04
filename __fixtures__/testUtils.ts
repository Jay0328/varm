import { flushPromises } from '@vue/test-utils';
import { AsyncValidatorFn, ValidatorFn } from '@varm/core';

export function asSleepAsyncValidator(validator: ValidatorFn, ms?: number): AsyncValidatorFn {
  return (value) => sleep(ms).then(() => validator(value));
}

export function sleep(ms?: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function flushTimers(ms?: number) {
  await flushPromises();

  if (ms != null) {
    jest.advanceTimersByTime(ms);
  } else {
    jest.runOnlyPendingTimers();
  }

  await flushPromises();
}
