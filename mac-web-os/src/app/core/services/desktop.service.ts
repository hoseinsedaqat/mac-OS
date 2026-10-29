import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export type DesktopIconAction =
  | { type: 'open-app'; appId: string }
  | { type: 'open-folder'; folderId: string }
  | { type: 'open-launchpad' };

export interface DesktopIconDef {
  id: string;
  /** Dot-path into the i18n dictionary resolved to the visible label. */
  labelKey: string;
  icon: string;
  action: DesktopIconAction;
}

export interface DesktopIconPosition {
  id: string;
  x: number;
  y: number;
}

const STORAGE_KEY = 'desktop-icon-positions';

const DEFAULT_ICONS: DesktopIconDef[] = [
  {
    id: 'macintosh-hd',
    labelKey: 'shell.desktop.icons.macintoshHd',
    icon: 'hdd',
    action: { type: 'open-folder', folderId: 'root' },
  },
  {
    id: 'documents',
    labelKey: 'shell.desktop.icons.documents',
    icon: 'folder',
    action: { type: 'open-folder', folderId: 'documents' },
  },
  {
    id: 'downloads',
    labelKey: 'shell.desktop.icons.downloads',
    icon: 'folder-download',
    action: { type: 'open-folder', folderId: 'downloads' },
  },
  {
    id: 'applications',
    labelKey: 'shell.desktop.icons.applications',
    icon: 'launchpad',
    action: { type: 'open-launchpad' },
  },
  {
    id: 'terminal',
    labelKey: 'apps.terminal.name',
    icon: 'terminal',
    action: { type: 'open-app', appId: 'terminal' },
  },
  {
    id: 'vscode',
    labelKey: 'apps.vscode.name',
    icon: 'vscode',
    action: { type: 'open-app', appId: 'vscode' },
  },
  {
    id: 'games',
    labelKey: 'shell.desktop.icons.games',
    icon: 'games',
    action: { type: 'open-app', appId: 'games' },
  },
  {
    id: 'settings',
    labelKey: 'shell.desktop.icons.settings',
    icon: 'settings',
    action: { type: 'open-app', appId: 'settings' },
  },
  {
    id: 'about-this-mac',
    labelKey: 'shell.desktop.icons.aboutThisMac',
    icon: 'about',
    action: { type: 'open-app', appId: 'about' },
  },
  { id: 'trash', labelKey: 'shell.desktop.icons.trash', icon: 'trash', action: { type: 'open-app', appId: 'trash' } },
];

/** Owns desktop icon layout: definitions, positions and selection state. */
@Injectable({ providedIn: 'root' })
export class DesktopService {
  private readonly storage = inject(StorageService);
  readonly icons = signal<DesktopIconDef[]>(DEFAULT_ICONS);
  readonly positions = signal<Record<string, DesktopIconPosition>>(this.loadPositions());
  readonly selectedId = signal<string | null>(null);

  constructor() {}

  private loadPositions(): Record<string, DesktopIconPosition> {
    return this.storage.getItem<Record<string, DesktopIconPosition>>(STORAGE_KEY, {});
  }

  positionFor(id: string, index: number): DesktopIconPosition {
    const stored = this.positions()[id];
    if (stored) return stored;
    const col = Math.floor(index / 6);
    const row = index % 6;
    return { id, x: 24 + col * 104, y: 48 + row * 104 };
  }

  setPosition(id: string, x: number, y: number): void {
    this.positions.update((current) => {
      const next = { ...current, [id]: { id, x, y } };
      this.storage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  select(id: string | null): void {
    this.selectedId.set(id);
  }

  resetPositions(): void {
    this.positions.set({});
    this.storage.setItem(STORAGE_KEY, {});
  }
}
