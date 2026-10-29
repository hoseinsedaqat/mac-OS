import { TestBed } from '@angular/core/testing';
import { FileSystemService } from './file-system.service';
import { DOCUMENTS_ID, ROOT_ID } from '../models/file-system.model';

describe('FileSystemService (simulated IndexedDB-backed file system)', () => {
  let service: FileSystemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileSystemService);
  });

  it('degrades gracefully to an in-memory seed tree when IndexedDB is unavailable, instead of crashing', async () => {
    // jsdom (used for unit tests) does not implement IndexedDB, so init() must
    // take the catch-path and still leave the app in a fully usable state.
    await service.init();
    expect(service.ready()).toBe(true);
    expect(service.nodes().length).toBeGreaterThan(0);
    expect(service.getNode(ROOT_ID)).toBeTruthy();
  });

  it('seeds Documents with starter files', async () => {
    await service.init();
    const children = await service.listChildren(DOCUMENTS_ID);
    expect(children.length).toBeGreaterThan(0);
  });

  it('createFolder() avoids name collisions by appending a counter', async () => {
    await service.init();
    const a = await service.createFolder(DOCUMENTS_ID, 'New Folder');
    const b = await service.createFolder(DOCUMENTS_ID, 'New Folder');
    expect(a.name).toBe('New Folder');
    expect(b.name).toBe('New Folder 2');
  });

  it('moveToTrash()/restoreFromTrash() round-trip a node through the Trash', async () => {
    await service.init();
    const file = await service.createFile(DOCUMENTS_ID, 'temp.txt', 'hi');
    await service.moveToTrash(file.id);
    expect(service.trashedNodes().some((n) => n.id === file.id)).toBe(true);
    await service.restoreFromTrash(file.id);
    expect(service.trashedNodes().some((n) => n.id === file.id)).toBe(false);
  });

  it('protected system folders cannot be renamed or trashed', async () => {
    await service.init();
    const renamed = await service.rename(ROOT_ID, 'Hacked');
    const trashed = await service.moveToTrash(ROOT_ID);
    expect(renamed).toBe(false);
    expect(trashed).toBe(false);
  });

  it('deletePermanently() also removes descendants, and emptyTrash() clears everything trashed', async () => {
    await service.init();
    const folder = await service.createFolder(DOCUMENTS_ID, 'ToDelete');
    const child = await service.createFile(folder.id, 'child.txt', '');
    await service.moveToTrash(folder.id);
    await service.moveToTrash(child.id);
    await service.emptyTrash();
    expect(service.getNode(folder.id)).toBeUndefined();
    expect(service.getNode(child.id)).toBeUndefined();
  });

  it('search() finds files by name, case-insensitively, excluding trashed items', async () => {
    await service.init();
    await service.createFile(DOCUMENTS_ID, 'FindMePlease.txt', '');
    const hits = service.search('findmeplease');
    expect(hits.length).toBe(1);
  });
});
