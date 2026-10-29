import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from '../../core/services/storage.service';
import { createId } from '../../shared/utils/id.util';

export interface NoteRecord {
  id: string;
  title: string;
  body: string;
  folder: string;
  createdAt: number;
  updatedAt: number;
}

const NOTES_KEY = 'notes';
const SELECTED_KEY = 'notes-selected-id';
const FOLDERS = ['Notes', 'Work', 'Personal'];

@Injectable({ providedIn: 'root' })
export class NotesStoreService {
  private readonly storage = inject(StorageService);
  private readonly notesSignal = signal<NoteRecord[]>(this.load());
  readonly notes = this.notesSignal.asReadonly();
  readonly selectedId = signal<string | null>(this.storage.getItem<string | null>(SELECTED_KEY, null));
  readonly folders = FOLDERS;

  readonly selectedNote = computed(
    () => this.notesSignal().find((n) => n.id === this.selectedId()) ?? null,
  );

  constructor() {
    if (this.notesSignal().length === 0) {
      this.seed();
    }
    if (!this.selectedId() && this.notesSignal().length) {
      this.selectedId.set(this.notesSignal()[0].id);
    }
  }

  private load(): NoteRecord[] {
    return this.storage.getItem<NoteRecord[]>(NOTES_KEY, []);
  }

  private persist(): void {
    this.storage.setItem(NOTES_KEY, this.notesSignal());
  }

  private seed(): void {
    const now = Date.now();
    const welcome: NoteRecord = {
      id: createId('note'),
      title: 'Welcome to Notes',
      body: 'This is a sample note.\n\nYou can create new notes, edit them, and search through them. Every change is saved automatically.',
      folder: 'Notes',
      createdAt: now,
      updatedAt: now,
    };
    this.notesSignal.set([welcome]);
    this.persist();
  }

  select(id: string): void {
    this.selectedId.set(id);
    this.storage.setItem(SELECTED_KEY, id);
  }

  create(folder = 'Notes'): NoteRecord {
    const now = Date.now();
    const note: NoteRecord = {
      id: createId('note'),
      title: '',
      body: '',
      folder,
      createdAt: now,
      updatedAt: now,
    };
    this.notesSignal.update((list) => [note, ...list]);
    this.persist();
    this.select(note.id);
    return note;
  }

  update(id: string, patch: Partial<Pick<NoteRecord, 'title' | 'body' | 'folder'>>): void {
    this.notesSignal.update((list) =>
      list.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
    );
    this.persist();
  }

  remove(id: string): void {
    this.notesSignal.update((list) => list.filter((n) => n.id !== id));
    this.persist();
    if (this.selectedId() === id) {
      const next = this.notesSignal()[0]?.id ?? null;
      this.selectedId.set(next);
      this.storage.setItem(SELECTED_KEY, next);
    }
  }

  search(query: string): NoteRecord[] {
    const q = query.trim().toLowerCase();
    const sorted = [...this.notesSignal()].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
  }
}
