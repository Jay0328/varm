import { someCoreLogic } from '.';

describe('someCoreLogic()', () => {
  it('should return array', () => {
    expect(Array.isArray(someCoreLogic())).toBe(true);
  });
});
