import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from '../../core/services/storage.service';
import { createId } from '../../shared/utils/id.util';

export interface CodeFile {
  id: string;
  name: string;
  language: 'javascript' | 'html' | 'css' | 'json' | 'markdown';
  content: string;
}

const STORAGE_KEY = 'vscode-files';

const SAMPLE_FILES: CodeFile[] = [
  {
    id: 'app.js',
    name: 'app.js',
    language: 'javascript',
    content: `// Welcome to the Code app — a simulated, sandboxed editor.
// Click "Run" to execute this file inside a safe sandboxed iframe.
// Nothing here can touch your real files, network, or the host page.

function fibonacci(n) {
  if (n < 2) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return b;
}

for (let i = 0; i < 10; i++) {
  console.log('fib(' + i + ') =', fibonacci(i));
}
`,
  },
  {
    id: 'index.html',
    name: 'index.html',
    language: 'html',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>MacWeb OS Sample Project</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>Hello from the simulated project!</h1>
    <script src="app.js"></script>
  </body>
</html>
`,
  },
  {
    id: 'styles.css',
    name: 'styles.css',
    language: 'css',
    content: `body {
  font-family: -apple-system, sans-serif;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 2rem;
}

h1 {
  color: #4fc1ff;
}
`,
  },
  {
    id: 'package.json',
    name: 'package.json',
    language: 'json',
    content: `{
  "name": "macweb-sample-project",
  "version": "1.0.0",
  "private": true,
  "description": "A tiny demo project opened inside the simulated Code app."
}
`,
  },
  {
    id: 'README.md',
    name: 'README.md',
    language: 'markdown',
    content: `# Sample Project

This is a sandboxed, in-browser demo project opened inside MacWeb OS's
simulated **Code** app.

- Edit any file in the Explorer.
- Press **Run** on a JavaScript file to execute it in an isolated,
  sandboxed \`<iframe>\` — never on the real page.
- Your edits are saved locally in this browser only.
`,
  },
];

/** Owns the in-browser, in-memory "project" shown in the simulated Code app. */
@Injectable({ providedIn: 'root' })
export class VscodeStoreService {
  private readonly storage = inject(StorageService);

  readonly files = signal<CodeFile[]>(this.load());
  readonly openFileIds = signal<string[]>(this.files()[0] ? [this.files()[0].id] : []);
  readonly activeFileId = signal<string | null>(this.files()[0]?.id ?? null);

  private load(): CodeFile[] {
    const stored = this.storage.getItem<CodeFile[] | null>(STORAGE_KEY, null);
    return stored && stored.length ? stored : SAMPLE_FILES;
  }

  private persist(): void {
    this.storage.setItem(STORAGE_KEY, this.files());
  }

  openFile(id: string): void {
    this.activeFileId.set(id);
    this.openFileIds.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }

  closeFile(id: string): void {
    this.openFileIds.update((ids) => ids.filter((f) => f !== id));
    if (this.activeFileId() === id) {
      const remaining = this.openFileIds();
      this.activeFileId.set(remaining[remaining.length - 1] ?? null);
    }
  }

  updateContent(id: string, content: string): void {
    this.files.update((files) => files.map((f) => (f.id === id ? { ...f, content } : f)));
  }

  save(): void {
    this.persist();
  }

  createFile(name: string): CodeFile {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const language: CodeFile['language'] =
      ext === 'html' ? 'html' : ext === 'css' ? 'css' : ext === 'json' ? 'json' : ext === 'md' ? 'markdown' : 'javascript';
    const file: CodeFile = { id: `${createId()}-${name}`, name, language, content: '' };
    this.files.update((files) => [...files, file]);
    this.persist();
    this.openFile(file.id);
    return file;
  }

  deleteFile(id: string): void {
    this.files.update((files) => files.filter((f) => f.id !== id));
    this.closeFile(id);
    this.persist();
  }

  getFile(id: string | null): CodeFile | undefined {
    if (!id) return undefined;
    return this.files().find((f) => f.id === id);
  }

  resetToSample(): void {
    this.files.set(SAMPLE_FILES);
    this.openFileIds.set([SAMPLE_FILES[0].id]);
    this.activeFileId.set(SAMPLE_FILES[0].id);
    this.persist();
  }
}
