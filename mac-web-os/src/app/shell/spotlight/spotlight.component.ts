import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, viewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelService } from '../../core/services/panel.service';
import { ApplicationRegistryService } from '../../core/services/application-registry.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { FileSystemService } from '../../core/services/file-system.service';
import { StorageService } from '../../core/services/storage.service';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AppDefinition } from '../../core/models/app.model';
import { FsNode } from '../../core/models/file-system.model';

interface NoteSummary {
  id: string;
  title: string;
}

type ResultGroup = { label: string; kind: 'app' | 'file' | 'note'; items: (AppDefinition | FsNode | NoteSummary)[] };

@Component({
  selector: 'mw-spotlight',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spotlight.component.html',
  styleUrl: './spotlight.component.scss',
})
export class SpotlightComponent {
  private readonly panels = inject(PanelService);
  private readonly registry = inject(ApplicationRegistryService);
  private readonly wm = inject(WindowManagerService);
  private readonly fs = inject(FileSystemService);
  private readonly storage = inject(StorageService);
  readonly i18n = inject(I18nService);

  readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  readonly query = signal('');
  readonly isOpen = computed(() => this.panels.active() === 'spotlight');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.query.set('');
        queueMicrotask(() => this.inputRef()?.nativeElement.focus());
      }
    });
  }

  readonly appResults = computed<AppDefinition[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    return this.registry.list().filter((a) => a.name.toLowerCase().includes(q) || a.id.includes(q));
  });

  readonly fileResults = computed<FsNode[]>(() => {
    const q = this.query().trim();
    if (!q) return [];
    return this.fs.search(q).slice(0, 6);
  });

  readonly noteResults = computed<NoteSummary[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    const notes = this.storage.getItem<{ id: string; title: string; body: string }[]>('notes', []);
    return notes
      .filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      .slice(0, 6)
      .map((n) => ({ id: n.id, title: n.title || this.i18n.t('common.untitled') }));
  });

  readonly hasResults = computed(
    () => this.appResults().length > 0 || this.fileResults().length > 0 || this.noteResults().length > 0,
  );

  close(): void {
    this.panels.close();
  }

  openApp(app: AppDefinition): void {
    this.wm.open(app.id);
    this.close();
  }

  openFile(file: FsNode): void {
    this.wm.open('finder', { data: { folderId: file.parentId, highlight: file.id } });
    this.close();
  }

  openNote(note: NoteSummary): void {
    this.wm.open('notes', { data: { noteId: note.id } });
    this.close();
  }
}
