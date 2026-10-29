import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApplicationRegistryService } from '../../core/services/application-registry.service';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { AppStoreInstallService } from './app-store-install.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { getIconTheme } from '../../shared/utils/icon-theme.data';
import { AppDefinition } from '../../core/models/app.model';

const CATEGORY_LABELS: Record<string, string> = {
  system: 'System',
  productivity: 'Productivity',
  internet: 'Internet',
  media: 'Media',
  utilities: 'Utilities',
};

@Component({
  selector: 'mw-app-app-store',
  standalone: true,
  imports: [FormsModule, IconComponent, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-store.component.html',
  styleUrl: './app-store.component.scss',
})
export class AppStoreComponent {
  readonly windowId = input<string>('');
  private readonly registry = inject(ApplicationRegistryService);
  private readonly wm = inject(WindowManagerService);
  readonly install = inject(AppStoreInstallService);
  private readonly notifications = inject(NotificationService);

  readonly categoryLabels = CATEGORY_LABELS;

  themeFor(id: string) {
    return getIconTheme(id);
  }

  readonly query = signal('');
  readonly activeCategory = signal<string>('all');
  readonly selectedApp = signal<AppDefinition | null>(null);

  readonly categories = computed(() => {
    const set = new Set(this.registry.list().map((a) => a.category));
    return ['all', ...set];
  });

  readonly featured = computed(() => this.registry.list().filter((a) => ['notes', 'calendar', 'photos'].includes(a.id)));

  readonly visibleApps = computed<AppDefinition[]>(() => {
    const q = this.query().trim().toLowerCase();
    const category = this.activeCategory();
    return this.registry
      .list()
      .filter((a) => a.id !== 'about' && a.id !== 'trash')
      .filter((a) => category === 'all' || a.category === category)
      .filter((a) => !q || a.name.toLowerCase().includes(q) || a.description.includes(q));
  });

  selectApp(app: AppDefinition): void {
    this.selectedApp.set(app);
  }

  closeDetail(): void {
    this.selectedApp.set(null);
  }

  installApp(app: AppDefinition, event?: Event): void {
    event?.stopPropagation();
    this.install.install(app.id);
    this.notifications.push({
      appId: 'app-store',
      appName: 'App Store',
      icon: 'app-store',
      title: 'Installation Complete',
      body: `${app.name} is now available.`,
    });
  }

  openApp(app: AppDefinition, event?: Event): void {
    event?.stopPropagation();
    this.wm.open(app.id);
  }
}
