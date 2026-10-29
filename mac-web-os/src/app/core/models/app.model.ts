import { Type } from '@angular/core';

/** Stable identifiers for every built-in application. */
export type AppId =
  | 'finder'
  | 'safari'
  | 'notes'
  | 'calendar'
  | 'calculator'
  | 'settings'
  | 'terminal'
  | 'photos'
  | 'music'
  | 'mail'
  | 'app-store'
  | 'about'
  | 'trash'
  | 'games'
  | 'vscode';

export interface AppWindowDefaults {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  resizable: boolean;
}

/** Describes an application without requiring eager knowledge of its implementation. */
export interface AppDefinition {
  id: AppId;
  name: string;
  icon: string;
  category: 'system' | 'productivity' | 'internet' | 'media' | 'utilities';
  /** True when the app may only ever have a single open window. */
  singleInstance: boolean;
  showInDock: boolean;
  showInLaunchpad: boolean;
  window: AppWindowDefaults;
  /** Lazily imports the standalone component that renders this app's window content. */
  loadComponent: () => Promise<Type<unknown>>;
  description: string;
}
