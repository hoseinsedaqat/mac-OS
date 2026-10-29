import { Injectable, signal } from '@angular/core';

export interface ContextMenuItem {
  id: string;
  label?: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  action?: () => void;
}

export interface ContextMenuRequest {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

/** Single shared context-menu overlay so only one menu can ever be open at once. */
@Injectable({ providedIn: 'root' })
export class ContextMenuService {
  readonly request = signal<ContextMenuRequest | null>(null);

  open(x: number, y: number, items: ContextMenuItem[]): void {
    this.request.set({ x, y, items });
  }

  close(): void {
    this.request.set(null);
  }
}
