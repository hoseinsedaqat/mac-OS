import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { FileSystemService } from '../../core/services/file-system.service';
import { runCommand } from './terminal-commands';
import { ROOT_ID } from '../../core/models/file-system.model';

interface TerminalLine {
  type: 'input' | 'output';
  text: string;
}

@Component({
  selector: 'mw-app-terminal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.scss',
  host: { class: 'mw-terminal-host' },
})
export class TerminalComponent implements AfterViewChecked {
  readonly windowId = input<string>('');
  private readonly settings = inject(SettingsService);
  private readonly fs = inject(FileSystemService);
  private readonly scrollAnchor = viewChild<ElementRef<HTMLDivElement>>('scrollAnchor');

  readonly lines = signal<TerminalLine[]>([
    { type: 'output', text: 'MacWeb OS Terminal — برای راهنما help را تایپ کنید.' },
  ]);
  readonly currentInput = signal('');
  private history: string[] = [];
  private historyIndex = -1;
  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollAnchor()?.nativeElement.scrollIntoView();
      this.shouldScroll = false;
    }
  }

  submit(): void {
    const value = this.currentInput();
    this.lines.update((l) => [...l, { type: 'input', text: value }]);
    this.history.push(value);
    this.historyIndex = this.history.length;

    const output = runCommand(value, {
      userName: this.settings.settings().userName,
      currentPath: '/Users/' + this.settings.settings().userName.toLowerCase().replace(/\s+/g, '-'),
      listCurrentDir: () => this.fs.nodes().filter((n) => n.parentId === ROOT_ID && !n.trashed).map((n) => n.name),
    });

    if (output.length === 1 && output[0] === '__CLEAR__') {
      this.lines.set([]);
    } else if (output.length) {
      this.lines.update((l) => [...l, ...output.map((text) => ({ type: 'output' as const, text }))]);
    }

    this.currentInput.set('');
    this.shouldScroll = true;
  }

  historyUp(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.currentInput.set(this.history[this.historyIndex] ?? '');
    }
  }

  historyDown(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.currentInput.set(this.history[this.historyIndex] ?? '');
    } else {
      this.historyIndex = this.history.length;
      this.currentInput.set('');
    }
  }

  focusInput(input: HTMLInputElement): void {
    input.focus();
  }
}
