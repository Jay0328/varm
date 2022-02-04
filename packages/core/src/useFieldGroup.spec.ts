import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { asSleepAsyncValidator, flushTimers } from '__fixtures__/testUtils';
import { AsyncValidatorFn, ValidatorFn } from './validation';
import { FieldsOfGroup } from './field';
import { useField, useFieldArray, useFieldGroup } from '.';

describe('useFieldGroup()', () => {
  describe('enabled', () => {
    it('should be true default', () => {
      const field = useField('');
      const group = useFieldGroup({
        foo: field,
      });

      expect(group.enabled.value).toBe(true);
    });

    it('should equal to enabled from options', () => {
      const field = useField('');
      const group = useFieldGroup(
        {
          foo: field,
        },
        { enabled: false }
      );

      expect(group.enabled.value).toBe(false);
    });

    it('should support ref', () => {
      const enabled = ref(false);
      const field = useField('');
      const group = useFieldGroup(
        {
          foo: field,
        },
        { enabled }
      );

      expect(group.enabled.value).toBe(false);
      enabled.value = true;
      expect(group.enabled.value).toBe(true);
    });

    describe('given been set to enabled', () => {
      it('should be false if all fields disabled', () => {
        const enabled = ref(false);
        const group = useFieldGroup(
          {
            foo: useField('', { enabled }),
            bar: useField('', { enabled: false }),
          },
          { enabled: true }
        );

        expect(group.enabled.value).toBe(false);

        enabled.value = true;

        expect(group.enabled.value).toBe(true);
      });

      it('should be true if parent been set to enabled', () => {
        const group = useFieldGroup(
          {
            foo: useFieldGroup(
              {
                bar: useField(''),
              },
              { enabled: true }
            ),
          },
          { enabled: true }
        );

        expect(group.fields.foo.enabled.value).toBe(true);
      });

      it('should be false if parent been set to disabled', () => {
        const group = useFieldGroup(
          {
            foo: useFieldGroup(
              {
                bar: useField(''),
              },
              { enabled: true }
            ),
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
            foo: useFieldGroup(
              {
                bar: useField(''),
              },
              { enabled: false }
            ),
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
      const group = useFieldGroup({
        foo: useField('value'),
      });

      expect(group.touched.value).toBe(false);
    });

    it('should sync w/ all enabled descendants', () => {
      const enabled = ref(true);
      const group = useFieldGroup({
        foo: useField('', { enabled }),
        bar: useFieldGroup({
          baz: useField(''),
        }),
        qux: useFieldArray([useField(''), useField('')]),
      });

      group.fields.bar.fields.baz.setTouched(true);
      expect(group.touched.value).toEqual(true);
      group.fields.qux.fields[0].setTouched(true);
      expect(group.touched.value).toEqual(true);
      group.fields.bar.fields.baz.setTouched(false);
      expect(group.touched.value).toEqual(true);
      group.fields.qux.fields[0].setTouched(false);
      expect(group.touched.value).toEqual(false);

      group.fields.foo.setTouched(true);
      expect(group.touched.value).toEqual(true);
      enabled.value = false;
      expect(group.touched.value).toEqual(false);
      enabled.value = true;
      expect(group.touched.value).toEqual(true);
    });

    describe('when setTouched(true)', () => {
      it('should be true', () => {
        const group = useFieldGroup({
          foo: useField('value'),
        });

        group.setTouched(true);

        expect(group.touched.value).toBe(true);
      });

      it('should also set touched of all descendants to true', () => {
        const group = useFieldGroup({
          foo: useField('foo'),
          bar: useFieldGroup({
            baz: useField('vaz'),
          }),
        });

        group.setTouched(true);

        expect(group.fields.foo.touched.value).toBe(true);
        expect(group.fields.bar.touched.value).toBe(true);
        expect(group.fields.bar.fields.baz.touched.value).toBe(true);
      });
    });

    describe('when setTouched(false)', () => {
      it('should be false', () => {
        const group = useFieldGroup({
          foo: useField('value'),
        });

        group.setTouched(true);
        group.setTouched(false);

        expect(group.touched.value).toEqual(false);
      });

      it('should also set touched of all descendants to false', () => {
        const group = useFieldGroup({
          foo: useField('foo'),
          bar: useFieldGroup({
            baz: useField('vaz'),
          }),
        });

        group.setTouched(true);
        group.setTouched(false);

        expect(group.fields.foo.touched.value).toBe(false);
        expect(group.fields.bar.touched.value).toBe(false);
        expect(group.fields.bar.fields.baz.touched.value).toBe(false);
      });
    });
  });

  describe('dirty', () => {
    it('should be false after created', () => {
      const group = useFieldGroup({
        foo: useField('value'),
      });

      expect(group.dirty.value).toBe(false);
    });

    it('should sync w/ all enabled descendants', () => {
      const enabled = ref(true);
      const group = useFieldGroup({
        foo: useField('', { enabled }),
        bar: useFieldGroup({
          baz: useField(''),
        }),
        qux: useFieldArray([useField(''), useField('')]),
      });

      group.fields.bar.fields.baz.setValue('value');
      expect(group.dirty.value).toEqual(true);
      group.fields.qux.fields[0].setValue('value');
      expect(group.dirty.value).toEqual(true);
      group.fields.bar.fields.baz.setValue('');
      expect(group.dirty.value).toEqual(true);
      group.fields.qux.fields[0].setValue('');
      expect(group.dirty.value).toEqual(false);

      group.fields.foo.setValue('value');
      expect(group.dirty.value).toEqual(true);
      enabled.value = false;
      expect(group.dirty.value).toEqual(false);
      enabled.value = true;
      expect(group.dirty.value).toEqual(true);
    });
  });

  describe('value', () => {
    it('should sync w/ all enabled descendants', () => {
      const enabled = ref(true);
      const group = useFieldGroup({
        foo: useField('foo', { enabled }),
        bar: useFieldGroup({
          baz: useField(1),
        }),
        qux: useFieldArray([useField('item1'), useField('item2')]),
      });

      expect(group.value.value).toEqual({
        foo: 'foo',
        bar: {
          baz: 1,
        },
        qux: ['item1', 'item2'],
      });

      group.fields.foo.value.value = 'foo_foo';
      group.fields.bar.fields.baz.value.value = 2;
      group.fields.qux.push(useField('item3'));
      expect(group.value.value).toEqual({
        foo: 'foo_foo',
        bar: {
          baz: 2,
        },
        qux: ['item1', 'item2', 'item3'],
      });

      enabled.value = false;
      expect(group.value.value).toEqual({
        bar: {
          baz: 2,
        },
        qux: ['item1', 'item2', 'item3'],
      });
      enabled.value = true;
      expect(group.value.value).toEqual({
        foo: 'foo_foo',
        bar: {
          baz: 2,
        },
        qux: ['item1', 'item2', 'item3'],
      });
    });

    it('should collect all descendants if self disabled', () => {
      const enabled = ref(false);
      const group = useFieldGroup(
        {
          foo: useField('foo', { enabled: false }),
          bar: useFieldGroup({
            baz: useField(1),
          }),
          qux: useFieldArray([useField('item1'), useField('item2')]),
        },
        { enabled }
      );

      expect(group.value.value).toEqual({
        foo: 'foo',
        bar: {
          baz: 1,
        },
        qux: ['item1', 'item2'],
      });

      enabled.value = true;
      expect(group.value.value).toEqual({
        bar: {
          baz: 1,
        },
        qux: ['item1', 'item2'],
      });
    });

    describe('setValue()', () => {
      it('should set value of all fields', () => {
        const group = useFieldGroup({
          a: useField('foo'),
          b: useFieldGroup({
            c: useField('bar'),
            d: useField('baz'),
          }),
        });

        group.setValue({
          a: 'a',
          b: {
            c: 'c',
            d: 'd',
          },
        });

        expect(group.value.value).toEqual({
          a: 'a',
          b: {
            c: 'c',
            d: 'd',
          },
        });
      });
    });

    describe('patchValue()', () => {
      it('should only set passed value to corresponding fields', () => {
        const group = useFieldGroup({
          a: useField('foo'),
          b: useFieldGroup({
            c: useField('bar'),
            d: useField('baz'),
          }),
        });

        group.patchValue({
          b: {
            c: 'qux',
          },
        });

        expect(group.value.value).toEqual({
          a: 'foo',
          b: {
            c: 'qux',
            d: 'baz',
          },
        });
      });
    });
  });

  describe('setErrors()', () => {
    it('should set errors', () => {
      const group = useFieldGroup({
        foo: useField('value'),
      });

      group.setErrors([
        'foo',
        {
          message: 'bar',
          payload: { baz: 1 },
        },
      ]);

      expect(group.valid.value).toBe(false);
      expect(group.errors.value).toEqual([
        'foo',
        {
          message: 'bar',
          payload: { baz: 1 },
        },
      ]);
    });

    it('should support set single error', () => {
      const group = useFieldGroup({
        foo: useField('value'),
      });

      group.setErrors('foo');

      expect(group.valid.value).toBe(false);
      expect(group.errors.value).toEqual(['foo']);
    });

    it('should reset the errors and validity when the value changes', () => {
      const group = useFieldGroup(
        {
          foo: useField('value'),
        },
        (value) => ((value as any).foo ? null : 'required')
      );

      group.setErrors('error');
      group.setValue({ foo: '' });

      expect(group.errors.value).toEqual(['required']);

      group.setErrors('error');
      group.setValue({ foo: 'value' });

      expect(group.errors.value).toEqual(null);
    });

    it("should not reset parent's errors", () => {
      const group = useFieldGroup({
        foo: useField('value'),
      });
      const parent = useFieldGroup({
        a: group,
      });

      parent.setErrors('parent');
      group.setErrors('group');

      expect(parent.errors.value).toEqual(['parent']);
    });
  });

  describe('validation', () => {
    it('should trigger validation once after created', () => {
      const validator: ValidatorFn = (value) => ((value as any).foo ? null : 'required');
      const mockValidator = jest.fn(validator);
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        mockValidator
      );

      expect(mockValidator).toBeCalledTimes(1);
      expect(group.errors.value).toEqual(['required']);
    });

    it('should support multiple validators if passed', () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        [
          (value) => ((value as any).foo ? null : 'required'),
          (value) => ((value as any).foo.length > 2 ? null : 'minLength'),
        ]
      );

      expect(group.valid.value).toEqual(false);
      expect(group.errors.value).toEqual(['required']);

      group.setValue({ foo: 'a' });
      expect(group.valid.value).toBe(false);
      expect(group.errors.value).toEqual(['minLength']);

      group.setValue({ foo: 'aaa' });
      expect(group.valid.value).toBe(true);
      expect(group.errors.value).toBe(null);
    });

    it('should support single validator from options', () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        { validators: (value) => ((value as any).foo ? null : 'required') }
      );

      expect(group.valid.value).toEqual(false);
      expect(group.errors.value).toEqual(['required']);

      group.setValue({ foo: 'value' });
      expect(group.valid.value).toBe(true);
      expect(group.errors.value).toBe(null);
    });

    it('should support multiple validators from options', () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        {
          validators: [
            (value) => ((value as any).foo ? null : 'required'),
            (value) => ((value as any).foo.length > 2 ? null : 'minLength'),
          ],
        }
      );

      expect(group.valid.value).toEqual(false);
      expect(group.errors.value).toEqual(['required']);

      group.setValue({ foo: 'a' });
      expect(group.valid.value).toBe(false);
      expect(group.errors.value).toEqual(['minLength']);

      group.setValue({ foo: 'aaa' });
      expect(group.valid.value).toBe(true);
      expect(group.errors.value).toBe(null);
    });

    it('should support a null validators value', () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        {
          validators: null,
        }
      );

      expect(group.valid.value).toEqual(true);
      expect(group.errors.value).toEqual(null);
    });

    it('should support an empty options', () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        {}
      );

      expect(group.valid.value).toEqual(true);
      expect(group.errors.value).toEqual(null);
    });

    it('should support validator return multiple errors', () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        () => ['required', 'error']
      );

      expect(group.valid.value).toEqual(false);
      expect(group.errors.value).toEqual(['required', 'error']);
    });

    it('should run all validators and return flatted errors if abortEarly = false', () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        {
          validators: [
            (value) => ((value as any).foo ? null : 'required'),
            (value) => ((value as any).foo.length > 2 ? null : ['min', 'length']),
          ],
          abortEarly: false,
        }
      );

      expect(group.valid.value).toEqual(false);
      expect(group.errors.value).toEqual(['required', 'min', 'length']);
    });

    describe('when value changed', () => {
      it('should trigger validation once', () => {
        const validator: ValidatorFn = (value) => ((value as any).foo ? null : 'required');
        const mockValidator = jest.fn(validator);
        const group = useFieldGroup(
          {
            foo: useField(''),
          },
          { validators: mockValidator }
        );

        group.setValue({ foo: 'foo' });

        // since triggered once after created
        expect(mockValidator).toBeCalledTimes(2);
        expect(group.errors.value).toBe(null);
        expect(group.valid.value).toBe(true);
      });
    });

    describe('when validator changed', () => {
      it('should re-trigger validation once', () => {
        const validator = ref<ValidatorFn>((value) => ((value as any).foo ? null : 'required'));
        const group = useFieldGroup(
          {
            foo: useField(''),
          },
          { validators: validator }
        );

        expect(group.valid.value).toBe(false);
        expect(group.errors.value).toEqual(['required']);

        const mockValidator = jest.fn((value) => ((value as any).foo ? 'no' : null));
        validator.value = mockValidator;

        expect(mockValidator).toBeCalledTimes(1);
        expect(group.valid.value).toBe(true);
        expect(group.errors.value).toBe(null);
      });
    });

    describe('given changed to enabled', () => {
      it('should re-trigger validation once', () => {
        const validator = jest.fn((value) => ((value as any).foo ? null : 'required'));
        const enabled = ref(false);
        const group = useFieldGroup(
          {
            foo: useField(''),
          },
          {
            validators: validator,
            enabled,
          }
        );

        expect(validator).not.toBeCalled();
        expect(group.valid.value).toBe(true);
        expect(group.errors.value).toBe(null);

        enabled.value = true;

        expect(validator).toBeCalledTimes(1);
        expect(group.valid.value).toBe(false);
        expect(group.errors.value).toEqual(['required']);
      });
    });

    describe('given chagned to disabled', () => {
      it('should reset valid and errors', () => {
        const validator = jest.fn((value) => ((value as any).foo ? null : 'required'));
        const enabled = ref(true);
        const group = useFieldGroup(
          {
            foo: useField(''),
          },
          {
            validators: validator,
            enabled,
          }
        );

        expect(group.valid.value).toBe(false);
        expect(group.errors.value).toEqual(['required']);

        enabled.value = false;

        expect(group.valid.value).toBe(true);
        expect(group.errors.value).toBe(null);
      });
    });

    describe('given disabled', () => {
      it('should always be valid and w/o errors and not to trigger validation', () => {
        const validator = jest.fn(() => 'error');
        const group = useFieldGroup(
          {
            foo: useField(''),
          },
          {
            validators: validator,
            enabled: false,
          }
        );

        group.setValue({ foo: 'foo' });
        group.setValue({ foo: 'bar' });

        expect(validator).not.toBeCalled();
        expect(group.errors.value).toBe(null);
        expect(group.valid.value).toBe(true);
      });
    });
  });

  describe('async validation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should trigger async validation once after created', async () => {
      const validator = asSleepAsyncValidator((value) => ((value as any).foo ? null : 'required'), 1000);
      const mockValidator = jest.fn(validator);
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        {
          asyncValidators: mockValidator,
        }
      );

      await flushTimers(1000);

      expect(mockValidator).toBeCalledTimes(1);
      expect(group.errors.value).toEqual(['required']);
    });

    it('should only fired after validation passed', () => {
      const asyncValidator = jest.fn(asSleepAsyncValidator(() => null, 1000));
      const group = useFieldGroup(
        {
          foo: useField('value'),
        },
        (value) => ((value as any).foo.length > 5 ? null : 'error'),
        asyncValidator
      );

      expect(asyncValidator).not.toBeCalled();

      group.setValue({ foo: 'value value' });

      expect(asyncValidator).toBeCalledTimes(1);
    });

    it('should mark pending while running async validation', async () => {
      const asyncValidator = jest.fn(asSleepAsyncValidator(() => 'error', 1000));
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        undefined,
        asyncValidator
      );

      expect(group.pending.value).toBe(true);

      await flushTimers(1000);

      expect(group.pending.value).toBe(false);
    });

    it('should set error', async () => {
      const asyncValidator = jest.fn(asSleepAsyncValidator((value) => ((value as any).foo ? null : 'error'), 1000));
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        undefined,
        asyncValidator
      );

      expect(asyncValidator).toBeCalledTimes(1);
      expect(group.valid.value).toBe(false);
      expect(group.errors.value).toBe(null);

      await flushTimers(1000);

      expect(group.valid.value).toBe(false);
      expect(group.errors.value).toEqual(['error']);
    });

    it('should cancel pending async validation before validating', async () => {
      const validator1 = jest.fn(asSleepAsyncValidator((value) => ((value as any).foo ? null : '1'), 1000));
      const validator2 = jest.fn(asSleepAsyncValidator((value) => ((value as any).foo ? null : '2'), 2000));
      const asyncValidator = ref(validator1);
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        undefined,
        asyncValidator
      );

      asyncValidator.value = validator2;

      expect(validator1).toBeCalledTimes(1);
      expect(validator2).toBeCalledTimes(1);
      expect(group.pending.value).toBe(true);
      expect(group.valid.value).toBe(false);
      expect(group.errors.value).toBe(null);

      await flushTimers(1000);
      expect(group.pending.value).toBe(true);
      expect(group.valid.value).toBe(false);
      expect(group.errors.value).toBe(null);

      await flushTimers(1000);
      expect(group.pending.value).toBe(false);
      expect(group.valid.value).toBe(false);
      expect(group.errors.value).toEqual(['2']);
    });

    it('should support multiple validators if passed', async () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        undefined,
        [
          asSleepAsyncValidator((value) => ((value as any).foo ? null : 'required'), 1000),
          asSleepAsyncValidator((value) => ((value as any).foo.length > 2 ? null : 'minLength'), 1000),
        ]
      );

      await flushTimers(1000);
      await flushTimers(1000);
      expect(group.valid.value).toEqual(false);
      expect(group.errors.value).toEqual(['required']);

      group.setValue({ foo: 'a' });
      await flushTimers(1000);
      await flushTimers(1000);
      expect(group.valid.value).toBe(false);
      expect(group.errors.value).toEqual(['minLength']);

      group.setValue({ foo: 'aaa' });
      await flushTimers(1000);
      await flushTimers(1000);
      expect(group.valid.value).toBe(true);
      expect(group.errors.value).toBe(null);
    });

    it('should support single validator from options', async () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        {
          asyncValidators: asSleepAsyncValidator((value) => ((value as any).foo ? null : 'required'), 1000),
        }
      );

      await flushTimers(1000);
      expect(group.valid.value).toEqual(false);
      expect(group.errors.value).toEqual(['required']);

      group.setValue({ foo: 'value' });
      await flushTimers(1000);
      expect(group.valid.value).toBe(true);
      expect(group.errors.value).toBe(null);
    });

    it('should support multiple validators from options', async () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        {
          asyncValidators: [
            asSleepAsyncValidator((value) => ((value as any).foo ? null : 'required'), 1000),
            asSleepAsyncValidator((value) => ((value as any).foo.length > 2 ? null : 'minLength'), 1000),
          ],
        }
      );

      await flushTimers(1000);
      await flushTimers(1000);
      expect(group.valid.value).toEqual(false);
      expect(group.errors.value).toEqual(['required']);

      group.setValue({ foo: 'a' });
      await flushTimers(1000);
      await flushTimers(1000);
      expect(group.valid.value).toBe(false);
      expect(group.errors.value).toEqual(['minLength']);

      group.setValue({ foo: 'aaa' });
      await flushTimers(1000);
      await flushTimers(1000);
      expect(group.valid.value).toBe(true);
      expect(group.errors.value).toBe(null);
    });

    it('should support a null async validators value', async () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        { validators: null }
      );

      await flushPromises();

      expect(group.valid.value).toEqual(true);
    });

    it('should support an empty options', async () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        {}
      );

      await flushPromises();

      expect(group.valid.value).toEqual(true);
    });

    it('should support validator return multiple errors', async () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
        },
        undefined,
        asSleepAsyncValidator(() => ['required', 'error'], 1000)
      );

      await flushTimers(1000);

      expect(group.valid.value).toEqual(false);
      expect(group.errors.value).toEqual(['required', 'error']);
    });

    it('should run all validators and return flatted errors if asyncAbortEarly = false', async () => {
      const field = useFieldGroup(
        {
          foo: useField(''),
        },
        {
          asyncValidators: [
            asSleepAsyncValidator((value) => ((value as any).foo ? null : 'required'), 1000),
            asSleepAsyncValidator((value) => ((value as any).foo.length > 2 ? null : ['min', 'length']), 1000),
          ],
          asyncAbortEarly: false,
        }
      );

      await flushTimers(1000);
      await flushTimers(1000);

      expect(field.valid.value).toEqual(false);
      expect(field.errors.value).toEqual(['required', 'min', 'length']);
    });

    describe('when value changed', () => {
      it('should trigger validation once', async () => {
        const validator: AsyncValidatorFn = asSleepAsyncValidator(
          (value) => ((value as any).foo ? null : 'required'),
          1000
        );
        const mockValidator = jest.fn(validator);
        const group = useFieldGroup(
          {
            foo: useField(''),
          },
          {
            asyncValidators: mockValidator,
          }
        );

        group.setValue({ foo: 'foo' });

        await flushTimers(1000);

        // since triggered once after created
        expect(mockValidator).toBeCalledTimes(2);
        expect(group.valid.value).toBe(true);
        expect(group.errors.value).toBe(null);
      });
    });

    describe('when async validator changed', () => {
      it('should re-trigger validation once', async () => {
        const validator = ref(asSleepAsyncValidator((value) => ((value as any).foo ? null : 'required'), 1000));
        const group = useFieldGroup(
          {
            foo: useField(''),
          },
          {
            asyncValidators: validator,
          }
        );

        await flushTimers(1000);
        expect(group.errors.value).toEqual(['required']);
        expect(group.valid.value).toBe(false);

        const mockValidator = jest.fn(asSleepAsyncValidator((value) => ((value as any).foo ? 'no' : null), 1000));
        validator.value = mockValidator;

        await flushTimers(1000);
        expect(mockValidator).toBeCalledTimes(1);
        expect(group.errors.value).toBe(null);
        expect(group.valid.value).toBe(true);
      });
    });

    describe('given changed to enabled', () => {
      it('should re-trigger validation once', async () => {
        const validator = jest.fn(asSleepAsyncValidator((value) => ((value as any).foo ? null : 'required'), 1000));
        const enabled = ref(false);
        const group = useFieldGroup(
          {
            foo: useField(''),
          },
          {
            asyncValidators: validator,
            enabled,
          }
        );

        await flushTimers(1000);
        expect(validator).not.toBeCalled();
        expect(group.errors.value).toBe(null);
        expect(group.valid.value).toBe(true);

        enabled.value = true;
        await flushTimers(1000);
        expect(validator).toBeCalledTimes(1);
        expect(group.errors.value).toEqual(['required']);
        expect(group.valid.value).toBe(false);
      });
    });

    describe('given changed to disabled', () => {
      describe('while async validating', () => {
        it('should not change validity state', async () => {
          const enabled = ref(true);
          const group = useFieldGroup(
            {
              foo: useField(''),
            },
            {
              asyncValidators: asSleepAsyncValidator((value) => ((value as any).foo ? null : 'required'), 1000),
              enabled,
            }
          );

          enabled.value = false;

          await flushTimers(1000);
          expect(group.pending.value).toBe(false);
          expect(group.valid.value).toBe(true);
          expect(group.errors.value).toBe(null);
        });
      });
    });

    describe('given disabled', () => {
      it('should be valid and not trigger async validation', async () => {
        const asyncValidator = jest.fn(asSleepAsyncValidator(() => 'error', 1000));
        const group = useFieldGroup(
          {
            foo: useField(''),
          },
          {
            asyncValidators: asyncValidator,
            enabled: false,
          }
        );

        group.setValue({ foo: 'foo' });

        await flushTimers();

        expect(asyncValidator).not.toBeCalled();
        expect(group.errors.value).toBe(null);
        expect(group.valid.value).toBe(true);
      });
    });
  });

  describe('valid', () => {
    it('should be false if invalid', () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
          bar: useField(''),
        },
        { validators: () => 'error' }
      );

      expect(group.valid.value).toBe(false);
    });

    it('should be false if in async validating', () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
          bar: useField(''),
        },
        { asyncValidators: asSleepAsyncValidator(() => 'error') }
      );

      expect(group.valid.value).toBe(false);
    });

    it('should be true if all enabled descendants valid or not in pending', () => {
      const enabled = ref(true);
      const group = useFieldGroup({
        foo: useField('', { enabled }),
        bar: useField(''),
      });

      group.fields.foo.setErrors('error');
      expect(group.valid.value).toBe(false);

      enabled.value = false;
      group.fields.foo.setErrors('error');
      expect(group.valid.value).toBe(true);
    });
  });

  describe('pending', () => {
    it('should be false if not in async validating', () => {
      const group = useFieldGroup({
        foo: useField(''),
        bar: useField(''),
      });

      expect(group.pending.value).toBe(false);
    });

    it('should be true if in async validating', () => {
      const group = useFieldGroup(
        {
          foo: useField(''),
          bar: useField(''),
        },
        { asyncValidators: asSleepAsyncValidator(() => 'error') }
      );

      expect(group.pending.value).toBe(true);
    });

    it('should be true if some enabled descendants pending', () => {
      const enabled = ref(true);
      const group = useFieldGroup({
        foo: useField('', {
          asyncValidators: asSleepAsyncValidator(() => 'error', 1000),
          enabled,
        }),
        bar: useField(''),
      });

      expect(group.pending.value).toBe(true);

      enabled.value = false;
      expect(group.pending.value).toBe(false);
    });
  });

  describe('reset()', () => {
    it('should reset values of all fields to initial value', () => {
      const group = useFieldGroup({
        a: useField('a'),
        b: useField('b'),
      });
      group.fields.a.setValue('c');
      group.fields.b.setValue('d');

      group.reset();

      expect(group.fields.a.initialValue.value).toBe('a');
      expect(group.fields.a.value.value).toBe('a');
      expect(group.fields.b.initialValue.value).toBe('b');
      expect(group.fields.b.value.value).toBe('b');
    });

    it('should reset both initial value and value of all fields to a specific value if value passed', () => {
      const group = useFieldGroup({
        a: useField('a'),
        b: useField('b'),
      });
      group.fields.a.setValue('c');
      group.fields.b.setValue('d');

      group.reset({
        value: {
          a: 'e',
        },
      });

      expect(group.fields.a.initialValue.value).toBe('e');
      expect(group.fields.a.value.value).toBe('e');
      expect(group.fields.b.initialValue.value).toBe('b');
      expect(group.fields.b.value.value).toBe('b');
    });

    it('should reset touched of all fields to false', () => {
      const group = useFieldGroup({
        a: useField('a'),
        b: useField('b'),
      });

      group.setTouched(true);
      group.reset();

      expect(group.touched.value).toBe(false);
      expect(group.fields.a.touched.value).toBe(false);
      expect(group.fields.b.touched.value).toBe(false);
    });

    it('should reset touched of all fields to a specific state if touched passed', () => {
      const group = useFieldGroup({
        a: useField('a'),
        b: useField('b'),
      });

      group.reset({ touched: true });

      expect(group.touched.value).toBe(true);
      expect(group.fields.a.touched.value).toBe(true);
      expect(group.fields.b.touched.value).toBe(true);
    });

    it('should retain the disabled state of the field', () => {
      const enabled = ref(true);
      const group = useFieldGroup(
        {
          a: useField('a'),
          b: useField('b'),
        },
        { enabled }
      );

      enabled.value = false;
      group.reset();

      expect(group.enabled.value).toBe(false);
    });
  });

  describe('addField()', () => {
    describe('given the name has not been registered', () => {
      it('should add field to the name of fields', () => {
        const field = useField<string | undefined>('a');
        const group = useFieldGroup<
          FieldsOfGroup<{
            foo?: string;
          }>
        >({});

        group.addField('foo', field);

        expect(group.fields.foo).toBe(field);
      });

      it('should set parent of field to self', () => {
        const field = useField<string | undefined>('a');
        const group = useFieldGroup<
          FieldsOfGroup<{
            foo?: string;
          }>
        >({});

        group.addField('foo', field);

        expect(field.parent.value).toBe(group);
      });

      it('should return the added field', () => {
        const field = useField<string | undefined>('a');
        const group = useFieldGroup<
          FieldsOfGroup<{
            foo?: string;
          }>
        >({});

        expect(group.addField('foo', field)).toBe(field);
      });
    });

    describe('given the name has been registered', () => {
      it('should not add and return original', () => {
        const original = useField('a');
        const field = useField('b');
        const group = useFieldGroup({
          foo: original,
        });

        expect(group.addField('foo', field)).toBe(original);
        expect(group.fields.foo).toBe(original);
      });
    });
  });

  describe('setField()', () => {
    describe('given the name has not been registered', () => {
      it('should set field to the name of fields', () => {
        const field = useField<string | undefined>('a');
        const group = useFieldGroup<
          FieldsOfGroup<{
            foo?: string;
          }>
        >({});

        group.setField('foo', field);

        expect(group.fields.foo).toBe(field);
      });

      it('should set parent of field to self', () => {
        const field = useField<string | undefined>('a');
        const group = useFieldGroup<
          FieldsOfGroup<{
            foo?: string;
          }>
        >({});

        group.setField('foo', field);

        expect(field.parent.value).toBe(group);
      });
    });

    describe('given the name has been registered', () => {
      it('should override the original', () => {
        const original = useField('a');
        const field = useField('b');
        const group = useFieldGroup({
          foo: original,
        });

        group.setField('foo', field);

        expect(group.fields.foo).toBe(field);
        expect(original.parent.value).toBe(null);
      });
    });
  });

  describe('removeField()', () => {
    it('should remove the specific name of fields', () => {
      const group = useFieldGroup({
        foo: useField('a'),
        bar: useField('b'),
      });

      group.removeField('bar');

      expect(group.fields.bar).toBe(undefined);
    });

    it('should set parent of field to null', () => {
      const field = useField('b');
      const group = useFieldGroup({
        foo: useField('a'),
        bar: field,
      });

      group.removeField('bar');

      expect(field.parent.value).toBe(null);
    });
  });
});
