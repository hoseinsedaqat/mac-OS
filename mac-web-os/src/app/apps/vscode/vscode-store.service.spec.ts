import { TestBed } from '@angular/core/testing';
import { VscodeStoreService } from './vscode-store.service';

describe('VscodeStoreService', () => {
  let service: VscodeStoreService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(VscodeStoreService);
  });

  it('seeds a non-empty sample project', () => {
    expect(service.files().length).toBeGreaterThan(0);
    expect(service.activeFileId()).toBeTruthy();
  });

  it('openFile() sets the active file and adds it to open tabs', () => {
    const second = service.files()[1];
    service.openFile(second.id);
    expect(service.activeFileId()).toBe(second.id);
    expect(service.openFileIds()).toContain(second.id);
  });

  it('closeFile() removes it from open tabs and reassigns the active file', () => {
    const [first, second] = service.files();
    service.openFile(first.id);
    service.openFile(second.id);
    service.closeFile(second.id);
    expect(service.openFileIds()).not.toContain(second.id);
    expect(service.activeFileId()).toBe(first.id);
  });

  it('updateContent() mutates only the targeted file', () => {
    const file = service.files()[0];
    service.updateContent(file.id, 'changed content');
    expect(service.getFile(file.id)?.content).toBe('changed content');
  });

  it('createFile() infers language from extension and opens it', () => {
    const created = service.createFile('notes.md');
    expect(created.language).toBe('markdown');
    expect(service.activeFileId()).toBe(created.id);
  });

  it('deleteFile() removes the file and closes its tab', () => {
    const created = service.createFile('scratch.js');
    service.deleteFile(created.id);
    expect(service.getFile(created.id)).toBeUndefined();
    expect(service.openFileIds()).not.toContain(created.id);
  });
});
