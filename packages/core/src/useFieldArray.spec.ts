import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { asSleepAsyncValidator, flushTimers } from '__fixtures__/testUtils';
import { AsyncValidatorFn, ValidatorFn } from './validation';
import { useField, useFieldArray, useFieldGroup } from '.';

describe('useFieldArray()', () => {
  describe('enabled', () => {
    it('should be true default', () => {
      const array = useFieldArray([useField('')]);

      expect(array.enabled.value).toBe(true);
    });

    it('should equal to enabled from options', () => {
      const array = useFieldArray([useField('')], { enabled: false });

      expect(array.enabled.value).toBe(false);
    });

    it('should support ref', () => {
      const enabled = ref(false);
      const array = useFieldArray([useField('')], { enabled });

      expect(array.enabled.value).toBe(false);
      enabled.value = true;
      expect(array.enabled.value).toBe(true);
    });

    describe('given been set to enabled', () => {
      it('should be false if all fields disabled', () => {
        const enabled = ref(false);
        const array = useFieldArray([useField('', { enabled }), useField('', { enabled: false })], { enabled: true });

        expect(array.enabled.value).toBe(false);

        enabled.value = true;

        expect(array.enabled.value).toBe(true);
      });

      it('should be true if parent been set to enabled', () => {
        const group = useFieldGroup(
          {
            foo: useFieldArray([useField('')], { enabled: true }),
          },
          { enabled: true }
        );

        expect(group.fields.foo.enabled.value).toBe(true);
      });

      it('should be false if parent been set to disabled', () => {
        const group = useFieldGroup(
          {
            foo: useFieldArray([useField('')], { enabled: true }),
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
            foo: useFieldArray([useField('')], { enabled: false }),
          },
          { enabled }
        );

        expect(group.fields.foo.enabled.value).toBe(false);

        enabled.value = false;

        expect(group.fields.foo.enabled.value).toBe(false);
      });
    });
  });

  describe('touched', () => {
    it('should be false after created', () => {
      const array = useFieldArray([useField('value')]);

      expect(array.touched.value).toBe(false);
    });

    it('should sync w/ all enabled descendants', () => {
      const enabled = ref(true);
      const array = useFieldArray([
        useFieldGroup(
          {
            foo: useField('1'),
          },
          { enabled }
        ),
        useFieldGroup({
          foo: useField('2'),
        }),
      ]);

      array.fields[0].fields.foo.setTouched(true);
      expect(array.touched.value).toEqual(true);
      array.fields[1].fields.foo.setTouched(true);
      expect(array.touched.value).toEqual(true);
      array.fields[0].fields.foo.setTouched(false);
      expect(array.touched.value).toEqual(true);
      array.fields[1].fields.foo.setTouched(false);
      expect(array.touched.value).toEqual(false);

      array.fields[0].setTouched(true);
      expect(array.touched.value).toEqual(true);
      enabled.value = false;
      expect(array.touched.value).toEqual(false);
      enabled.value = true;
      expect(array.touched.value).toEqual(true);
    });

    describe('when setTouched(true)', () => {
      it('should be true', () => {
        const array = useFieldArray([useField('value')]);

        array.setTouched(true);

        expect(array.touched.value).toBe(true);
      });

      it('should also set touched of all descendants to true', () => {
        const array = useFieldArray([
          useFieldGroup({
            foo: useField('1'),
          }),
          useFieldGroup({
            foo: useField('2'),
          }),
        ]);

        array.setTouched(true);

        expect(array.fields[0].touched.value).toBe(true);
        expect(array.fields[0].fields.foo.touched.value).toBe(true);
        expect(array.fields[1].touched.value).toBe(true);
        expect(array.fields[1].fields.foo.touched.value).toBe(true);
      });
    });

    describe('when setTouched(false)', () => {
      it('should be false', () => {
        const array = useFieldArray([useField('value')]);

        array.setTouched(true);
        array.setTouched(false);

        expect(array.touched.value).toEqual(false);
      });

      it('should also set touched of all descendants to false', () => {
        const array = useFieldArray([
          useFieldGroup({
            foo: useField('1'),
          }),
          useFieldGroup({
            foo: useField('2'),
          }),
        ]);

        array.setTouched(true);
        array.setTouched(false);

        expect(array.fields[0].touched.value).toBe(false);
        expect(array.fields[0].fields.foo.touched.value).toBe(false);
        expect(array.fields[1].touched.value).toBe(false);
        expect(array.fields[1].fields.foo.touched.value).toBe(false);
      });
    });
  });

  describe('dirty', () => {
    it('should be false after created', () => {
      const array = useFieldArray([useField('value')]);

      expect(array.dirty.value).toBe(false);
    });

    it('should sync w/ all enabled descendants', () => {
      const enabled = ref(true);
      const array = useFieldArray([
        useFieldGroup(
          {
            foo: useField('1'),
          },
          { enabled }
        ),
        useFieldGroup({
          foo: useField('2'),
        }),
      ]);

      array.fields[0].fields.foo.setValue('3');
      expect(array.dirty.value).toEqual(true);
      array.fields[1].fields.foo.setValue('4');
      expect(array.dirty.value).toEqual(true);
      array.fields[0].fields.foo.setValue('1');
      expect(array.dirty.value).toEqual(true);
      array.fields[1].fields.foo.setValue('2');
      expect(array.dirty.value).toEqual(false);

      array.fields[0].fields.foo.setValue('3');
      expect(array.dirty.value).toEqual(true);
      enabled.value = false;
      expect(array.dirty.value).toEqual(false);
      enabled.value = true;
      expect(array.dirty.value).toEqual(true);
    });
  });

  describe('value', () => {
    it('should sync w/ all enabled descendants', () => {
      const enabled = ref(true);
      const array = useFieldArray([
        useFieldGroup(
          {
            foo: useField('1'),
          },
          { enabled }
        ),
        useFieldGroup({
          foo: useField('2'),
        }),
      ]);

      expect(array.value.value).toEqual([{ foo: '1' }, { foo: '2' }]);

      array.fields[0].fields.foo.value.value = '0';
      array.fields[1].fields.foo.value.value = '1';
      array.push(
        useFieldGroup({
          foo: useField('3'),
        })
      );
      expect(array.value.value).toEqual([{ foo: '0' }, { foo: '1' }, { foo: '3' }]);

      enabled.value = false;
      expect(array.value.value).toEqual([{ foo: '1' }, { foo: '3' }]);
      enabled.value = true;
      expect(array.value.value).toEqual([{ foo: '0' }, { foo: '1' }, { foo: '3' }]);
    });

    it('should collect all descendants if self disabled', () => {
      const enabled = ref(false);
      const array = useFieldArray(
        [
          useFieldGroup(
            {
              foo: useField('1'),
            },
            { enabled: false }
          ),
          useFieldGroup({
            foo: useField('2'),
          }),
        ],
        { enabled }
      );

      expect(array.value.value).toEqual([{ foo: '1' }, { foo: '2' }]);

      enabled.value = true;
      expect(array.value.value).toEqual([{ foo: '2' }]);
    });

    describe('setValue()', () => {
      it('should set value of all fields', () => {
        const array = useFieldArray([
          useFieldGroup({
            a: useField(1),
            b: useField(2),
          }),
          useFieldGroup({
            a: useField(3),
            b: useField(4),
          }),
        ]);

        array.setValue([
          {
            a: 5,
            b: 6,
          },
          {
            a: 7,
            b: 8,
          },
        ]);

        expect(array.value.value).toEqual([
          {
            a: 5,
            b: 6,
          },
          {
            a: 7,
            b: 8,
          },
        ]);
      });

      it('should ignore values which index not in fields', () => {
        const array = useFieldArray([
          useFieldGroup({
            a: useField(1),
            b: useField(2),
          }),
        ]);

        array.setValue([
          {
            a: 5,
            b: 6,
          },
          {
            a: 7,
            b: 8,
          },
        ]);

        expect(array.value.value).toEqual([
          {
            a: 5,
            b: 6,
          },
        ]);
      });
    });

    describe('patchValue()', () => {
      it('should only set passed value to corresponding fields', () => {
        const array = useFieldArray([
          useFieldGroup({
            a: useField(1),
            b: useField(2),
          }),
          useFieldGroup({
            a: useField(3),
            b: useField(4),
          }),
        ]);

        array.patchValue([
          {
            a: 5,
          },
          {
            b: 6,
          },
        ]);

        expect(array.value.value).toEqual([
          {
            a: 5,
            b: 2,
          },
          {
            a: 3,
            b: 6,
          },
        ]);
      });

      it('should ignore values which index not in fields', () => {
        const array = useFieldArray([
          useFieldGroup({
            a: useField(1),
            b: useField(2),
          }),
        ]);

        array.patchValue([
          {
            a: 5,
          },
          {
            b: 6,
          },
        ]);

        expect(array.value.value).toEqual([
          {
            a: 5,
            b: 2,
          },
        ]);
      });
    });
  });

  describe('setErrors()', () => {
    it('should set errors', () => {
      const array = useFieldArray([useField('value')]);

      array.setErrors([
        'foo',
        {
          message: 'bar',
          payload: { baz: 1 },
        },
      ]);

      expect(array.valid.value).toBe(false);
      expect(array.errors.value).toEqual([
        'foo',
        {
          message: 'bar',
          payload: { baz: 1 },
        },
      ]);
    });

    it('should support set single error', () => {
      const array = useFieldArray([useField('value')]);

      array.setErrors('foo');

      expect(array.valid.value).toBe(false);
      expect(array.errors.value).toEqual(['foo']);
    });

    it('should reset the errors and validity when the value changes', () => {
      const array = useFieldArray([useField('value')], (value) => ((value as any)[0] ? null : 'required'));

      array.setErrors('error');
      array.setValue(['']);

      expect(array.errors.value).toEqual(['required']);

      array.setErrors('error');
      array.setValue(['value']);

      expect(array.errors.value).toEqual(null);
    });

    it("should not reset parent's errors", () => {
      const array = useFieldArray([useField('value')]);
      const parent = useFieldGroup({
        a: array,
      });

      parent.setErrors('parent');
      array.setErrors('array');

      expect(parent.errors.value).toEqual(['parent']);
    });
  });

  describe('validation', () => {
    it('should trigger validation once after created', () => {
      const validator: ValidatorFn = (value) => ((value as any)[0] ? null : 'required');
      const mockValidator = jest.fn(validator);
      const array = useFieldArray([useField('')], mockValidator);

      expect(mockValidator).toBeCalledTimes(1);
      expect(array.errors.value).toEqual(['required']);
    });

    it('should support multiple validators if passed', () => {
      const array = useFieldArray(
        [useField('')],
        [
          (value) => ((value as any)[0] ? null : 'required'),
          (value) => ((value as any)[0].length > 2 ? null : 'minLength'),
        ]
      );

      expect(array.valid.value).toEqual(false);
      expect(array.errors.value).toEqual(['required']);

      array.setValue(['a']);
      expect(array.valid.value).toBe(false);
      expect(array.errors.value).toEqual(['minLength']);

      array.setValue(['aaa']);
      expect(array.valid.value).toBe(true);
      expect(array.errors.value).toBe(null);
    });

    it('should support single validator from options', () => {
      const array = useFieldArray([useField('')], { validators: (value) => ((value as any)[0] ? null : 'required') });

      expect(array.valid.value).toEqual(false);
      expect(array.errors.value).toEqual(['required']);

      array.setValue(['value']);
      expect(array.valid.value).toBe(true);
      expect(array.errors.value).toBe(null);
    });

    it('should support multiple validators from options', () => {
      const array = useFieldArray([useField('')], {
        validators: [
          (value) => ((value as any)[0] ? null : 'required'),
          (value) => ((value as any)[0].length > 2 ? null : 'minLength'),
        ],
      });

      expect(array.valid.value).toEqual(false);
      expect(array.errors.value).toEqual(['required']);

      array.setValue(['a']);
      expect(array.valid.value).toBe(false);
      expect(array.errors.value).toEqual(['minLength']);

      array.setValue(['aaa']);
      expect(array.valid.value).toBe(true);
      expect(array.errors.value).toBe(null);
    });

    it('should support a null validators value', () => {
      const array = useFieldArray([useField('')], {
        validators: null,
      });

      expect(array.valid.value).toEqual(true);
      expect(array.errors.value).toEqual(null);
    });

    it('should support an empty options', () => {
      const array = useFieldArray([useField('')], {});

      expect(array.valid.value).toEqual(true);
      expect(array.errors.value).toEqual(null);
    });

    it('should support validator return multiple errors', () => {
      const array = useFieldArray([useField('')], () => ['required', 'error']);

      expect(array.valid.value).toEqual(false);
      expect(array.errors.value).toEqual(['required', 'error']);
    });

    it('should run all validators and return flatted errors if abortEarly = false', () => {
      const array = useFieldArray([useField('')], {
        validators: [
          (value) => ((value as any)[0] ? null : 'required'),
          (value) => ((value as any)[0].length > 2 ? null : ['min', 'length']),
        ],
        abortEarly: false,
      });

      expect(array.valid.value).toEqual(false);
      expect(array.errors.value).toEqual(['required', 'min', 'length']);
    });

    describe('when value changed', () => {
      it('should trigger validation once', () => {
        const validator: ValidatorFn = (value) => ((value as any)[0] ? null : 'required');
        const mockValidator = jest.fn(validator);
        const array = useFieldArray([useField('')], { validators: mockValidator });

        array.setValue(['foo']);

        // since triggered once after created
        expect(mockValidator).toBeCalledTimes(2);
        expect(array.errors.value).toBe(null);
        expect(array.valid.value).toBe(true);
      });
    });

    describe('when validator changed', () => {
      it('should re-trigger validation once', () => {
        const validator = ref<ValidatorFn>((value) => ((value as any)[0] ? null : 'required'));
        const array = useFieldArray([useField('')], { validators: validator });

        expect(array.valid.value).toBe(false);
        expect(array.errors.value).toEqual(['required']);

        const mockValidator = jest.fn((value) => ((value as any)[0] ? 'no' : null));
        validator.value = mockValidator;

        expect(mockValidator).toBeCalledTimes(1);
        expect(array.valid.value).toBe(true);
        expect(array.errors.value).toBe(null);
      });
    });

    describe('given changed to enabled', () => {
      it('should re-trigger validation once', () => {
        const validator = jest.fn((value) => ((value as any)[0] ? null : 'required'));
        const enabled = ref(false);
        const array = useFieldArray([useField('')], {
          validators: validator,
          enabled,
        });

        expect(validator).not.toBeCalled();
        expect(array.valid.value).toBe(true);
        expect(array.errors.value).toBe(null);

        enabled.value = true;

        expect(validator).toBeCalledTimes(1);
        expect(array.valid.value).toBe(false);
        expect(array.errors.value).toEqual(['required']);
      });
    });

    describe('given chagned to disabled', () => {
      it('should reset valid and errors', () => {
        const validator = jest.fn((value) => ((value as any)[0] ? null : 'required'));
        const enabled = ref(true);
        const array = useFieldArray([useField('')], {
          validators: validator,
          enabled,
        });

        expect(array.valid.value).toBe(false);
        expect(array.errors.value).toEqual(['required']);

        enabled.value = false;

        expect(array.valid.value).toBe(true);
        expect(array.errors.value).toBe(null);
      });
    });

    describe('given disabled', () => {
      it('should always be valid and w/o errors and not to trigger validation', () => {
        const validator = jest.fn(() => 'error');
        const array = useFieldArray([useField('')], {
          validators: validator,
          enabled: false,
        });

        array.setValue(['foo']);
        array.setValue(['bar']);

        expect(validator).not.toBeCalled();
        expect(array.errors.value).toBe(null);
        expect(array.valid.value).toBe(true);
      });
    });
  });

  describe('async validation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should trigger async validation once after created', async () => {
      const validator = asSleepAsyncValidator((value) => ((value as any)[0] ? null : 'required'), 1000);
      const mockValidator = jest.fn(validator);
      const array = useFieldArray([useField('')], {
        asyncValidators: mockValidator,
      });

      await flushTimers(1000);

      expect(mockValidator).toBeCalledTimes(1);
      expect(array.errors.value).toEqual(['required']);
    });

    it('should only fired after validation passed', () => {
      const asyncValidator = jest.fn(asSleepAsyncValidator(() => null, 1000));
      const array = useFieldArray(
        [useField('value')],
        (value) => ((value as any)[0].length > 5 ? null : 'error'),
        asyncValidator
      );

      expect(asyncValidator).not.toBeCalled();

      array.setValue(['value value']);

      expect(asyncValidator).toBeCalledTimes(1);
    });

    it('should mark pending while running async validation', async () => {
      const asyncValidator = jest.fn(asSleepAsyncValidator(() => 'error', 1000));
      const array = useFieldArray([useField('')], undefined, asyncValidator);

      expect(array.pending.value).toBe(true);

      await flushTimers(1000);

      expect(array.pending.value).toBe(false);
    });

    it('should set error', async () => {
      const asyncValidator = jest.fn(asSleepAsyncValidator((value) => ((value as any)[0] ? null : 'error'), 1000));
      const array = useFieldArray([useField('')], undefined, asyncValidator);

      expect(asyncValidator).toBeCalledTimes(1);
      expect(array.valid.value).toBe(false);
      expect(array.errors.value).toBe(null);

      await flushTimers(1000);

      expect(array.valid.value).toBe(false);
      expect(array.errors.value).toEqual(['error']);
    });

    it('should cancel pending async validation before validating', async () => {
      const validator1 = jest.fn(asSleepAsyncValidator((value) => ((value as any)[0] ? null : '1'), 1000));
      const validator2 = jest.fn(asSleepAsyncValidator((value) => ((value as any)[0] ? null : '2'), 2000));
      const asyncValidator = ref(validator1);
      const array = useFieldArray([useField('')], undefined, asyncValidator);

      asyncValidator.value = validator2;

      expect(validator1).toBeCalledTimes(1);
      expect(validator2).toBeCalledTimes(1);
      expect(array.pending.value).toBe(true);
      expect(array.valid.value).toBe(false);
      expect(array.errors.value).toBe(null);

      await flushTimers(1000);
      expect(array.pending.value).toBe(true);
      expect(array.valid.value).toBe(false);
      expect(array.errors.value).toBe(null);

      await flushTimers(1000);
      expect(array.pending.value).toBe(false);
      expect(array.valid.value).toBe(false);
      expect(array.errors.value).toEqual(['2']);
    });

    it('should support multiple validators if passed', async () => {
      const array = useFieldArray([useField('')], undefined, [
        asSleepAsyncValidator((value) => ((value as any)[0] ? null : 'required'), 1000),
        asSleepAsyncValidator((value) => ((value as any)[0].length > 2 ? null : 'minLength'), 1000),
      ]);

      await flushTimers(1000);
      await flushTimers(1000);
      expect(array.valid.value).toEqual(false);
      expect(array.errors.value).toEqual(['required']);

      array.setValue(['a']);
      await flushTimers(1000);
      await flushTimers(1000);
      expect(array.valid.value).toBe(false);
      expect(array.errors.value).toEqual(['minLength']);

      array.setValue(['aaa']);
      await flushTimers(1000);
      await flushTimers(1000);
      expect(array.valid.value).toBe(true);
      expect(array.errors.value).toBe(null);
    });

    it('should support single validator from options', async () => {
      const array = useFieldArray([useField('')], {
        asyncValidators: asSleepAsyncValidator((value) => ((value as any)[0] ? null : 'required'), 1000),
      });

      await flushTimers(1000);
      expect(array.valid.value).toEqual(false);
      expect(array.errors.value).toEqual(['required']);

      array.setValue(['value']);
      await flushTimers(1000);
      expect(array.valid.value).toBe(true);
      expect(array.errors.value).toBe(null);
    });

    it('should support multiple validators from options', async () => {
      const array = useFieldArray([useField('')], {
        asyncValidators: [
          asSleepAsyncValidator((value) => ((value as any)[0] ? null : 'required'), 1000),
          asSleepAsyncValidator((value) => ((value as any)[0].length > 2 ? null : 'minLength'), 1000),
        ],
      });

      await flushTimers(1000);
      await flushTimers(1000);
      expect(array.valid.value).toEqual(false);
      expect(array.errors.value).toEqual(['required']);

      array.setValue(['a']);
      await flushTimers(1000);
      await flushTimers(1000);
      expect(array.valid.value).toBe(false);
      expect(array.errors.value).toEqual(['minLength']);

      array.setValue(['aaa']);
      await flushTimers(1000);
      await flushTimers(1000);
      expect(array.valid.value).toBe(true);
      expect(array.errors.value).toBe(null);
    });

    it('should support a null async validators value', async () => {
      const array = useFieldArray([useField('')], { validators: null });

      await flushPromises();

      expect(array.valid.value).toEqual(true);
    });

    it('should support an empty options', async () => {
      const array = useFieldArray([useField('')], {});

      await flushPromises();

      expect(array.valid.value).toEqual(true);
    });

    it('should support validator return multiple errors', async () => {
      const array = useFieldArray(
        [useField('')],
        undefined,
        asSleepAsyncValidator(() => ['required', 'error'], 1000)
      );

      await flushTimers(1000);

      expect(array.valid.value).toEqual(false);
      expect(array.errors.value).toEqual(['required', 'error']);
    });

    it('should run all validators and return flatted errors if asyncAbortEarly = false', async () => {
      const field = useFieldArray([useField('')], {
        asyncValidators: [
          asSleepAsyncValidator((value) => ((value as any)[0] ? null : 'required'), 1000),
          asSleepAsyncValidator((value) => ((value as any)[0].length > 2 ? null : ['min', 'length']), 1000),
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
        const validator: AsyncValidatorFn = asSleepAsyncValidator(
          (value) => ((value as any)[0] ? null : 'required'),
          1000
        );
        const mockValidator = jest.fn(validator);
        const array = useFieldArray([useField('')], {
          asyncValidators: mockValidator,
        });

        array.setValue(['foo']);

        await flushTimers(1000);

        // since triggered once after created
        expect(mockValidator).toBeCalledTimes(2);
        expect(array.valid.value).toBe(true);
        expect(array.errors.value).toBe(null);
      });
    });

    describe('when async validator changed', () => {
      it('should re-trigger validation once', async () => {
        const validator = ref(asSleepAsyncValidator((value) => ((value as any)[0] ? null : 'required'), 1000));
        const array = useFieldArray([useField('')], {
          asyncValidators: validator,
        });

        await flushTimers(1000);
        expect(array.errors.value).toEqual(['required']);
        expect(array.valid.value).toBe(false);

        const mockValidator = jest.fn(asSleepAsyncValidator((value) => ((value as any)[0] ? 'no' : null), 1000));
        validator.value = mockValidator;

        await flushTimers(1000);
        expect(mockValidator).toBeCalledTimes(1);
        expect(array.errors.value).toBe(null);
        expect(array.valid.value).toBe(true);
      });
    });

    describe('given changed to enabled', () => {
      it('should re-trigger validation once', async () => {
        const validator = jest.fn(asSleepAsyncValidator((value) => ((value as any)[0] ? null : 'required'), 1000));
        const enabled = ref(false);
        const array = useFieldArray([useField('')], {
          asyncValidators: validator,
          enabled,
        });

        await flushTimers(1000);
        expect(validator).not.toBeCalled();
        expect(array.errors.value).toBe(null);
        expect(array.valid.value).toBe(true);

        enabled.value = true;
        await flushTimers(1000);
        expect(validator).toBeCalledTimes(1);
        expect(array.errors.value).toEqual(['required']);
        expect(array.valid.value).toBe(false);
      });
    });

    describe('given changed to disabled', () => {
      describe('while async validating', () => {
        it('should not change validity state', async () => {
          const enabled = ref(true);
          const array = useFieldArray([useField('')], {
            asyncValidators: asSleepAsyncValidator((value) => ((value as any)[0] ? null : 'required'), 1000),
            enabled,
          });

          enabled.value = false;

          await flushTimers(1000);
          expect(array.pending.value).toBe(false);
          expect(array.valid.value).toBe(true);
          expect(array.errors.value).toBe(null);
        });
      });
    });

    describe('given disabled', () => {
      it('should be valid and not trigger async validation', async () => {
        const asyncValidator = jest.fn(asSleepAsyncValidator(() => 'error', 1000));
        const array = useFieldArray([useField('')], {
          asyncValidators: asyncValidator,
          enabled: false,
        });

        array.setValue(['foo']);

        await flushTimers();

        expect(asyncValidator).not.toBeCalled();
        expect(array.errors.value).toBe(null);
        expect(array.valid.value).toBe(true);
      });
    });
  });

  describe('valid', () => {
    it('should be false if invalid', () => {
      const array = useFieldArray([useField(''), useField('')], { validators: () => 'error' });

      expect(array.valid.value).toBe(false);
    });

    it('should be false if in async validating', () => {
      const array = useFieldArray([useField(''), useField('')], {
        asyncValidators: asSleepAsyncValidator(() => 'error'),
      });

      expect(array.valid.value).toBe(false);
    });

    it('should be true if all enabled descendants valid or not in pending', () => {
      const enabled = ref(true);
      const array = useFieldArray([useField('', { enabled }), useField('')]);

      array.fields[0].setErrors('error');
      expect(array.valid.value).toBe(false);

      enabled.value = false;
      array.fields[0].setErrors('error');
      expect(array.valid.value).toBe(true);
    });
  });

  describe('pending', () => {
    it('should be false if not in async validating', () => {
      const array = useFieldArray([useField(''), useField('')]);

      expect(array.pending.value).toBe(false);
    });

    it('should be true if in async validating', () => {
      const array = useFieldArray([useField(''), useField('')], {
        asyncValidators: asSleepAsyncValidator(() => 'error'),
      });

      expect(array.pending.value).toBe(true);
    });

    it('should be true if some enabled descendants pending', () => {
      const enabled = ref(true);
      const array = useFieldArray([
        useField('', {
          asyncValidators: asSleepAsyncValidator(() => 'error', 1000),
          enabled,
        }),
        useField(''),
      ]);

      expect(array.pending.value).toBe(true);

      enabled.value = false;
      expect(array.pending.value).toBe(false);
    });
  });

  describe('reset()', () => {
    it('should reset values of all fields to initial value', () => {
      const array = useFieldGroup([useField('a'), useField('b')]);
      array.fields[0].setValue('c');
      array.fields[1].setValue('d');

      array.reset();

      expect(array.fields[0].initialValue.value).toBe('a');
      expect(array.fields[0].value.value).toBe('a');
      expect(array.fields[1].initialValue.value).toBe('b');
      expect(array.fields[1].value.value).toBe('b');
    });

    it('should reset both initial value and value of all fields to a specific value if value passed', () => {
      const array = useFieldGroup([useField('a'), useField('b')]);
      array.fields[0].setValue('c');
      array.fields[1].setValue('d');

      array.reset({
        value: ['e'],
      });

      expect(array.fields[0].initialValue.value).toBe('e');
      expect(array.fields[0].value.value).toBe('e');
      expect(array.fields[1].initialValue.value).toBe('b');
      expect(array.fields[1].value.value).toBe('b');
    });

    it('should reset touched of all fields to false', () => {
      const array = useFieldGroup([useField('a'), useField('b')]);

      array.setTouched(true);
      array.reset();

      expect(array.touched.value).toBe(false);
      expect(array.fields[0].touched.value).toBe(false);
      expect(array.fields[1].touched.value).toBe(false);
    });

    it('should reset touched of all fields to a specific state if touched passed', () => {
      const array = useFieldGroup([useField('a'), useField('b')]);

      array.reset({ touched: true });

      expect(array.touched.value).toBe(true);
      expect(array.fields[0].touched.value).toBe(true);
      expect(array.fields[1].touched.value).toBe(true);
    });

    it('should retain the disabled state of the field', () => {
      const enabled = ref(true);
      const array = useFieldGroup([useField('a'), useField('b')], { enabled });

      enabled.value = false;
      array.reset();

      expect(array.enabled.value).toBe(false);
    });
  });

  describe('at()', () => {
    it('should return field in the specific index', () => {
      const array = useFieldArray([useField('a'), useField('b'), useField('c')]);

      expect(array.at(1)).toBe(array.fields[1]);
    });

    it('should adjust negative index', () => {
      const array = useFieldArray([useField('a'), useField('b'), useField('c')]);

      expect(array.at(-1)).toBe(array.fields[2]);
    });

    it('should adjust index greater than or equal to length', () => {
      const array = useFieldArray([useField('a'), useField('b'), useField('c'), useField('d')]);

      // greater than length
      expect(array.at(5)).toBe(array.fields[1]);
      // equal to length
      expect(array.at(4)).toBe(array.fields[0]);
    });
  });

  describe('push()', () => {
    it('should insert into the last of fields', () => {
      const field = useField('a');
      const array = useFieldArray([useField('b')]);

      array.push(field);

      expect(array.at(1)).toBe(field);
    });

    it('should set parent of field to self', () => {
      const field = useField('a');
      const array = useFieldArray([useField('b')]);

      array.push(field);

      expect(field.parent.value).toBe(array);
    });
  });

  describe('insert()', () => {
    it('should insert into the specific index of fields', () => {
      const field = useField('a');
      const array = useFieldArray([useField('b'), useField('c')]);

      array.insert(1, field);

      expect(array.at(1)).toBe(field);
      expect(array.at(0).value.value).toBe('b');
      expect(array.at(2).value.value).toBe('c');
    });

    it('should set parent of field to self', () => {
      const field = useField('a');
      const array = useFieldArray([useField('b'), useField('c')]);

      array.insert(1, field);

      expect(field.parent.value).toBe(array);
    });
  });

  describe('removeAt()', () => {
    it('should remove the specific index of fields', () => {
      const array = useFieldArray([useField('a'), useField('b')]);

      array.removeAt(0);

      expect(array.fields.length).toBe(1);
      expect(array.fields[0].value.value).toBe('b');
    });

    it('should set parent of field to null', () => {
      const field = useField('a');
      const array = useFieldArray([field, useField('b')]);

      array.removeAt(0);

      expect(field.parent.value).toBe(null);
    });

    it('should adjust negative index', () => {
      const array = useFieldArray([useField('a'), useField('b')]);

      array.removeAt(-2);

      expect(array.fields.length).toBe(1);
      expect(array.fields[0].value.value).toBe('b');
    });

    it('should adjust index greater than or equal to length', () => {
      const array = useFieldArray([useField('a'), useField('b'), useField('c'), useField('d')]);

      // greater than length
      array.removeAt(5);
      expect(array.fields.length).toBe(3);
      expect(array.fields[0].value.value).toBe('a');
      expect(array.fields[1].value.value).toBe('c');
      expect(array.fields[2].value.value).toBe('d');

      // equal to length
      array.removeAt(3);
      expect(array.fields.length).toBe(2);
      expect(array.fields[0].value.value).toBe('c');
      expect(array.fields[1].value.value).toBe('d');
    });
  });
});
