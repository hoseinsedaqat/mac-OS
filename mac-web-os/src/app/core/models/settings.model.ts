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

/** MacWeb OS is English-only; this field is kept (always `'en'`) purely for settings-schema stability. */
export type AppLanguage = 'en';

export interface SettingsState {
  version: 2;
  theme: ThemeMode;
  accent: AccentColor;
  language: AppLanguage;
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
  bluetoothEnabled: boolean;
  airdropEnabled: boolean;
  stageManagerEnabled: boolean;
  screenMirroringEnabled: boolean;
  screenRecordingActive: boolean;
  keyboardBrightness: number;
}

export const DEFAULT_SETTINGS: SettingsState = {
  version: 2,
  theme: 'light',
  accent: 'blue',
  language: 'en',
  wallpaperId: 'aurora-waves',
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
  bluetoothEnabled: false,
  airdropEnabled: false,
  stageManagerEnabled: false,
  screenMirroringEnabled: false,
  screenRecordingActive: false,
  keyboardBrightness: 40,
};
