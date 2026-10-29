import { createId } from './id.util';

describe('createId util', () => {
  it('prefixes the generated id with the given prefix', () => {
    expect(createId('win')).toMatch(/^win-/);
  });

  it('defaults to the "id" prefix when none is given', () => {
    expect(createId()).toMatch(/^id-/);
  });

  it('generates unique ids across many calls', () => {
    const ids = new Set(Array.from({ length: 200 }, () => createId('x')));
    expect(ids.size).toBe(200);
  });
});
