import { Injectable } from '@angular/core';

export interface ShortcutContext {
  isTypingTarget: boolean;
}

export type ShortcutHandler = (event: KeyboardEvent) => void;

interface RegisteredShortcut {
  combo: string;
  handler: ShortcutHandler;
  /** When true, fires even while focus is inside a text input/textarea. */
  allowInInputs: boolean;
}

/**
 * Centralised keyboard shortcut dispatcher.
 *
 * A single `keydown` listener is attached to the document; individual shell
 * pieces register/unregister handlers instead of each adding their own
 * global listener (which would risk duplicated or leaked listeners).
 */
@Injectable({ providedIn: 'root' })
export class KeyboardShortcutService {
  private readonly handlers = new Map<string, RegisteredShortcut[]>();
  private attached = false;

  private boundListener = (event: KeyboardEvent) => this.handleKeydown(event);

  attach(): void {
    if (this.attached) return;
    document.addEventListener('keydown', this.boundListener, true);
    this.attached = true;
  }

  detach(): void {
    if (!this.attached) return;
    document.removeEventListener('keydown', this.boundListener, true);
    this.attached = false;
  }

  /** combo example: "ctrl+w", "meta+space", "escape", "alt+tab" */
  register(combo: string, handler: ShortcutHandler, allowInInputs = false): () => void {
    const key = combo.toLowerCase();
    const entry: RegisteredShortcut = { combo: key, handler, allowInInputs };
    const list = this.handlers.get(key) ?? [];
    list.push(entry);
    this.handlers.set(key, list);
    return () => {
      const current = this.handlers.get(key) ?? [];
      this.handlers.set(
        key,
        current.filter((h) => h !== entry),
      );
    };
  }

  private handleKeydown(event: KeyboardEvent): void {
    const combo = this.comboFromEvent(event);
    const list = this.handlers.get(combo);
    if (!list || list.length === 0) return;

    const target = event.target as HTMLElement | null;
    const isTypingTarget = !!target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );

    // Dispatch to the most recently registered handler that applies.
    for (let i = list.length - 1; i >= 0; i--) {
      const entry = list[i];
      if (isTypingTarget && !entry.allowInInputs) continue;
      event.preventDefault();
      entry.handler(event);
      return;
    }
  }

  private comboFromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) parts.push('mod');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    const key = event.key.toLowerCase();
    if (!['control', 'meta', 'alt', 'shift'].includes(key)) {
      parts.push(key === ' ' ? 'space' : key);
    }
    return parts.join('+');
  }
}
