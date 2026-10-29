import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { FileSystemService } from '../../core/services/file-system.service';
import { DialogService } from '../../core/services/dialog.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { SoundService } from '../../core/services/sound.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { FsNode } from '../../core/models/file-system.model';

@Component({
  selector: 'mw-app-trash',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trash.component.html',
  styleUrl: './trash.component.scss',
})
export class TrashComponent {
  readonly windowId = input<string>('');

  readonly fs = inject(FileSystemService);
  private readonly dialog = inject(DialogService);
  private readonly wm = inject(WindowManagerService);
  private readonly sound = inject(SoundService);

  readonly trashedNodes = computed<FsNode[]>(() => this.fs.trashedNodes());

  /** Tracks the last processed "emptyRequested" timestamp so a re-trigger only fires once per request,
   * not on every unrelated window-manager state change (drag/focus/minimize of other windows). */
  private lastEmptyRequest: number | undefined;

  constructor() {
    // Supports the "Empty Trash" shortcut triggered from a desktop icon's context menu.
    effect(() => {
      const win = this.wm.windows().find((w) => w.id === this.windowId());
      const requested = win?.data['emptyRequested'] as number | undefined;
      if (requested && requested !== this.lastEmptyRequest) {
        this.lastEmptyRequest = requested;
        void this.emptyTrash();
      }
    });
  }

  async restore(node: FsNode): Promise<void> {
    await this.fs.restoreFromTrash(node.id);
  }

  async deleteForever(node: FsNode): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Delete Permanently',
      message: `"${node.name}" will be deleted permanently. This action cannot be undone.`,
      confirmLabel: 'Delete Permanently',
      danger: true,
    });
    if (confirmed) {
      await this.fs.deletePermanently(node.id);
      this.sound.trash();
    }
  }

  async emptyTrash(): Promise<void> {
    if (this.trashedNodes().length === 0) return;
    const confirmed = await this.dialog.confirm({
      title: 'Empty Trash',
      message: `${this.trashedNodes().length} item(s) will be permanently deleted. This action cannot be undone.`,
      confirmLabel: 'Empty Trash',
      danger: true,
    });
    if (confirmed) {
      await this.fs.emptyTrash();
      this.sound.trash();
    }
  }
}
