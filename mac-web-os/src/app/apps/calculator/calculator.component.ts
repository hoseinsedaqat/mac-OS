import { ChangeDetectionStrategy, Component, HostListener, input, signal } from '@angular/core';
import {
  CalcOperator,
  applyPercent,
  chooseOperator,
  clearAll,
  clearEntry,
  computeEquals,
  initialCalculatorState,
  inputDecimal,
  inputDigit,
  toggleSign,
} from './calculator-engine';

interface CalcButton {
  label: string;
  kind: 'digit' | 'op' | 'action' | 'equals';
  value: string;
  wide?: boolean;
}

const BUTTONS: CalcButton[] = [
  { label: 'AC', kind: 'action', value: 'ac' },
  { label: '+/-', kind: 'action', value: 'sign' },
  { label: '%', kind: 'action', value: 'percent' },
  { label: '÷', kind: 'op', value: '÷' },
  { label: '7', kind: 'digit', value: '7' },
  { label: '8', kind: 'digit', value: '8' },
  { label: '9', kind: 'digit', value: '9' },
  { label: '×', kind: 'op', value: '×' },
  { label: '4', kind: 'digit', value: '4' },
  { label: '5', kind: 'digit', value: '5' },
  { label: '6', kind: 'digit', value: '6' },
  { label: '-', kind: 'op', value: '-' },
  { label: '1', kind: 'digit', value: '1' },
  { label: '2', kind: 'digit', value: '2' },
  { label: '3', kind: 'digit', value: '3' },
  { label: '+', kind: 'op', value: '+' },
  { label: '0', kind: 'digit', value: '0', wide: true },
  { label: '.', kind: 'digit', value: '.' },
  { label: '=', kind: 'equals', value: '=' },
];

@Component({
  selector: 'mw-app-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
  host: { tabindex: '0', class: 'mw-calculator-host' },
})
export class CalculatorComponent {
  readonly windowId = input<string>('');
  readonly buttons = BUTTONS;
  readonly state = signal(initialCalculatorState());
  readonly activeOperator = signal<CalcOperator | null>(null);

  press(button: CalcButton): void {
    switch (button.kind) {
      case 'digit':
        this.state.update((s) => (button.value === '.' ? inputDecimal(s) : inputDigit(s, button.value)));
        break;
      case 'op':
        this.state.update((s) => chooseOperator(s, button.value as CalcOperator));
        break;
      case 'equals':
        this.state.update((s) => computeEquals(s));
        break;
      case 'action':
        this.runAction(button.value);
        break;
    }
  }

  private runAction(action: string): void {
    if (action === 'ac') this.state.set(clearAll());
    else if (action === 'sign') this.state.update(toggleSign);
    else if (action === 'percent') this.state.update(applyPercent);
    else if (action === 'ce') this.state.update(clearEntry);
  }

  isAllClear(): boolean {
    return this.state().display === '0' && this.state().previousValue === null;
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (/^[0-9]$/.test(key)) {
      event.preventDefault();
      this.state.update((s) => inputDigit(s, key));
      return;
    }
    if (key === '.') {
      event.preventDefault();
      this.state.update(inputDecimal);
      return;
    }
    const opMap: Record<string, CalcOperator> = { '+': '+', '-': '-', '*': '×', '/': '÷' };
    if (opMap[key]) {
      event.preventDefault();
      this.state.update((s) => chooseOperator(s, opMap[key]));
      return;
    }
    if (key === 'Enter' || key === '=') {
      event.preventDefault();
      this.state.update(computeEquals);
      return;
    }
    if (key === 'Backspace') {
      event.preventDefault();
      this.state.update((s) => (s.display.length > 1 ? { ...s, display: s.display.slice(0, -1) } : clearEntry(s)));
      return;
    }
    if (key === 'Escape') {
      event.preventDefault();
      this.state.set(clearAll());
      return;
    }
    if (key === '%') {
      event.preventDefault();
      this.state.update(applyPercent);
    }
  }
}
