import { clamp } from './clamp.util';

describe('clamp util', () => {
  it('returns the value unchanged when it is within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the minimum when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to the maximum when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('handles min === max by always returning that value', () => {
    expect(clamp(42, 7, 7)).toBe(7);
  });
});
