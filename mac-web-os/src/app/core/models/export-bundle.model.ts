import { FsNode } from './file-system.model';

/** Identifies a backup file as belonging to this app (rejects unrelated JSON on import). */
export const EXPORT_BUNDLE_APP_ID = 'macweb-os' as const;

/** Bump when the shape of `ExportBundle` changes in a way old bundles can't satisfy. */
export const EXPORT_BUNDLE_SCHEMA_VERSION = 1 as const;

/**
 * A full, self-contained snapshot of every piece of user data MacWeb OS
 * persists in this browser: every namespaced `localStorage` key (settings,
 * Notes, Mail, Calendar, Dock layout, App Store installs, VS Code files,
 * Safari history/bookmarks, …) plus the simulated IndexedDB file system
 * (Finder/Trash). Produced by `DataPortabilityService.buildExport()` and
 * downloaded as a single JSON file so it can be re-imported later, on this
 * device or another one.
 */
export interface ExportBundle {
  app: typeof EXPORT_BUNDLE_APP_ID;
  schemaVersion: typeof EXPORT_BUNDLE_SCHEMA_VERSION;
  exportedAt: string;
  localStorage: Record<string, unknown>;
  fileSystem: FsNode[];
}
