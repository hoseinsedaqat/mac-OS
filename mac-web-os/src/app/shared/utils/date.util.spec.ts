import { addMonths, buildMonthGrid, dateKey, isSameDay, relativeFromNow, startOfMonth, endOfMonth } from './date.util';

describe('date utils', () => {
  it('dateKey formats a date as YYYY-MM-DD with zero padding', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('isSameDay compares only the calendar day, ignoring time of day', () => {
    const a = new Date(2026, 5, 10, 8, 0, 0);
    const b = new Date(2026, 5, 10, 23, 59, 0);
    const c = new Date(2026, 5, 11, 0, 0, 0);
    expect(isSameDay(a, b)).toBe(true);
    expect(isSameDay(a, c)).toBe(false);
  });

  it('startOfMonth / endOfMonth bracket the given month correctly', () => {
    const d = new Date(2026, 1, 15); // February 2026 (not a leap year)
    expect(startOfMonth(d).getDate()).toBe(1);
    expect(endOfMonth(d).getDate()).toBe(28);
  });

  it('addMonths rolls over year boundaries', () => {
    const d = new Date(2025, 11, 1); // December 2025
    const next = addMonths(d, 1);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(0);
  });

  it('buildMonthGrid always returns a full 6x7 grid (42 days)', () => {
    const grid = buildMonthGrid(new Date(2026, 1, 1));
    expect(grid.length).toBe(42);
  });

  it('relativeFromNow produces human-friendly recency labels', () => {
    const now = Date.now();
    expect(relativeFromNow(now)).toBe('just now');
    expect(relativeFromNow(now - 30_000)).toMatch(/s ago$/);
    expect(relativeFromNow(now - 5 * 60_000)).toMatch(/m ago$/);
    expect(relativeFromNow(now - 3 * 3_600_000)).toMatch(/h ago$/);
  });
});
