import RoundRobin from '../roundRobin';

describe('RoundRobin', () => {
  it('behaves like a standard round robin selection', () => {
    const robin = RoundRobin(15);
    const results = [];
    for (let i = 0; i < 100; i++) {
      results.push(robin());
    }
    expect(results).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    ]);
  });
});