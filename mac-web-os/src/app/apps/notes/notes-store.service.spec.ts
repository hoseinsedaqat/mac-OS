import { TestBed } from '@angular/core/testing';
import { NotesStoreService } from './notes-store.service';

describe('NotesStoreService', () => {
  let service: NotesStoreService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotesStoreService);
  });

  it('seeds a welcome note on first run and auto-selects it', () => {
    expect(service.notes().length).toBe(1);
    expect(service.selectedId()).toBe(service.notes()[0].id);
  });

  it('create() adds a new empty note to the top of the list and selects it', () => {
    const note = service.create('Work');
    expect(service.notes()[0].id).toBe(note.id);
    expect(service.selectedId()).toBe(note.id);
    expect(note.folder).toBe('Work');
  });

  it('update() patches title/body and bumps updatedAt', () => {
    const note = service.create();
    const before = note.updatedAt;
    service.update(note.id, { title: 'Hello', body: 'World' });
    const updated = service.notes().find((n) => n.id === note.id)!;
    expect(updated.title).toBe('Hello');
    expect(updated.body).toBe('World');
    expect(updated.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('remove() deletes the note and re-selects another remaining note', () => {
    const first = service.notes()[0];
    const second = service.create();
    service.select(second.id);
    service.remove(second.id);
    expect(service.notes().find((n) => n.id === second.id)).toBeUndefined();
    expect(service.selectedId()).toBe(first.id);
  });

  it('search() filters by title/body and sorts by most recently updated', () => {
    service.create('Notes');
    const target = service.create('Notes');
    service.update(target.id, { title: 'Grocery list', body: 'milk, eggs' });
    const results = service.search('grocery');
    expect(results[0].id).toBe(target.id);
  });

  it('persists notes across instances via StorageService', () => {
    const note = service.create();
    service.update(note.id, { title: 'Persisted title' });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const second = TestBed.inject(NotesStoreService);
    expect(second.notes().some((n) => n.title === 'Persisted title')).toBe(true);
  });
});
