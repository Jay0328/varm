import { version } from '.';

describe('version', () => {
  it('should be string', () => {
    expect(typeof version).toBe('string');
  });
});
