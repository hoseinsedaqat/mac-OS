import {
  applyPercent,
  chooseOperator,
  clearAll,
  clearEntry,
  computeEquals,
  inputDecimal,
  inputDigit,
  initialCalculatorState,
  toggleSign,
} from './calculator-engine';

describe('Calculator engine (pure, non-eval arithmetic)', () => {
  it('starts with a clean zeroed state', () => {
    const s = initialCalculatorState();
    expect(s.display).toBe('0');
    expect(s.error).toBe(false);
  });

  it('builds up a multi-digit number digit by digit', () => {
    let s = initialCalculatorState();
    s = inputDigit(s, '1');
    s = inputDigit(s, '2');
    s = inputDigit(s, '3');
    expect(s.display).toBe('123');
  });

  it('adds a decimal point only once', () => {
    let s = initialCalculatorState();
    s = inputDigit(s, '1');
    s = inputDecimal(s);
    s = inputDigit(s, '5');
    s = inputDecimal(s);
    expect(s.display).toBe('1.5');
  });

  it('performs addition end to end: 2 + 3 = 5', () => {
    let s = initialCalculatorState();
    s = inputDigit(s, '2');
    s = chooseOperator(s, '+');
    s = inputDigit(s, '3');
    s = computeEquals(s);
    expect(s.display).toBe('5');
  });

  it('performs subtraction, multiplication and division correctly', () => {
    let sub = chooseOperator(inputDigit(initialCalculatorState(), '9'), '-');
    sub = computeEquals(inputDigit(sub, '4'));
    expect(sub.display).toBe('5');

    let mul = chooseOperator(inputDigit(initialCalculatorState(), '6'), '×');
    mul = computeEquals(inputDigit(mul, '7'));
    expect(mul.display).toBe('42');

    let div = chooseOperator(inputDigit(initialCalculatorState(), '8'), '÷');
    div = computeEquals(inputDigit(div, '2'));
    expect(div.display).toBe('4');
  });

  it('chains operators without pressing equals (e.g. 2 + 3 + 4)', () => {
    let s = inputDigit(initialCalculatorState(), '2');
    s = chooseOperator(s, '+');
    s = inputDigit(s, '3');
    s = chooseOperator(s, '+');
    expect(s.display).toBe('5');
    s = inputDigit(s, '4');
    s = computeEquals(s);
    expect(s.display).toBe('9');
  });

  it('handles divide-by-zero by entering a dedicated error state, not NaN/Infinity', () => {
    let s = inputDigit(initialCalculatorState(), '5');
    s = chooseOperator(s, '÷');
    s = inputDigit(s, '0');
    s = computeEquals(s);
    expect(s.error).toBe(true);
    expect(s.display).toBe('Error');
  });

  it('recovers from the error state on the next digit press', () => {
    let s = inputDigit(initialCalculatorState(), '5');
    s = chooseOperator(s, '÷');
    s = inputDigit(s, '0');
    s = computeEquals(s);
    s = inputDigit(s, '7');
    expect(s.error).toBe(false);
    expect(s.display).toBe('7');
  });

  it('toggleSign flips the sign of the current display value', () => {
    let s = inputDigit(initialCalculatorState(), '9');
    s = toggleSign(s);
    expect(s.display).toBe('-9');
    s = toggleSign(s);
    expect(s.display).toBe('9');
  });

  it('applyPercent converts the current value to a percentage', () => {
    let s = inputDigit(initialCalculatorState(), '5');
    s = inputDigit(s, '0');
    s = applyPercent(s);
    expect(s.display).toBe('0.5');
  });

  it('clearEntry resets only the display, clearAll resets the whole state', () => {
    let s = inputDigit(initialCalculatorState(), '9');
    s = clearEntry(s);
    expect(s.display).toBe('0');

    s = chooseOperator(inputDigit(initialCalculatorState(), '9'), '+');
    s = clearAll();
    expect(s).toEqual(initialCalculatorState());
  });
});
