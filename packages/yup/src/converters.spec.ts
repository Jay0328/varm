import { setLocale, string } from 'yup';
import { flushTimers, sleep } from '__fixtures__/testUtils';
import { toYupAsyncValidator, toYupValidator } from '.';

describe('yup validator converters', () => {
  jest.useFakeTimers();

  beforeAll(() => {
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

  describe('toYupValidator', () => {
    it('should return null if valid', () => {
      const schema = string().required();
      const validator = toYupValidator(schema);

      expect(validator('value')).toEqual(null);
    });

    it('should only return first error default', () => {
      const schema = string().required();
      const validator = toYupValidator(schema);

      expect(validator('')).toEqual(['required']);
    });

    it('should return all if abortEarly = false', () => {
      const schema = string().required().length(3);
      const validator = toYupValidator(schema, {
        abortEarly: false,
      });

      expect(validator('')).toEqual([
        'required',
        {
          message: 'length',
          payload: { length: 3 },
        },
      ]);
    });
  });

  describe('toYupAsyncValidator', () => {
    it('should return null if valid', async () => {
      const schema = string().test({
        message: 'foo',
        test: () => sleep(1000).then(() => true),
      });
      const validator = toYupAsyncValidator(schema);

      const resultPromise = validator('');
      await flushTimers();
      const result = await resultPromise;

      expect(result).toEqual(null);
    });

    it('should only return first error default', async () => {
      const schema = string().test({
        message: 'foo',
        test: () => sleep(1000).then(() => false),
      });
      const validator = toYupAsyncValidator(schema);

      const resultPromise = validator('');
      await flushTimers();
      const result = await resultPromise;

      expect(result).toEqual(['foo']);
    });

    it('should return all if abortEarly = false', async () => {
      const schema = string()
        .required()
        .test({
          message: 'foo',
          test: () => sleep(1000).then(() => false),
        });
      const validator = toYupAsyncValidator(schema, {
        abortEarly: false,
      });

      const resultPromise = validator('');
      await flushTimers();
      const result = await resultPromise;

      expect(result).toEqual(['required', 'foo']);
    });
  });
});
