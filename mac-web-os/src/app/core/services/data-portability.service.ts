import { Injectable, inject } from '@angular/core';
import { EXPORT_BUNDLE_APP_ID, EXPORT_BUNDLE_SCHEMA_VERSION, ExportBundle } from '../models/export-bundle.model';
import { StorageService } from './storage.service';
import { FileSystemService } from './file-system.service';

/**
 * Lets the user take their data with them: everything MacWeb OS stores in
 * this browser (settings, Notes, Mail, Calendar, Dock layout, App Store
 * installs, VS Code scratch files, Safari history/bookmarks, and the
 * simulated Finder/Trash file system) can be exported to a single
 * downloadable JSON file and re-imported later — on this device, a fresh
 * browser profile, or another machine entirely.
 */
@Injectable({ providedIn: 'root' })
export class DataPortabilityService {
  private readonly storage = inject(StorageService);
  private readonly fs = inject(FileSystemService);

  /** Builds a full, self-contained snapshot of every piece of persisted user data. */
  buildExport(): ExportBundle {
    return {
      app: EXPORT_BUNDLE_APP_ID,
      schemaVersion: EXPORT_BUNDLE_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      localStorage: this.storage.exportAll(),
      fileSystem: this.fs.exportAll(),
    };
  }

  /** Serializes `buildExport()` and triggers a browser download of the resulting JSON file. */
  downloadExport(): void {
    const bundle = this.buildExport();
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStamp = bundle.exportedAt.slice(0, 10);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `macweb-os-backup-${dateStamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Parses raw file text and validates it is shaped like an export bundle
   * from this app. Returns `null` (never throws) when the file is invalid
   * JSON, isn't a MacWeb OS backup, or is from an incompatible future schema
   * version — callers should show the user a friendly error in that case.
   */
  parseBundle(raw: string): ExportBundle | null {
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!data || typeof data !== 'object') return null;
    const candidate = data as Partial<ExportBundle>;
    if (
      candidate.app !== EXPORT_BUNDLE_APP_ID ||
      candidate.schemaVersion !== EXPORT_BUNDLE_SCHEMA_VERSION ||
      !candidate.localStorage ||
      typeof candidate.localStorage !== 'object' ||
      !Array.isArray(candidate.fileSystem)
    ) {
      return null;
    }
    return candidate as ExportBundle;
  }

  /**
   * Restores a full snapshot: overwrites every matching `localStorage` key
   * and replaces the simulated file system wholesale, then reloads the page
   * so every service (Settings, Notes, Mail, Calendar, Finder, …) re-reads
   * its state from scratch instead of running with half-imported, half-live
   * in-memory signals.
   */
  async importBundle(bundle: ExportBundle): Promise<void> {
    this.storage.importAll(bundle.localStorage);
    await this.fs.importAll(bundle.fileSystem);
    window.location.reload();
  }
}
