import { Injectable } from '@angular/core';
import { AppDefinition, AppId } from '../models/app.model';

/**
 * Single place where every built-in application declares itself. The window
 * manager and Dock only ever talk to this registry, never to a concrete app
 * component, which keeps the core decoupled from individual apps and makes
 * it straightforward to add a new application later (see README).
 */
@Injectable({ providedIn: 'root' })
export class ApplicationRegistryService {
  private readonly apps: ReadonlyMap<AppId, AppDefinition> = new Map(
    this.definitions().map((app) => [app.id, app]),
  );

  list(): AppDefinition[] {
    return [...this.apps.values()];
  }

  dockApps(): AppDefinition[] {
    return this.list().filter((app) => app.showInDock);
  }

  launchpadApps(): AppDefinition[] {
    return this.list().filter((app) => app.showInLaunchpad);
  }

  get(id: string): AppDefinition | undefined {
    return this.apps.get(id as AppId);
  }

  private definitions(): AppDefinition[] {
    const defaultWindow = {
      width: 860,
      height: 560,
      minWidth: 420,
      minHeight: 320,
      resizable: true,
    };

    return [
      {
        id: 'finder',
        name: 'Finder',
        icon: 'finder',
        category: 'system',
        singleInstance: false,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 860, height: 560 },
        description: 'Browse and manage simulated files.',
        loadComponent: () =>
          import('../../apps/finder/finder.component').then((m) => m.FinderComponent),
      },
      {
        id: 'safari',
        name: 'Safari',
        icon: 'safari',
        category: 'internet',
        singleInstance: false,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 980, height: 640 },
        description: 'A demo in-app browser with local sample pages.',
        loadComponent: () =>
          import('../../apps/safari/safari.component').then((m) => m.SafariComponent),
      },
      {
        id: 'mail',
        name: 'Mail',
        icon: 'mail',
        category: 'productivity',
        singleInstance: true,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 920, height: 600 },
        description: 'Demo email client (Demo mode).',
        loadComponent: () => import('../../apps/mail/mail.component').then((m) => m.MailComponent),
      },
      {
        id: 'calendar',
        name: 'Calendar',
        icon: 'calendar',
        category: 'productivity',
        singleInstance: true,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 820, height: 600, minWidth: 560 },
        description: 'An interactive calendar with saved events.',
        loadComponent: () =>
          import('../../apps/calendar/calendar.component').then((m) => m.CalendarComponent),
      },
      {
        id: 'notes',
        name: 'Notes',
        icon: 'notes',
        category: 'productivity',
        singleInstance: true,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 780, height: 560 },
        description: 'Note-taking with automatic saving.',
        loadComponent: () => import('../../apps/notes/notes.component').then((m) => m.NotesComponent),
      },
      {
        id: 'photos',
        name: 'Photos',
        icon: 'photos',
        category: 'media',
        singleInstance: true,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 860, height: 600 },
        description: 'A gallery of sample photos.',
        loadComponent: () =>
          import('../../apps/photos/photos.component').then((m) => m.PhotosComponent),
      },
      {
        id: 'music',
        name: 'Music',
        icon: 'music',
        category: 'media',
        singleInstance: true,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 760, height: 560, minWidth: 540 },
        description: 'A demo music player.',
        loadComponent: () => import('../../apps/music/music.component').then((m) => m.MusicComponent),
      },
      {
        id: 'calculator',
        name: 'Calculator',
        icon: 'calculator',
        category: 'utilities',
        singleInstance: true,
        showInDock: true,
        showInLaunchpad: true,
        window: { width: 320, height: 500, minWidth: 300, minHeight: 460, resizable: false },
        description: 'A calculator with safe calculation logic.',
        loadComponent: () =>
          import('../../apps/calculator/calculator.component').then((m) => m.CalculatorComponent),
      },
      {
        id: 'terminal',
        name: 'Terminal',
        icon: 'terminal',
        category: 'utilities',
        singleInstance: false,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 700, height: 460, minWidth: 420, minHeight: 280 },
        description: 'A simulated terminal with a safe, allow-listed command set.',
        loadComponent: () =>
          import('../../apps/terminal/terminal.component').then((m) => m.TerminalComponent),
      },
      {
        id: 'app-store',
        name: 'App Store',
        icon: 'app-store',
        category: 'system',
        singleInstance: true,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 900, height: 620 },
        description: 'A demo app store.',
        loadComponent: () =>
          import('../../apps/app-store/app-store.component').then((m) => m.AppStoreComponent),
      },
      {
        id: 'settings',
        name: 'Settings',
        icon: 'settings',
        category: 'system',
        singleInstance: true,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 820, height: 580, minWidth: 640 },
        description: 'System settings.',
        loadComponent: () =>
          import('../../apps/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        id: 'trash',
        name: 'Trash',
        icon: 'trash',
        category: 'system',
        singleInstance: true,
        showInDock: true,
        showInLaunchpad: false,
        window: { ...defaultWindow, width: 720, height: 520 },
        description: 'Deleted files.',
        loadComponent: () => import('../../apps/trash/trash.component').then((m) => m.TrashComponent),
      },
      {
        id: 'games',
        name: 'Games',
        icon: 'games',
        category: 'media',
        singleInstance: false,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 780, height: 620, minWidth: 560, minHeight: 480 },
        description: 'A small arcade of real, playable games: Snake, Memory Match, 2048, Tic-Tac-Toe and Breakout.',
        loadComponent: () => import('../../apps/games/games.component').then((m) => m.GamesComponent),
      },
      {
        id: 'vscode',
        name: 'Code',
        icon: 'vscode',
        category: 'utilities',
        singleInstance: false,
        showInDock: true,
        showInLaunchpad: true,
        window: { ...defaultWindow, width: 980, height: 640, minWidth: 640, minHeight: 440 },
        description:
          'A simulated code editor: browse a sample project, edit files, and run JavaScript safely in a sandboxed iframe.',
        loadComponent: () => import('../../apps/vscode/vscode.component').then((m) => m.VscodeComponent),
      },
      {
        id: 'about',
        name: 'About This Mac',
        icon: 'about',
        category: 'system',
        singleInstance: true,
        showInDock: false,
        showInLaunchpad: false,
        window: { width: 560, height: 460, minWidth: 480, minHeight: 400, resizable: false },
        description: 'Simulated system information.',
        loadComponent: () => import('../../apps/about/about.component').then((m) => m.AboutComponent),
      },
    ];
  }
}
