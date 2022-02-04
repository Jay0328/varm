import { ValidationError } from 'yup';

export function isYupError(error: unknown): error is ValidationError {
  // Yup errors have a name prop one them.
  // https://github.com/jquense/yup#validationerrorerrors-string--arraystring-value-any-path-string
  return !!error && (error as ValidationError).name === 'ValidationError';
}
