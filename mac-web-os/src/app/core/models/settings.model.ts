export type ThemeMode = 'light' | 'dark';

export type AccentColor =
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'graphite';

export interface SettingsState {
  version: 1;
  theme: ThemeMode;
  accent: AccentColor;
  wallpaperId: string;
  wallpaperFit: 'cover' | 'contain' | 'fill' | 'center';
  dockSize: number;
  dockAutoHide: boolean;
  dockMagnification: boolean;
  showDateInMenuBar: boolean;
  use24HourClock: boolean;
  reduceMotion: boolean;
  soundEnabled: boolean;
  volume: number;
  brightness: number;
  userName: string;
  passwordEnabled: boolean;
  passwordHash: string | null;
  wifiEnabled: boolean;
  focusMode: boolean;
}

export const DEFAULT_SETTINGS: SettingsState = {
  version: 1,
  theme: 'light',
  accent: 'blue',
  wallpaperId: 'aurora',
  wallpaperFit: 'cover',
  dockSize: 56,
  dockAutoHide: false,
  dockMagnification: true,
  showDateInMenuBar: true,
  use24HourClock: true,
  reduceMotion: false,
  soundEnabled: true,
  volume: 65,
  brightness: 100,
  userName: 'Guest User',
  passwordEnabled: false,
  passwordHash: null,
  wifiEnabled: true,
  focusMode: false,
};
