import { Injectable, signal } from '@angular/core';
import {
  DESKTOP_ID,
  DOCUMENTS_ID,
  DOWNLOADS_ID,
  FsNode,
  ROOT_ID,
} from '../models/file-system.model';
import { createId } from '../../shared/utils/id.util';

const DB_NAME = 'macweb-os-fs';
const DB_VERSION = 1;
const STORE = 'nodes';

/**
 * Simulated file system persisted in IndexedDB.
 *
 * These are *not* real operating system files – they only exist inside this
 * browser tab's IndexedDB database and are used purely to make Finder/Trash
 * behave like a real file manager.
 *
 * When IndexedDB is unavailable (private browsing, disabled storage, or a
 * test environment such as jsdom) the service transparently falls back to a
 * pure in-memory mode: every mutation still works for the lifetime of the
 * tab, it just isn't persisted across reloads. `memoryMode` below is the
 * single switch that every read/write path checks so no method ever assumes
 * IndexedDB succeeded.
 */
@Injectable({ providedIn: 'root' })
export class FileSystemService {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryMode = false;

  /** Reactive snapshot of every node, kept in sync after each mutation. */
  readonly nodes = signal<FsNode[]>([]);
  readonly ready = signal(false);
  readonly error = signal<string | null>(null);

  async init(): Promise<void> {
    try {
      await this.openDb();
      const all = await this.getAll();
      if (all.length === 0) {
        await this.seed();
      }
      await this.refresh();
      this.ready.set(true);
    } catch {
      this.enterMemoryMode();
      this.ready.set(true);
    }
  }

  private enterMemoryMode(): void {
    this.memoryMode = true;
    this.error.set(
      'ذخیره‌سازی فایل در این مرورگر در دسترس نیست. تغییرات فقط در همین نشست حفظ می‌شوند.',
    );
    if (this.nodes().length === 0) {
      this.nodes.set(this.seedNodes());
    }
  }

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('byParent', 'parentId');
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    });
    return this.dbPromise;
  }

  private withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return this.openDb().then(
      (db) =>
        new Promise<T>((resolve, reject) => {
          const tx = db.transaction(STORE, mode);
          const store = tx.objectStore(STORE);
          const req = fn(store);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
        }),
    );
  }

  private getAll(): Promise<FsNode[]> {
    return this.withStore('readonly', (s) => s.getAll() as IDBRequest<FsNode[]>);
  }

  private async refresh(): Promise<void> {
    if (this.memoryMode) return;
    try {
      const all = await this.getAll();
      this.nodes.set(all);
    } catch {
      // IndexedDB became unavailable mid-session (e.g. quota revoked): keep
      // whatever is currently in the signal and switch to memory mode so
      // future writes no longer try (and fail) to reach IndexedDB.
      this.enterMemoryMode();
    }
  }

  private seedNodes(): FsNode[] {
    const now = Date.now();
    const folder = (
      id: string,
      parentId: string | null,
      name: string,
      extra?: Partial<FsNode>,
    ): FsNode => ({
      id,
      parentId,
      name,
      type: 'folder',
      kind: 'folder',
      size: 0,
      createdAt: now,
      modifiedAt: now,
      trashed: false,
      protected: true,
      ...extra,
    });
    const file = (
      id: string,
      parentId: string,
      name: string,
      kind: string,
      content: string,
    ): FsNode => ({
      id,
      parentId,
      name,
      type: 'file',
      kind,
      content,
      size: content.length,
      createdAt: now,
      modifiedAt: now,
      trashed: false,
    });

    return [
      folder(ROOT_ID, null, 'Macintosh HD'),
      folder(DESKTOP_ID, ROOT_ID, 'Desktop'),
      folder(DOCUMENTS_ID, ROOT_ID, 'Documents'),
      folder(DOWNLOADS_ID, ROOT_ID, 'Downloads'),
      folder('trash', ROOT_ID, 'Trash'),
      file(
        createId('file'),
        DOCUMENTS_ID,
        'Welcome.txt',
        'text',
        'به MacWeb OS خوش آمدید!\n\nاین یک فایل شبیه‌سازی‌شده است که در IndexedBD مرورگر شما ذخیره می‌شود.\nمی‌توانید آن را جابه‌جا، تغییر نام یا حذف کنید.',
      ),
      file(
        createId('file'),
        DOCUMENTS_ID,
        'Resume.txt',
        'text',
        'نمونه رزومه شبیه‌سازی‌شده برای تست Finder.',
      ),
      file(
        createId('file'),
        DOWNLOADS_ID,
        'sample-image.txt',
        'image',
        'این یک فایل تصویری شبیه‌سازی‌شده است (placeholder).',
      ),
    ];
  }

  private async seed(): Promise<void> {
    const nodes = this.seedNodes();
    for (const node of nodes) {
      await this.withStore('readwrite', (s) => s.put(node));
    }
  }

  async listChildren(parentId: string): Promise<FsNode[]> {
    return this.nodes().filter((n) => n.parentId === parentId && !n.trashed);
  }

  getNode(id: string): FsNode | undefined {
    return this.nodes().find((n) => n.id === id);
  }

  getPath(id: string): FsNode[] {
    const path: FsNode[] = [];
    let current = this.getNode(id);
    while (current) {
      path.unshift(current);
      current = current.parentId ? this.getNode(current.parentId) : undefined;
    }
    return path;
  }

  /** Upserts a node both in the reactive signal and (when available) IndexedDB. */
  private async persist(node: FsNode): Promise<void> {
    this.nodes.update((list) => {
      const idx = list.findIndex((n) => n.id === node.id);
      if (idx === -1) return [...list, node];
      const next = [...list];
      next[idx] = node;
      return next;
    });
    if (this.memoryMode) return;
    try {
      await this.withStore('readwrite', (s) => s.put(node));
    } catch {
      // Keep the in-memory signal (already updated above) as the source of
      // truth for the rest of this session instead of silently dropping the
      // change or throwing out of every CRUD method.
      this.enterMemoryMode();
    }
  }

  /** Removes a node from the reactive signal and (when available) IndexedDB. */
  private async removeNode(id: string): Promise<void> {
    this.nodes.update((list) => list.filter((n) => n.id !== id));
    if (this.memoryMode) return;
    try {
      await this.withStore('readwrite', (s) => s.delete(id));
    } catch {
      this.enterMemoryMode();
    }
  }

  async createFolder(parentId: string, name: string): Promise<FsNode> {
    const now = Date.now();
    const node: FsNode = {
      id: createId('folder'),
      parentId,
      name: this.uniqueName(parentId, name),
      type: 'folder',
      kind: 'folder',
      size: 0,
      createdAt: now,
      modifiedAt: now,
      trashed: false,
    };
    await this.persist(node);
    return node;
  }

  async createFile(parentId: string, name: string, content = ''): Promise<FsNode> {
    const now = Date.now();
    const node: FsNode = {
      id: createId('file'),
      parentId,
      name: this.uniqueName(parentId, name),
      type: 'file',
      kind: 'text',
      content,
      size: content.length,
      createdAt: now,
      modifiedAt: now,
      trashed: false,
    };
    await this.persist(node);
    return node;
  }

  private uniqueName(parentId: string, name: string): string {
    const siblings = this.nodes().filter((n) => n.parentId === parentId && !n.trashed);
    if (!siblings.some((s) => s.name === name)) return name;
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    let i = 2;
    let candidate = `${base} ${i}${ext}`;
    while (siblings.some((s) => s.name === candidate)) {
      i++;
      candidate = `${base} ${i}${ext}`;
    }
    return candidate;
  }

  async rename(id: string, name: string): Promise<boolean> {
    const node = this.getNode(id);
    if (!node || node.protected || !name.trim()) return false;
    await this.persist({ ...node, name: name.trim(), modifiedAt: Date.now() });
    return true;
  }

  async updateContent(id: string, content: string): Promise<void> {
    const node = this.getNode(id);
    if (!node) return;
    await this.persist({ ...node, content, size: content.length, modifiedAt: Date.now() });
  }

  async moveToTrash(id: string): Promise<boolean> {
    const node = this.getNode(id);
    if (!node || node.protected) return false;
    await this.persist({ ...node, trashed: true, modifiedAt: Date.now() });
    return true;
  }

  async restoreFromTrash(id: string): Promise<void> {
    const node = this.getNode(id);
    if (!node) return;
    await this.persist({ ...node, trashed: false, modifiedAt: Date.now() });
  }

  async deletePermanently(id: string): Promise<void> {
    const toDelete = this.collectDescendants(id);
    for (const nodeId of toDelete) {
      await this.removeNode(nodeId);
    }
  }

  async emptyTrash(): Promise<void> {
    const trashed = this.nodes().filter((n) => n.trashed);
    for (const node of trashed) {
      await this.deletePermanently(node.id);
    }
  }

  private collectDescendants(id: string): string[] {
    const result = [id];
    const children = this.nodes().filter((n) => n.parentId === id);
    for (const child of children) {
      result.push(...this.collectDescendants(child.id));
    }
    return result;
  }

  async move(id: string, newParentId: string): Promise<boolean> {
    const node = this.getNode(id);
    if (!node || node.protected) return false;
    if (id === newParentId) return false;
    await this.persist({
      ...node,
      parentId: newParentId,
      name: this.uniqueName(newParentId, node.name),
      modifiedAt: Date.now(),
    });
    return true;
  }

  trashedNodes(): FsNode[] {
    return this.nodes().filter((n) => n.trashed);
  }

  search(query: string): FsNode[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this.nodes().filter((n) => !n.trashed && n.name.toLowerCase().includes(q));
  }
}
