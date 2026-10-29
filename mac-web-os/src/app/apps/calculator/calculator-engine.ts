/**
 * Minimal, dependency-free four-function calculator engine.
 *
 * Deliberately avoids `eval`/`Function`: every operator is applied through a
 * typed lookup table and all state transitions are explicit, so the engine
 * is simple to unit test and cannot execute arbitrary code.
 */
export type CalcOperator = '+' | '-' | '×' | '÷';

export interface CalculatorState {
  display: string;
  expression: string;
  previousValue: number | null;
  operator: CalcOperator | null;
  waitingForOperand: boolean;
  error: boolean;
}

export function initialCalculatorState(): CalculatorState {
  return {
    display: '0',
    expression: '',
    previousValue: null,
    operator: null,
    waitingForOperand: false,
    error: false,
  };
}

const OPERATIONS: Record<CalcOperator, (a: number, b: number) => number | null> = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '×': (a, b) => a * b,
  '÷': (a, b) => (b === 0 ? null : a / b),
};

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Math.round(value * 1e10) / 1e10;
  return rounded.toString();
}

export function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.error) return initialDigitAfterError(digit);
  if (state.waitingForOperand) {
    return { ...state, display: digit, waitingForOperand: false };
  }
  if (state.display === '0') {
    return { ...state, display: digit };
  }
  if (state.display.replace('-', '').replace('.', '').length >= 15) return state;
  return { ...state, display: state.display + digit };
}

function initialDigitAfterError(digit: string): CalculatorState {
  return { ...initialCalculatorState(), display: digit };
}

export function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.error) return { ...initialCalculatorState(), display: '0.' };
  if (state.waitingForOperand) {
    return { ...state, display: '0.', waitingForOperand: false };
  }
  if (state.display.includes('.')) return state;
  return { ...state, display: state.display + '.' };
}

export function clearEntry(state: CalculatorState): CalculatorState {
  return { ...state, display: '0', error: false };
}

export function clearAll(): CalculatorState {
  return initialCalculatorState();
}

export function toggleSign(state: CalculatorState): CalculatorState {
  if (state.display === '0' || state.error) return state;
  return {
    ...state,
    display: state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}`,
  };
}

export function applyPercent(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  const value = Number.parseFloat(state.display);
  const base = state.previousValue ?? value;
  const percentValue = state.previousValue !== null ? (base * value) / 100 : value / 100;
  return { ...state, display: formatNumber(percentValue) };
}

export function chooseOperator(state: CalculatorState, operator: CalcOperator): CalculatorState {
  if (state.error) return state;
  const inputValue = Number.parseFloat(state.display);

  if (state.previousValue === null) {
    return {
      ...state,
      previousValue: inputValue,
      operator,
      waitingForOperand: true,
      expression: `${formatNumber(inputValue)} ${operator}`,
    };
  }

  if (state.waitingForOperand) {
    return { ...state, operator, expression: `${formatNumber(state.previousValue)} ${operator}` };
  }

  const result = state.operator ? OPERATIONS[state.operator](state.previousValue, inputValue) : inputValue;
  if (result === null) {
    return { ...initialCalculatorState(), display: 'Error', error: true };
  }

  return {
    ...state,
    display: formatNumber(result),
    previousValue: result,
    operator,
    waitingForOperand: true,
    expression: `${formatNumber(result)} ${operator}`,
  };
}

export function computeEquals(state: CalculatorState): CalculatorState {
  if (state.error || state.operator === null || state.previousValue === null) {
    return state;
  }
  const inputValue = Number.parseFloat(state.display);
  const result = OPERATIONS[state.operator](state.previousValue, inputValue);
  if (result === null) {
    return { ...initialCalculatorState(), display: 'Error', error: true };
  }
  return {
    display: formatNumber(result),
    expression: `${formatNumber(state.previousValue)} ${state.operator} ${formatNumber(inputValue)} =`,
    previousValue: null,
    operator: null,
    waitingForOperand: true,
    error: false,
  };
}
