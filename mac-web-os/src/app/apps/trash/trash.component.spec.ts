import { TestBed } from '@angular/core/testing';
import { TrashComponent } from './trash.component';
import { FileSystemService } from '../../core/services/file-system.service';
import { DialogService } from '../../core/services/dialog.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { FsNode } from '../../core/models/file-system.model';

function trashedFile(id: string): FsNode {
  const now = Date.now();
  return {
    id,
    parentId: 'documents',
    name: `${id}.txt`,
    type: 'file',
    kind: 'text',
    content: '',
    size: 0,
    createdAt: now,
    modifiedAt: now,
    trashed: true,
  };
}

describe('TrashComponent — "Empty Trash" desktop-icon trigger (regression)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TrashComponent] }).compileComponents();
  });

  it('only asks for confirmation once per distinct emptyRequested timestamp, not on every unrelated window change', async () => {
    const fs = TestBed.inject(FileSystemService);
    fs.nodes.set([trashedFile('a')]);

    const dialog = TestBed.inject(DialogService);
    const confirmSpy = vi.spyOn(dialog, 'confirm').mockReturnValue(new Promise<boolean>(() => {}));

    const wm = TestBed.inject(WindowManagerService);
    const windowId = wm.open('trash')!;

    const fixture = TestBed.createComponent(TrashComponent);
    fixture.componentRef.setInput('windowId', windowId);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(confirmSpy).not.toHaveBeenCalled();

    // Simulates the desktop Trash icon's "Empty Trash" context-menu action.
    wm.open('trash', { data: { emptyRequested: Date.now() } });
    TestBed.flushEffects();
    expect(confirmSpy).toHaveBeenCalledTimes(1);

    // Any unrelated window-manager change (opening another app) must NOT re-trigger the dialog.
    wm.open('finder');
    wm.open('safari');
    TestBed.flushEffects();
    expect(confirmSpy).toHaveBeenCalledTimes(1);

    // A brand-new empty-trash request (new timestamp) legitimately fires again.
    wm.open('trash', { data: { emptyRequested: Date.now() + 1 } });
    TestBed.flushEffects();
    expect(confirmSpy).toHaveBeenCalledTimes(2);
  });
});
