import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { FileSystemService } from '../../core/services/file-system.service';
import { ApplicationRegistryService } from '../../core/services/application-registry.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { ContextMenuService, ContextMenuItem } from '../../core/services/context-menu.service';
import { DialogService } from '../../core/services/dialog.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { FsNode, ROOT_ID, DOCUMENTS_ID, DOWNLOADS_ID, DESKTOP_ID } from '../../core/models/file-system.model';

type SortKey = 'name' | 'type' | 'date';
type ViewMode = 'grid' | 'list';
const APPLICATIONS_ID = 'applications';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'mw-app-finder',
  standalone: true,
  imports: [FormsModule, IconComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './finder.component.html',
  styleUrl: './finder.component.scss',
})
export class FinderComponent implements OnInit {
  readonly windowId = input<string>('');

  readonly fs = inject(FileSystemService);
  private readonly registry = inject(ApplicationRegistryService);
  private readonly wm = inject(WindowManagerService);
  private readonly contextMenu = inject(ContextMenuService);
  private readonly dialog = inject(DialogService);

  readonly sidebarItems: SidebarItem[] = [
    { id: ROOT_ID, label: 'Macintosh HD', icon: 'hdd' },
    { id: DESKTOP_ID, label: 'Desktop', icon: 'folder' },
    { id: DOCUMENTS_ID, label: 'Documents', icon: 'folder' },
    { id: DOWNLOADS_ID, label: 'Downloads', icon: 'folder-download' },
    { id: APPLICATIONS_ID, label: 'Applications', icon: 'apps' },
  ];

  readonly currentFolder = signal(ROOT_ID);
  readonly history = signal<string[]>([ROOT_ID]);
  readonly historyIndex = signal(0);
  readonly viewMode = signal<ViewMode>('grid');
  readonly sortKey = signal<SortKey>('name');
  readonly query = signal('');
  readonly selection = signal<Set<string>>(new Set());
  readonly renamingId = signal<string | null>(null);
  readonly renameValue = signal('');
  readonly previewNode = signal<FsNode | null>(null);
  readonly previewDraft = signal('');

  ngOnInit(): void {
    const win = this.wm.windows().find((w) => w.id === this.windowId());
    const folderId = win?.data['folderId'];
    if (typeof folderId === 'string') {
      this.currentFolder.set(folderId);
      this.history.set([folderId]);
    }
  }

  readonly isApplications = computed(() => this.currentFolder() === APPLICATIONS_ID);

  readonly breadcrumb = computed(() => {
    if (this.isApplications()) return [{ id: APPLICATIONS_ID, name: 'Applications' }];
    return this.fs.getPath(this.currentFolder()).map((n) => ({ id: n.id, name: n.name }));
  });

  readonly applicationsList = computed(() => this.registry.list());

  readonly items = computed<FsNode[]>(() => {
    if (this.isApplications()) return [];
    const q = this.query().trim();
    const list = q ? this.fs.search(q) : this.fs.nodes().filter((n) => n.parentId === this.currentFolder() && !n.trashed);
    const sorted = [...list].sort((a, b) => {
      if (this.sortKey() === 'name') return a.name.localeCompare(b.name);
      if (this.sortKey() === 'type') return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      return b.modifiedAt - a.modifiedAt;
    });
    // Folders first for a tidier listing.
    return [...sorted.filter((n) => n.type === 'folder'), ...sorted.filter((n) => n.type === 'file')];
  });

  navigateTo(folderId: string): void {
    this.currentFolder.set(folderId);
    this.selection.set(new Set());
    this.previewNode.set(null);
    this.query.set('');
    const newHistory = [...this.history().slice(0, this.historyIndex() + 1), folderId];
    this.history.set(newHistory);
    this.historyIndex.set(newHistory.length - 1);
  }

  canGoBack(): boolean {
    return this.historyIndex() > 0;
  }

  canGoForward(): boolean {
    return this.historyIndex() < this.history().length - 1;
  }

  goBack(): void {
    if (!this.canGoBack()) return;
    const index = this.historyIndex() - 1;
    this.historyIndex.set(index);
    this.currentFolder.set(this.history()[index]);
  }

  goForward(): void {
    if (!this.canGoForward()) return;
    const index = this.historyIndex() + 1;
    this.historyIndex.set(index);
    this.currentFolder.set(this.history()[index]);
  }

  toggleView(): void {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  setSort(key: SortKey): void {
    this.sortKey.set(key);
  }

  isSelected(id: string): boolean {
    return this.selection().has(id);
  }

  select(node: FsNode, event: MouseEvent): void {
    const multi = event.ctrlKey || event.metaKey;
    this.selection.update((current) => {
      const next = multi ? new Set(current) : new Set<string>();
      if (multi && next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
  }

  clearSelection(): void {
    this.selection.set(new Set());
  }

  openNode(node: FsNode): void {
    if (node.type === 'folder') {
      this.navigateTo(node.id);
    } else {
      this.previewNode.set(node);
      this.previewDraft.set(node.content ?? '');
    }
  }

  closePreview(): void {
    this.previewNode.set(null);
  }

  savePreview(): void {
    const node = this.previewNode();
    if (!node) return;
    void this.fs.updateContent(node.id, this.previewDraft());
  }

  openApp(appId: string): void {
    this.wm.open(appId);
  }

  async createFolder(): Promise<void> {
    if (this.isApplications()) return;
    const node = await this.fs.createFolder(this.currentFolder(), 'untitled folder');
    this.startRename(node);
  }

  startRename(node: FsNode): void {
    if (node.protected) return;
    this.renamingId.set(node.id);
    this.renameValue.set(node.name);
  }

  async commitRename(node: FsNode): Promise<void> {
    const value = this.renameValue().trim();
    if (value && value !== node.name) {
      await this.fs.rename(node.id, value);
    }
    this.renamingId.set(null);
  }

  cancelRename(): void {
    this.renamingId.set(null);
  }

  async moveToTrash(node: FsNode): Promise<void> {
    if (node.protected) return;
    await this.fs.moveToTrash(node.id);
    this.selection.update((s) => {
      const next = new Set(s);
      next.delete(node.id);
      return next;
    });
  }

  async showInfo(node: FsNode): Promise<void> {
    const sizeLabel = node.type === 'folder' ? '—' : `${node.size} bytes`;
    await this.dialog.alert({
      title: node.name,
      message: `Kind: ${node.type === 'folder' ? 'Folder' : 'File'}\nSize: ${sizeLabel}\nCreated: ${new Date(node.createdAt).toLocaleString()}\nModified: ${new Date(node.modifiedAt).toLocaleString()}`,
    });
  }

  onContextMenu(event: MouseEvent, node: FsNode): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.selection().has(node.id)) {
      this.selection.set(new Set([node.id]));
    }
    const destinations = [ROOT_ID, DESKTOP_ID, DOCUMENTS_ID, DOWNLOADS_ID].filter((id) => id !== this.currentFolder());

    const items: ContextMenuItem[] = [
      { id: 'open', label: 'Open', icon: 'chevronRight', action: () => this.openNode(node) },
      {
        id: 'rename',
        label: 'Rename',
        icon: 'info',
        disabled: !!node.protected,
        action: () => this.startRename(node),
      },
      {
        id: 'move',
        label: 'Move to…',
        icon: 'folder',
        disabled: !!node.protected,
        action: () =>
          this.contextMenu.open(
            event.clientX,
            event.clientY,
            destinations.map((id) => ({
              id,
              label: this.sidebarItems.find((s) => s.id === id)?.label ?? id,
              icon: 'folder',
              action: () => void this.fs.move(node.id, id),
            })),
          ),
      },
      { id: 'info', label: 'Get Info', icon: 'info', action: () => this.showInfo(node) },
      { id: 'sep', separator: true },
      {
        id: 'trash',
        label: 'Move to Trash',
        icon: 'trash2',
        danger: true,
        disabled: !!node.protected,
        action: () => this.moveToTrash(node),
      },
    ];
    this.contextMenu.open(event.clientX, event.clientY, items);
  }

  onBackgroundContextMenu(event: MouseEvent): void {
    event.preventDefault();
    if (this.isApplications()) return;
    this.contextMenu.open(event.clientX, event.clientY, [
      { id: 'new-folder', label: 'New Folder', icon: 'folder', action: () => this.createFolder() },
    ]);
  }
}
