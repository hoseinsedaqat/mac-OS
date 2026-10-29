import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { SystemStateService } from './core/services/system-state.service';
import { FileSystemService } from './core/services/file-system.service';
import { BootComponent } from './shell/boot/boot.component';
import { LockScreenComponent } from './shell/lock-screen/lock-screen.component';
import { LoginComponent } from './shell/login/login.component';
import { DesktopComponent } from './shell/desktop/desktop.component';
import { ContextMenuComponent } from './shared/components/context-menu/context-menu.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    BootComponent,
    LockScreenComponent,
    LoginComponent,
    DesktopComponent,
    ContextMenuComponent,
    ConfirmDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly system = inject(SystemStateService);
  private readonly fs = inject(FileSystemService);

  ngOnInit(): void {
    void this.fs.init();
  }

  wake(): void {
    this.system.wake();
  }
}
