import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotesStoreService } from './notes-store.service';
import { DialogService } from '../../core/services/dialog.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { relativeFromNow } from '../../shared/utils/date.util';

@Component({
  selector: 'mw-app-notes',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss',
})
export class NotesComponent implements OnInit {
  readonly windowId = input<string>('');
  readonly store = inject(NotesStoreService);
  private readonly dialog = inject(DialogService);

  readonly query = signal('');
  readonly filtered = computed(() => this.store.search(this.query()));

  readonly draftTitle = signal('');
  readonly draftBody = signal('');

  ngOnInit(): void {
    const current = this.store.selectedNote();
    if (current) {
      this.draftTitle.set(current.title);
      this.draftBody.set(current.body);
    }
  }

  select(id: string): void {
    this.store.select(id);
    const note = this.store.selectedNote();
    this.draftTitle.set(note?.title ?? '');
    this.draftBody.set(note?.body ?? '');
  }

  createNote(): void {
    this.store.create();
    this.draftTitle.set('');
    this.draftBody.set('');
  }

  onTitleChange(value: string): void {
    this.draftTitle.set(value);
    const note = this.store.selectedNote();
    if (note) this.store.update(note.id, { title: value });
  }

  onBodyChange(value: string): void {
    this.draftBody.set(value);
    const note = this.store.selectedNote();
    if (note) this.store.update(note.id, { body: value });
  }

  async deleteCurrent(): Promise<void> {
    const note = this.store.selectedNote();
    if (!note) return;
    const confirmed = await this.dialog.confirm({
      title: 'Delete Note',
      message: `Are you sure you want to delete "${note.title || 'Untitled Note'}"?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;
    this.store.remove(note.id);
    const next = this.store.selectedNote();
    this.draftTitle.set(next?.title ?? '');
    this.draftBody.set(next?.body ?? '');
  }

  relative(ts: number): string {
    return relativeFromNow(ts);
  }

  preview(body: string): string {
    return body.split('\n').find((line) => line.trim().length > 0)?.slice(0, 60) ?? 'No additional text';
  }
}
