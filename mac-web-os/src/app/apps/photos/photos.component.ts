import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ALBUMS, PHOTO_LIBRARY, PhotoItem } from './photos.data';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'mw-app-photos',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './photos.component.html',
  styleUrl: './photos.component.scss',
})
export class PhotosComponent {
  readonly windowId = input<string>('');
  readonly albums = ALBUMS;
  readonly activeAlbum = signal('All');
  readonly query = signal('');
  readonly removedIds = signal(new Set<string>());
  readonly viewerIndex = signal<number | null>(null);
  readonly failedImages = signal(new Set<string>());

  readonly items = computed<PhotoItem[]>(() => {
    const album = this.activeAlbum();
    const q = this.query().trim().toLowerCase();
    return PHOTO_LIBRARY.filter((p) => !this.removedIds().has(p.id))
      .filter((p) => album === 'All' || p.album === album)
      .filter((p) => !q || p.title.toLowerCase().includes(q));
  });

  selectAlbum(album: string): void {
    this.activeAlbum.set(album);
  }

  openViewer(index: number): void {
    this.viewerIndex.set(index);
  }

  closeViewer(): void {
    this.viewerIndex.set(null);
  }

  next(): void {
    const items = this.items();
    const idx = this.viewerIndex();
    if (idx === null || !items.length) return;
    this.viewerIndex.set((idx + 1) % items.length);
  }

  prev(): void {
    const items = this.items();
    const idx = this.viewerIndex();
    if (idx === null || !items.length) return;
    this.viewerIndex.set((idx - 1 + items.length) % items.length);
  }

  remove(id: string, event: Event): void {
    event.stopPropagation();
    this.removedIds.update((set) => new Set(set).add(id));
    if (this.viewerIndex() !== null) this.closeViewer();
  }

  markFailed(id: string): void {
    this.failedImages.update((set) => new Set(set).add(id));
  }

  hasFailed(id: string): boolean {
    return this.failedImages().has(id);
  }

  get activeItem(): PhotoItem | null {
    const idx = this.viewerIndex();
    return idx === null ? null : (this.items()[idx] ?? null);
  }
}
