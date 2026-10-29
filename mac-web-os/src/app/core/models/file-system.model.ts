export type FsNodeType = 'folder' | 'file';

export interface FsNode {
  id: string;
  parentId: string | null;
  name: string;
  type: FsNodeType;
  /** MIME-ish kind used for icon + Get Info, e.g. "text", "image", "audio". */
  kind: string;
  /** Text content for simulated text/markdown files. */
  content?: string;
  size: number;
  createdAt: number;
  modifiedAt: number;
  trashed: boolean;
  /** Locations such as Desktop/Documents/Downloads cannot be deleted or renamed. */
  protected?: boolean;
}

export const ROOT_ID = 'root';
export const DESKTOP_ID = 'desktop';
export const DOCUMENTS_ID = 'documents';
export const DOWNLOADS_ID = 'downloads';
