import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WindowManagerService } from '../../core/services/window-manager.service';
import { StorageService } from '../../core/services/storage.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { createId } from '../../shared/utils/id.util';

type LocalRoute = 'home' | 'about' | 'portfolio' | 'help';

interface SafariTab {
  id: string;
  history: string[];
  historyIndex: number;
  addressInput: string;
  kind: 'local' | 'external-notice' | 'invalid';
  route: LocalRoute | null;
}

const LOCAL_PAGES: Record<LocalRoute, { title: string }> = {
  home: { title: 'خانه — MacWeb OS' },
  about: { title: 'درباره — MacWeb OS' },
  portfolio: { title: 'نمونه‌کار — MacWeb OS' },
  help: { title: 'راهنما — MacWeb OS' },
};

const HOME_ADDRESS = 'macweb://home';
const HISTORY_KEY = 'safari-history';
const BOOKMARKS_KEY = 'safari-bookmarks';

function createTab(address: string = HOME_ADDRESS): SafariTab {
  return {
    id: createId('tab'),
    history: [address],
    historyIndex: 0,
    addressInput: address,
    kind: 'local',
    route: 'home',
  };
}

@Component({
  selector: 'mw-app-safari',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './safari.component.html',
  styleUrl: './safari.component.scss',
})
export class SafariComponent implements OnInit {
  readonly windowId = input<string>('');
  private readonly storage = inject(StorageService);
  private readonly wm = inject(WindowManagerService);

  readonly tabs = signal<SafariTab[]>([createTab()]);
  readonly activeTabId = signal<string>(this.tabs()[0].id);
  readonly showHistory = signal(false);

  readonly history = signal<{ address: string; title: string; at: number }[]>(
    this.storage.getItem(HISTORY_KEY, []),
  );
  readonly bookmarks = signal<string[]>(this.storage.getItem(BOOKMARKS_KEY, [HOME_ADDRESS]));

  readonly activeTab = computed(() => this.tabs().find((t) => t.id === this.activeTabId()) ?? this.tabs()[0]);
  readonly currentAddress = computed(() => this.activeTab().history[this.activeTab().historyIndex]);
  readonly isBookmarked = computed(() => this.bookmarks().includes(this.currentAddress()));

  ngOnInit(): void {
    const win = this.wm.windows().find((w) => w.id === this.windowId());
    const url = win?.data['url'];
    if (typeof url === 'string' && url !== HOME_ADDRESS) {
      this.navigate(url);
    }
  }

  newTab(): void {
    const tab = createTab();
    this.tabs.update((list) => [...list, tab]);
    this.activeTabId.set(tab.id);
  }

  closeTab(id: string, event?: Event): void {
    event?.stopPropagation();
    const list = this.tabs();
    if (list.length === 1) {
      this.tabs.set([createTab()]);
      this.activeTabId.set(this.tabs()[0].id);
      return;
    }
    const index = list.findIndex((t) => t.id === id);
    const next = list.filter((t) => t.id !== id);
    this.tabs.set(next);
    if (this.activeTabId() === id) {
      this.activeTabId.set(next[Math.max(0, index - 1)].id);
    }
  }

  selectTab(id: string): void {
    this.activeTabId.set(id);
  }

  canGoBack(): boolean {
    return this.activeTab().historyIndex > 0;
  }

  canGoForward(): boolean {
    return this.activeTab().historyIndex < this.activeTab().history.length - 1;
  }

  goBack(): void {
    this.updateActiveTab((tab) => ({ ...tab, historyIndex: Math.max(0, tab.historyIndex - 1) }));
    this.resolveCurrent();
  }

  goForward(): void {
    this.updateActiveTab((tab) => ({
      ...tab,
      historyIndex: Math.min(tab.history.length - 1, tab.historyIndex + 1),
    }));
    this.resolveCurrent();
  }

  goHome(): void {
    this.navigate(HOME_ADDRESS);
  }

  reload(): void {
    this.resolveCurrent();
  }

  private updateActiveTab(fn: (tab: SafariTab) => SafariTab): void {
    this.tabs.update((list) => list.map((t) => (t.id === this.activeTabId() ? fn(t) : t)));
  }

  onAddressInputChange(value: string): void {
    this.updateActiveTab((tab) => ({ ...tab, addressInput: value }));
  }

  submitAddress(): void {
    const raw = this.activeTab().addressInput.trim();
    if (raw) this.navigate(raw);
  }

  navigate(rawAddress: string): void {
    const address = this.normalizeAddress(rawAddress);
    this.updateActiveTab((tab) => {
      const truncated = tab.history.slice(0, tab.historyIndex + 1);
      return { ...tab, history: [...truncated, address], historyIndex: truncated.length, addressInput: address };
    });
    this.resolveCurrent();
  }

  private normalizeAddress(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith('macweb://')) return trimmed;
    const localMatch = (['home', 'about', 'portfolio', 'help'] as LocalRoute[]).find(
      (route) => trimmed.toLowerCase() === route,
    );
    if (localMatch) return `macweb://${localMatch}`;
    return trimmed;
  }

  private resolveCurrent(): void {
    const address = this.currentAddress();
    const tab = this.activeTab();

    if (address.startsWith('macweb://')) {
      const route = address.replace('macweb://', '').split(/[/?#]/)[0] as LocalRoute;
      if (route in LOCAL_PAGES) {
        this.updateActiveTab((t) => ({ ...t, kind: 'local', route, addressInput: address }));
        this.pushHistory(address, LOCAL_PAGES[route].title);
        return;
      }
      this.updateActiveTab((t) => ({ ...t, kind: 'invalid', route: null, addressInput: address }));
      return;
    }

    if (this.looksLikeUrl(address)) {
      this.updateActiveTab((t) => ({ ...t, kind: 'external-notice', route: null, addressInput: address }));
      this.pushHistory(address, address);
      return;
    }

    this.updateActiveTab((t) => ({ ...t, kind: 'invalid', route: null, addressInput: address }));
    void tab;
  }

  private looksLikeUrl(value: string): boolean {
    return /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(value.trim());
  }

  openExternally(): void {
    const address = this.currentAddress();
    const url = address.startsWith('http') ? address : `https://${address}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private pushHistory(address: string, title: string): void {
    this.history.update((list) => {
      const next = [{ address, title, at: Date.now() }, ...list].slice(0, 40);
      this.storage.setItem(HISTORY_KEY, next);
      return next;
    });
  }

  toggleBookmark(): void {
    const address = this.currentAddress();
    this.bookmarks.update((list) => {
      const next = list.includes(address) ? list.filter((a) => a !== address) : [...list, address];
      this.storage.setItem(BOOKMARKS_KEY, next);
      return next;
    });
  }

  toggleHistoryPanel(): void {
    this.showHistory.update((v) => !v);
  }

  clearHistory(): void {
    this.history.set([]);
    this.storage.setItem(HISTORY_KEY, []);
  }
}
