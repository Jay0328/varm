import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { asSleepAsyncValidator, flushTimers } from '__fixtures__/testUtils';
import { useFieldGroup } from './useFieldGroup';
import { AsyncValidatorFn, useField, ValidatorFn } from '.';

describe('useField()', () => {
  describe('enabled', () => {
    it('should be true default', () => {
      const field = useField('');

      expect(field.enabled.value).toBe(true);
    });

    it('should equal to enabled from options', () => {
      const field = useField('', { enabled: false });

      expect(field.enabled.value).toBe(false);
    });

    it('should support ref', () => {
      const enabled = ref(false);
      const field = useField('', { enabled });

      expect(field.enabled.value).toBe(false);
      enabled.value = true;
      expect(field.enabled.value).toBe(true);
    });

    describe('given been set to enabled', () => {
      it('should be true if parent been set to enabled', () => {
        const group = useFieldGroup(
          {
            foo: useField('', { enabled: true }),
          },
          { enabled: true }
        );

        expect(group.fields.foo.enabled.value).toBe(true);
      });

      it('should be false if parent been set to disabled', () => {
        const group = useFieldGroup(
          {
            foo: useField('', { enabled: true }),
          },
          { enabled: false }
        );

        expect(group.fields.foo.enabled.value).toBe(false);
      });
    });

    describe('given been set to disabled', () => {
      it('should always be disabled', () => {
        const enabled = ref(true);
        const group = useFieldGroup(
          {
            foo: useFieldGroup({
              bar: useField('', { enabled: false }),
            }),
          },
          { enabled }
        );

        expect(group.fields.foo.fields.bar.enabled.value).toBe(false);

        enabled.value = false;
        expect(group.fields.foo.fields.bar.enabled.value).toBe(false);
      });
    });
  });

  describe('touched', () => {
    it('should be false after created', () => {
      const field = useField('value');

      expect(field.touched.value).toEqual(false);
    });

    describe('when setTouched(true)', () => {
      it('should be true', () => {
        const field = useField('value');

        field.setTouched(true);

        expect(field.touched.value).toEqual(true);
      });
    });

    describe('when setTouched(false)', () => {
      it('should be false', () => {
        const field = useField('value');

        field.setTouched(true);
        field.setTouched(false);

        expect(field.touched.value).toEqual(false);
      });
    });
  });

  describe('dirty', () => {
    describe('given value is equal to initial value', () => {
      it('should be false', () => {
        const field = useField('foo');

        field.setValue('bar');
        field.setValue('foo');

        expect(field.dirty.value).toBe(false);
      });
    });

    describe('given value is not equal to initial value', () => {
      it('should be true', () => {
        const field = useField('foo');

        field.setValue('bar');

        expect(field.dirty.value).toBe(true);
      });
    });
  });

  describe('value', () => {
    it('should set initial value to value', () => {
      const field = useField('foo');

      expect(field.initialValue.value).toBe('foo');
      expect(field.value.value).toBe('foo');
    });

    it('should support to set value via ref', () => {
      const field = useField('foo');

      field.value.value = 'bar';

      expect(field.initialValue.value).toBe('foo');
      expect(field.value.value).toBe('bar');
    });

    describe('setValue()', () => {
      it('should set value', () => {
        const field = useField('foo');

        field.setValue('bar');

        expect(field.initialValue.value).toBe('foo');
        expect(field.value.value).toBe('bar');
      });
    });

    describe('patchValue()', () => {
      it('should have same behavior as setValue()', () => {
        const field = useField('foo');

        field.patchValue('bar');

        expect(field.initialValue.value).toBe('foo');
        expect(field.value.value).toBe('bar');
      });
    });
  });

  describe('setErrors()', () => {
    it('should set errors on a field', () => {
      const field = useField('value');

      field.setErrors([
        'foo',
        {
          message: 'bar',
          payload: { baz: 1 },
        },
      ]);

      expect(field.valid.value).toBe(false);
      expect(field.errors.value).toEqual([
        'foo',
        {
          message: 'bar',
          payload: { baz: 1 },
        },
      ]);
    });

    it('should support set single error', () => {
      const field = useField('value');

      field.setErrors('foo');

      expect(field.valid.value).toBe(false);
      expect(field.errors.value).toEqual(['foo']);
    });

    it('should reset the errors and validity when the value changes', () => {
      const field = useField('value', (value) => (value ? null : 'required'));

      field.setErrors('error');
      field.setValue('');

      expect(field.errors.value).toEqual(['required']);

      field.setErrors('error');
      field.setValue('value');

      expect(field.errors.value).toEqual(null);
    });

    it("should not reset parent's errors", () => {
      const field = useField('value');
      const group = useFieldGroup({
        foo: field,
      });

      group.setErrors('group');
      field.setErrors('field');

      expect(group.errors.value).toEqual(['group']);
    });
  });

  describe('validation', () => {
    it('should trigger validation once after created', () => {
      const validator: ValidatorFn = (value) => (value ? null : 'required');
      const mockValidator = jest.fn(validator);
      const field = useField('', mockValidator);

      expect(mockValidator).toBeCalledTimes(1);
      expect(field.errors.value).toEqual(['required']);
    });

    it('should support multiple validators if passed', () => {
      const field = useField('', [
        (value) => (value ? null : 'required'),
        (value) => ((value as string).length > 2 ? null : 'minLength'),
      ]);

      expect(field.valid.value).toEqual(false);
      expect(field.errors.value).toEqual(['required']);

      field.setValue('a');
      expect(field.valid.value).toBe(false);
      expect(field.errors.value).toEqual(['minLength']);

      field.setValue('aaa');
      expect(field.valid.value).toBe(true);
      expect(field.errors.value).toBe(null);
    });

    it('should support single validator from options', () => {
      const field = useField('', { validators: (value) => (value ? null : 'required') });

      expect(field.valid.value).toEqual(false);
      expect(field.errors.value).toEqual(['required']);

      field.setValue('value');
      expect(field.valid.value).toBe(true);
      expect(field.errors.value).toBe(null);
    });

    it('should support multiple validators from options', () => {
      const field = useField('', {
        validators: [
          (value) => (value ? null : 'required'),
          (value) => ((value as string).length > 2 ? null : 'minLength'),
        ],
      });

      expect(field.valid.value).toEqual(false);
      expect(field.errors.value).toEqual(['required']);

      field.setValue('a');
      expect(field.valid.value).toBe(false);
      expect(field.errors.value).toEqual(['minLength']);

      field.setValue('aaa');
      expect(field.valid.value).toBe(true);
      expect(field.errors.value).toBe(null);
    });

    it('should support a null validators value', () => {
      const field = useField('', { validators: null });

      expect(field.valid.value).toEqual(true);
      expect(field.errors.value).toEqual(null);
    });

    it('should support an empty options', () => {
      const field = useField('', {});

      expect(field.valid.value).toEqual(true);
      expect(field.errors.value).toEqual(null);
    });

    it('should support validator return multiple errors', () => {
      const field = useField('', () => ['required', 'error']);

      expect(field.valid.value).toEqual(false);
      expect(field.errors.value).toEqual(['required', 'error']);
    });

    it('should run all validators and return flatted errors if abortEarly = false', () => {
      const field = useField('', {
        validators: [
          (value) => (value ? null : 'required'),
          (value) => ((value as string).length > 2 ? null : ['min', 'length']),
        ],
        abortEarly: false,
      });

      expect(field.valid.value).toEqual(false);
      expect(field.errors.value).toEqual(['required', 'min', 'length']);
    });

    describe('when value changed', () => {
      it('should trigger validation once', () => {
        const validator: ValidatorFn = (value) => (value ? null : 'required');
        const mockValidator = jest.fn(validator);
        const field = useField('', {
          validators: mockValidator,
        });

        field.setValue('foo');

        // since triggered once after created
        expect(mockValidator).toBeCalledTimes(2);
        expect(field.errors.value).toBe(null);
        expect(field.valid.value).toBe(true);
      });
    });

    describe('when validator changed', () => {
      it('should re-trigger validation once', () => {
        const validator = ref<ValidatorFn>((value) => (value ? null : 'required'));
        const field = useField('', {
          validators: validator,
        });

        expect(field.valid.value).toBe(false);
        expect(field.errors.value).toEqual(['required']);

        const mockValidator = jest.fn((value) => (value ? 'no' : null));
        validator.value = mockValidator;

        expect(mockValidator).toBeCalledTimes(1);
        expect(field.valid.value).toBe(true);
        expect(field.errors.value).toBe(null);
      });
    });

    describe('given changed to enabled', () => {
      it('should re-trigger validation once', () => {
        const validator = jest.fn((value) => (value ? null : 'required'));
        const enabled = ref(false);
        const field = useField('', {
          validators: validator,
          enabled,
        });

        expect(validator).not.toBeCalled();
        expect(field.valid.value).toBe(true);
        expect(field.errors.value).toBe(null);

        enabled.value = true;

        expect(validator).toBeCalledTimes(1);
        expect(field.valid.value).toBe(false);
        expect(field.errors.value).toEqual(['required']);
      });
    });

    describe('given chagned to disabled', () => {
      it('should reset valid and errors', () => {
        const validator = jest.fn((value) => (value ? null : 'required'));
        const enabled = ref(true);
        const field = useField('', {
          validators: validator,
          enabled,
        });

        expect(field.valid.value).toBe(false);
        expect(field.errors.value).toEqual(['required']);

        enabled.value = false;

        expect(field.valid.value).toBe(true);
        expect(field.errors.value).toBe(null);
      });
    });

    describe('given disabled', () => {
      it('should always be valid and w/o errors and not to trigger validation', () => {
        const validator = jest.fn(() => 'error');
        const field = useField('', {
          validators: validator,
          enabled: false,
        });

        field.setValue('foo');
        field.setValue('bar');

        expect(validator).not.toBeCalled();
        expect(field.errors.value).toBe(null);
        expect(field.valid.value).toBe(true);
      });
    });
  });

  describe('async validation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should trigger async validation once after created', async () => {
      const validator = asSleepAsyncValidator((value) => (value ? null : 'required'), 1000);
      const mockValidator = jest.fn(validator);
      const field = useField('', {
        asyncValidators: mockValidator,
      });

      await flushTimers(1000);

      expect(mockValidator).toBeCalledTimes(1);
      expect(field.errors.value).toEqual(['required']);
    });

    it('should only fired after validation passed', () => {
      const asyncValidator = jest.fn(asSleepAsyncValidator(() => null, 1000));
      const field = useField(
        'value',
        (value) => (typeof value === 'string' && value.length > 5 ? null : 'error'),
        asyncValidator
      );

      expect(asyncValidator).not.toBeCalled();

      field.setValue('value value');

      expect(asyncValidator).toBeCalledTimes(1);
    });

    it('should mark pending while running async validation', async () => {
      const asyncValidator = jest.fn(asSleepAsyncValidator((value) => (value ? null : 'error'), 1000));
      const field = useField('', undefined, asyncValidator);

      expect(field.pending.value).toBe(true);

      await flushTimers(1000);

      expect(field.pending.value).toBe(false);
    });

    it('should set error', async () => {
      const asyncValidator = jest.fn(asSleepAsyncValidator((value) => (value ? null : 'error'), 1000));
      const field = useField('', undefined, asyncValidator);

      expect(asyncValidator).toBeCalledTimes(1);
      expect(field.valid.value).toBe(false);
      expect(field.errors.value).toBe(null);

      await flushTimers(1000);

      expect(field.valid.value).toBe(false);
      expect(field.errors.value).toEqual(['error']);
    });

    it('should cancel pending async validation before validating', async () => {
      const validator1 = jest.fn(asSleepAsyncValidator((value) => (value ? null : '1'), 1000));
      const validator2 = jest.fn(asSleepAsyncValidator((value) => (value ? null : '2'), 2000));
      const asyncValidator = ref(validator1);
      const field = useField('', undefined, asyncValidator);

      asyncValidator.value = validator2;

      expect(validator1).toBeCalledTimes(1);
      expect(validator2).toBeCalledTimes(1);
      expect(field.pending.value).toBe(true);
      expect(field.valid.value).toBe(false);
      expect(field.errors.value).toBe(null);

      await flushTimers(1000);
      expect(field.pending.value).toBe(true);
      expect(field.valid.value).toBe(false);
      expect(field.errors.value).toBe(null);

      await flushTimers(1000);
      expect(field.pending.value).toBe(false);
      expect(field.valid.value).toBe(false);
      expect(field.errors.value).toEqual(['2']);
    });

    it('should support multiple validators if passed', async () => {
      const field = useField('', undefined, [
        asSleepAsyncValidator((value) => (value ? null : 'required'), 1000),
        asSleepAsyncValidator((value) => ((value as string).length > 2 ? null : 'minLength'), 1000),
      ]);

      await flushTimers(1000);
      await flushTimers(1000);
      expect(field.valid.value).toEqual(false);
      expect(field.errors.value).toEqual(['required']);

      field.setValue('a');
      await flushTimers(1000);
      await flushTimers(1000);
      expect(field.valid.value).toBe(false);
      expect(field.errors.value).toEqual(['minLength']);

      field.setValue('aaa');
      await flushTimers(1000);
      await flushTimers(1000);
      expect(field.valid.value).toBe(true);
      expect(field.errors.value).toBe(null);
    });

    it('should support single validator from options', async () => {
      const field = useField('', {
        asyncValidators: asSleepAsyncValidator((value) => (value ? null : 'required'), 1000),
      });

      await flushTimers(1000);
      expect(field.valid.value).toEqual(false);
      expect(field.errors.value).toEqual(['required']);

      field.setValue('value');
      await flushTimers(1000);
      expect(field.valid.value).toBe(true);
      expect(field.errors.value).toBe(null);
    });

    it('should support multiple validators from options', async () => {
      const field = useField('', {
        asyncValidators: [
          asSleepAsyncValidator((value) => (value ? null : 'required'), 1000),
          asSleepAsyncValidator((value) => ((value as string).length > 2 ? null : 'minLength'), 1000),
        ],
      });

      await flushTimers(1000);
      await flushTimers(1000);
      expect(field.valid.value).toEqual(false);
      expect(field.errors.value).toEqual(['required']);

      field.setValue('a');
      await flushTimers(1000);
      await flushTimers(1000);
      expect(field.valid.value).toBe(false);
      expect(field.errors.value).toEqual(['minLength']);

      field.setValue('aaa');
      await flushTimers(1000);
      await flushTimers(1000);
      expect(field.valid.value).toBe(true);
      expect(field.errors.value).toBe(null);
    });

    it('should support a null async validators value', async () => {
      const field = useField('', { validators: null });

      await flushPromises();

      expect(field.valid.value).toEqual(true);
    });

    it('should support an empty options', async () => {
      const field = useField('', {});

      await flushPromises();

      expect(field.valid.value).toEqual(true);
    });

    it('should support validator return multiple errors', async () => {
      const field = useField(
        '',
        undefined,
        asSleepAsyncValidator(() => ['required', 'error'], 1000)
      );

      await flushTimers(1000);

      expect(field.valid.value).toEqual(false);
      expect(field.errors.value).toEqual(['required', 'error']);
    });

    it('should run all validators and return flatted errors if asyncAbortEarly = false', async () => {
      const field = useField('', {
        asyncValidators: [
          asSleepAsyncValidator((value) => (value ? null : 'required'), 1000),
          asSleepAsyncValidator((value) => ((value as string).length > 2 ? null : ['min', 'length']), 1000),
        ],
        asyncAbortEarly: false,
      });

      await flushTimers(1000);
      await flushTimers(1000);

      expect(field.valid.value).toEqual(false);
      expect(field.errors.value).toEqual(['required', 'min', 'length']);
    });

    describe('when value changed', () => {
      it('should trigger validation once', async () => {
        const validator: AsyncValidatorFn = asSleepAsyncValidator((value) => (value ? null : 'required'), 1000);
        const mockValidator = jest.fn(validator);
        const field = useField('', {
          asyncValidators: mockValidator,
        });

        field.setValue('foo');

        await flushTimers(1000);

        // since triggered once after created
        expect(mockValidator).toBeCalledTimes(2);
        expect(field.valid.value).toBe(true);
        expect(field.errors.value).toBe(null);
      });
    });

    describe('when async validator changed', () => {
      it('should re-trigger validation once', async () => {
        const validator = ref(asSleepAsyncValidator((value) => (value ? null : 'required'), 1000));
        const field = useField('', {
          asyncValidators: validator,
        });

        await flushTimers(1000);
        expect(field.errors.value).toEqual(['required']);
        expect(field.valid.value).toBe(false);

        const mockValidator = jest.fn(asSleepAsyncValidator((value) => (value ? 'no' : null), 1000));
        validator.value = mockValidator;

        await flushTimers(1000);
        expect(mockValidator).toBeCalledTimes(1);
        expect(field.errors.value).toBe(null);
        expect(field.valid.value).toBe(true);
      });
    });

    describe('given changed to enabled', () => {
      it('should re-trigger validation once', async () => {
        const validator = jest.fn(asSleepAsyncValidator((value) => (value ? null : 'required'), 1000));
        const enabled = ref(false);
        const field = useField('', {
          asyncValidators: validator,
          enabled,
        });

        await flushTimers(1000);
        expect(validator).not.toBeCalled();
        expect(field.errors.value).toBe(null);
        expect(field.valid.value).toBe(true);

        enabled.value = true;
        await flushTimers(1000);
        expect(validator).toBeCalledTimes(1);
        expect(field.errors.value).toEqual(['required']);
        expect(field.valid.value).toBe(false);
      });
    });

    describe('given changed to disabled', () => {
      describe('while async validating', () => {
        it('should not change validity state', async () => {
          const enabled = ref(true);
          const field = useField('', {
            asyncValidators: asSleepAsyncValidator((value) => (value ? null : 'required'), 1000),
            enabled,
          });

          enabled.value = false;

          await flushTimers(1000);
          expect(field.pending.value).toBe(false);
          expect(field.valid.value).toBe(true);
          expect(field.errors.value).toBe(null);
        });
      });
    });

    describe('given disabled', () => {
      it('should be valid and not trigger async validation', async () => {
        const asyncValidator = jest.fn(asSleepAsyncValidator(() => 'error', 1000));
        const field = useField('', {
          asyncValidators: asyncValidator,
          enabled: false,
        });

        field.setValue('foo');

        await flushTimers();

        expect(asyncValidator).not.toBeCalled();
        expect(field.errors.value).toBe(null);
        expect(field.valid.value).toBe(true);
      });
    });
  });

  describe('reset()', () => {
    it('should reset value to initial value', () => {
      const field = useField('foo');
      field.setValue('bar');

      field.reset();

      expect(field.initialValue.value).toBe('foo');
      expect(field.value.value).toBe('foo');
    });

    it('should reset both initial value and value to a specific value if value passed', () => {
      const field = useField('foo');

      field.reset({ value: 'bar' });

      expect(field.initialValue.value).toBe('bar');
      expect(field.value.value).toBe('bar');
    });

    it('should reset touched to false', () => {
      const field = useField('foo');
      field.setTouched(true);

      field.reset();

      expect(field.touched.value).toBe(false);
    });

    it('should reset touched to a specific state if touched passed', () => {
      const field = useField('foo');

      field.reset({ touched: true });

      expect(field.touched.value).toBe(true);
    });

    it('should retain the disabled state of the field', () => {
      const enabled = ref(true);
      const field = useField('foo', { enabled });

      enabled.value = false;
      field.reset();

      expect(field.enabled.value).toBe(false);
    });
  });
});
