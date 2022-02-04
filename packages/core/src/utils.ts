import { MaybeRef, MaybeRefs } from '@varm/shared';
import { isRef, reactive } from 'vue';
import { AbstractFieldOptions } from './field';
import { isValidator } from './validation';

export function parseFieldArgsToOptions<O extends AbstractFieldOptions>(
  validatorsOrOptions?: MaybeRef<AbstractFieldOptions['validators']> | MaybeRefs<O>,
  asyncValidators?: MaybeRef<AbstractFieldOptions['asyncValidators']>
): O {
  let options: O;

  if (
    !validatorsOrOptions ||
    isValidator(validatorsOrOptions) ||
    Array.isArray(validatorsOrOptions) ||
    isRef(validatorsOrOptions)
  ) {
    options = reactive({
      validators: validatorsOrOptions,
      asyncValidators,
    }) as O;
  } else {
    options = reactive(validatorsOrOptions) as O;
  }

  return options;
}
