import { AnySchema, setLocale, string } from 'yup';
import { useField } from '@varm/core';
import { flushTimers, sleep } from '__fixtures__/testUtils';
import { registerYupValidator, ToYupValidatorOptions, unregisterYupValidator } from '.';

describe('registerYupValidator', () => {
  const toSecondErrors: ToYupValidatorOptions['toErrors'] = (error) => error.errors[1];

  beforeAll(() => {
    jest.useFakeTimers();

    setLocale({
      mixed: {
        required: 'required',
      },
      string: {
        length: ({ length }) => ({
          message: 'length',
          payload: { length },
        }),
      },
    });
  });

  afterEach(() => {
    unregisterYupValidator();
  });

  describe('sync', () => {
    let schema: AnySchema;

    beforeEach(() => {
      schema = string().required().length(3);
    });

    describe('no options', () => {
      beforeEach(() => {
        registerYupValidator();
      });

      it('should return first error', () => {
        const field = useField('', schema);

        expect(field.errors.value).toEqual(['required']);
      });
    });

    describe('abortEarly = false', () => {
      beforeEach(() => {
        registerYupValidator({ abortEarly: false });
      });

      it('should return all errors', () => {
        const field = useField('', schema);

        expect(field.errors.value).toEqual([
          'required',
          {
            message: 'length',
            payload: { length: 3 },
          },
        ]);
      });
    });

    describe('toErrors', () => {
      beforeEach(() => {
        registerYupValidator({ abortEarly: false, toErrors: toSecondErrors });
      });

      it('should use toErrors to convert', () => {
        const field = useField('', schema);

        expect(field.errors.value).toEqual([
          {
            message: 'length',
            payload: { length: 3 },
          },
        ]);
      });
    });
  });

  describe('async', () => {
    let schema: AnySchema;

    beforeEach(() => {
      schema = string()
        .test({
          message: 'foo',
          test: () => sleep(1000).then(() => false),
        })
        .test({
          message: 'bar',
          test: () => sleep(1000).then(() => false),
        });
    });

    describe('no options', () => {
      beforeEach(() => {
        registerYupValidator();
      });

      it('should return first error', async () => {
        const field = useField('', undefined, schema);

        await flushTimers(1000);
        await flushTimers(1000);

        expect(field.errors.value).toEqual(['foo']);
      });
    });

    describe('abortEarly = false', () => {
      beforeEach(() => {
        registerYupValidator({ abortEarly: false });
      });

      it('should return all errors', async () => {
        const field = useField('', undefined, schema);

        await flushTimers(1000);

        expect(field.errors.value).toEqual(['foo', 'bar']);
      });
    });

    describe('toErrors', () => {
      beforeEach(() => {
        registerYupValidator({ abortEarly: false, toErrors: toSecondErrors });
      });

      it('should use toErrors to convert', async () => {
        const field = useField('', undefined, schema);

        await flushTimers(1000);

        expect(field.errors.value).toEqual(['bar']);
      });
    });
  });
});
