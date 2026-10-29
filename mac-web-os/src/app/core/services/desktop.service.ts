import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export type DesktopIconAction =
  | { type: 'open-app'; appId: string }
  | { type: 'open-folder'; folderId: string };

export interface DesktopIconDef {
  id: string;
  label: string;
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
  { id: 'macintosh-hd', label: 'Macintosh HD', icon: 'hdd', action: { type: 'open-folder', folderId: 'root' } },
  { id: 'documents', label: 'Documents', icon: 'folder', action: { type: 'open-folder', folderId: 'documents' } },
  { id: 'downloads', label: 'Downloads', icon: 'folder-download', action: { type: 'open-folder', folderId: 'downloads' } },
  { id: 'applications', label: 'Applications', icon: 'apps', action: { type: 'open-app', appId: 'app-store' } },
  { id: 'settings', label: 'Settings', icon: 'settings', action: { type: 'open-app', appId: 'settings' } },
  { id: 'about-this-mac', label: 'About This Mac', icon: 'about', action: { type: 'open-app', appId: 'about' } },
  { id: 'trash', label: 'Trash', icon: 'trash', action: { type: 'open-app', appId: 'trash' } },
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
