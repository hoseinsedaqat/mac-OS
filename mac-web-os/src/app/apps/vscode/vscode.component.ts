import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/services/i18n.service';
import { DialogService } from '../../core/services/dialog.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CodeFile, VscodeStoreService } from './vscode-store.service';

interface OutputLine {
  kind: 'log' | 'error' | 'info';
  text: string;
}

const LANGUAGE_ICON: Record<CodeFile['language'], string> = {
  javascript: 'file-text',
  html: 'file-text',
  css: 'file-text',
  json: 'file-text',
  markdown: 'file-text',
};

/**
 * A simulated, VS Code-inspired code editor: file explorer, tabbed editor and
 * a Run/Output panel. "Run" never touches the real page or host environment —
 * JavaScript is executed inside an isolated, sandboxed `<iframe>`
 * (`sandbox="allow-scripts"`, no `allow-same-origin`) and only `console.*`
 * output is relayed back via `postMessage`. This is a demo feature, clearly
 * disclosed in the UI, and is not a real development environment.
 */
@Component({
  selector: 'mw-app-vscode',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vscode.component.html',
  styleUrl: './vscode.component.scss',
})
export class VscodeComponent {
  readonly windowId = input<string>('');

  readonly i18n = inject(I18nService);
  readonly store = inject(VscodeStoreService);
  private readonly dialog = inject(DialogService);

  readonly files = this.store.files;
  readonly openFileIds = this.store.openFileIds;
  readonly activeFileId = this.store.activeFileId;
  readonly activeFile = computed(() => this.store.getFile(this.activeFileId()));
  readonly openFiles = computed(() =>
    this.openFileIds()
      .map((id) => this.store.getFile(id))
      .filter((f): f is CodeFile => !!f),
  );

  readonly output = signal<OutputLine[]>([]);
  readonly running = signal(false);
  readonly dirty = signal(false);
  readonly showOutput = signal(false);

  iconFor(file: CodeFile): string {
    return LANGUAGE_ICON[file.language] ?? 'file-text';
  }

  openFile(id: string): void {
    this.store.openFile(id);
  }

  closeFile(id: string, event: Event): void {
    event.stopPropagation();
    this.store.closeFile(id);
  }

  onEdit(content: string): void {
    const file = this.activeFile();
    if (!file) return;
    this.store.updateContent(file.id, content);
    this.dirty.set(true);
  }

  save(): void {
    this.store.save();
    this.dirty.set(false);
  }

  async createFile(): Promise<void> {
    const name = window.prompt(this.i18n.t('apps.vscode.newFile') + ':', 'untitled.js');
    if (!name) return;
    this.store.createFile(name);
  }

  async deleteFile(id: string, event: Event): Promise<void> {
    event.stopPropagation();
    const file = this.store.getFile(id);
    if (!file) return;
    const confirmed = await this.dialog.confirm({
      title: this.i18n.t('common.delete'),
      message: this.i18n.t('apps.finder.deleteConfirmMessage', file.name),
      danger: true,
    });
    if (confirmed) this.store.deleteFile(id);
  }

  canRun(): boolean {
    return this.activeFile()?.language === 'javascript';
  }

  run(): void {
    const file = this.activeFile();
    if (!file || file.language !== 'javascript') return;

    this.running.set(true);
    this.showOutput.set(true);
    this.output.set([{ kind: 'info', text: this.i18n.t('apps.vscode.run') + '…' }]);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data as { kind: 'log' | 'error'; text: string } | undefined;
      if (!data) return;
      this.output.update((lines) => [...lines, { kind: data.kind, text: data.text }]);
      if (data.kind === 'error') this.finishRun(iframe, handleMessage);
    };
    window.addEventListener('message', handleMessage);

    const escapedCode = JSON.stringify(file.content);
    iframe.srcdoc = `<!doctype html><html><body><script>
      const send = (kind, args) => {
        try {
          const text = args.map((a) => {
            try { return typeof a === 'string' ? a : JSON.stringify(a); }
            catch { return String(a); }
          }).join(' ');
          parent.postMessage({ kind, text }, '*');
        } catch (e) {}
      };
      console.log = (...args) => send('log', args);
      console.error = (...args) => send('error', args);
      console.warn = (...args) => send('log', args);
      console.info = (...args) => send('log', args);
      try {
        new Function(${escapedCode})();
        parent.postMessage({ kind: 'done' }, '*');
      } catch (err) {
        send('error', ['Error: ' + (err && err.message ? err.message : String(err))]);
        parent.postMessage({ kind: 'done' }, '*');
      }
    <\/script></body></html>`;

    const doneListener = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data as { kind: string } | undefined;
      if (data?.kind === 'done') {
        window.removeEventListener('message', doneListener);
        this.finishRun(iframe, handleMessage);
      }
    };
    window.addEventListener('message', doneListener);

    // Safety timeout in case the sandboxed script hangs or never signals completion.
    setTimeout(() => {
      if (this.running()) {
        this.output.update((lines) => [...lines, { kind: 'info', text: 'Timed out after 3s.' }]);
        this.finishRun(iframe, handleMessage);
        window.removeEventListener('message', doneListener);
      }
    }, 3000);
  }

  private finishRun(iframe: HTMLIFrameElement, listener: (e: MessageEvent) => void): void {
    this.running.set(false);
    window.removeEventListener('message', listener);
    iframe.remove();
  }

  clearOutput(): void {
    this.output.set([]);
  }
}
