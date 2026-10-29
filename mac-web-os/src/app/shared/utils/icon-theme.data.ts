/**
 * Per-app/per-icon visual theme (gradient background + glyph colour) used to
 * render every "app-like" icon — Dock, Desktop and Launchpad — as a
 * colourful rounded-square tile instead of a flat monochrome outline, in the
 * spirit of real macOS app icons. All gradients are original colour
 * combinations; no Apple artwork is reproduced.
 */
export interface IconTheme {
  background: string;
  glyphColor?: string;
  /** When true, the consumer should render the current day-of-month instead of the glyph (Calendar). */
  dynamicDate?: boolean;
}

const DEFAULT_THEME: IconTheme = { background: 'linear-gradient(160deg, #9a9aa0, #525258)' };

export const ICON_THEMES: Record<string, IconTheme> = {
  finder: { background: 'linear-gradient(160deg, #6fd0ff, #2f6fed)' },
  safari: { background: 'linear-gradient(160deg, #eaf6ff, #2f8fd6)', glyphColor: '#1769aa' },
  mail: { background: 'linear-gradient(160deg, #6dd5ff, #1270c7)' },
  calendar: { background: '#fff', glyphColor: '#ff3b30', dynamicDate: true },
  notes: { background: 'linear-gradient(160deg, #ffe48a, #f4b73f)', glyphColor: '#7a5b00' },
  photos: { background: 'conic-gradient(from 210deg, #ffd43b, #fb7185, #a78bfa, #34d399, #ffd43b)' },
  music: { background: 'linear-gradient(160deg, #fb6f92, #c6174e)' },
  calculator: { background: 'linear-gradient(160deg, #3a3a3c, #121214)' },
  terminal: { background: 'linear-gradient(160deg, #2b2b2e, #000)', glyphColor: '#32d74b' },
  'app-store': { background: 'linear-gradient(160deg, #4f9bff, #0a5fd1)' },
  settings: { background: 'linear-gradient(160deg, #9a9aa0, #525258)' },
  games: { background: 'linear-gradient(160deg, #c084fc, #6d28d9)' },
  vscode: { background: 'linear-gradient(160deg, #3b82f6, #1746a2)' },
  about: { background: 'linear-gradient(160deg, #e2e2e7, #9a9aa0)', glyphColor: '#3a3a3c' },
  'about-this-mac': { background: 'linear-gradient(160deg, #e2e2e7, #9a9aa0)', glyphColor: '#3a3a3c' },
  trash: { background: 'linear-gradient(160deg, #d4d8dd, #80858c)', glyphColor: '#3a3a3c' },
  'macintosh-hd': { background: 'linear-gradient(160deg, #d9dde2, #9099a3)', glyphColor: '#3a3a3c' },
  documents: { background: 'linear-gradient(160deg, #8ec9ff, #3d82e0)' },
  downloads: { background: 'linear-gradient(160deg, #8ec9ff, #3d82e0)' },
  applications: { background: 'linear-gradient(160deg, #3a3a3c, #0a0a0c)' },
};

export function getIconTheme(id: string): IconTheme {
  return ICON_THEMES[id] ?? DEFAULT_THEME;
}
