import { sleep } from '__fixtures__/testUtils';
import { useField } from './useField';
import { useForm } from './useForm';

describe('reset()', () => {
  it('should reset isSubmitting to false', () => {
    const { onSubmit, reset, isSubmitting } = useForm(
      {
        foo: useField('foo'),
      },
      {
        async onSubmit(value) {
          value;
          return sleep(3000);
        },
      }
    );

    onSubmit();
    expect(isSubmitting.value).toBe(true);
    reset();
    expect(isSubmitting.value).toBe(false);
  });
});
