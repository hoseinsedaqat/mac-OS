/**
 * Declarative catalogue backing the Launchpad overlay. Two kinds of tiles:
 *  - `real`   -> a genuine, registered application; clicking it opens the
 *                actual app window via the application registry.
 *  - `placeholder` -> an app shown for visual completeness (to mirror a
 *                stock macOS Launchpad) that has no real implementation in
 *                this project. Clicking it opens a clearly-labelled
 *                "not implemented in this demo" dialog — it is never a dead,
 *                undisclosed no-op.
 *
 * Every background is an original flat/gradient colour combination inspired
 * by (but not copied from) the real app's accent colour — no Apple artwork
 * is reproduced.
 */
export type LaunchpadCategory = 'utilities' | 'productivity' | 'creativity' | 'entertainment' | 'social' | 'other';

export interface LaunchpadRealTile {
  kind: 'real';
  appId: string;
  nameOverride?: string;
  category: LaunchpadCategory;
  background: string;
  glyphColor?: string;
}

export interface LaunchpadPlaceholderTile {
  kind: 'placeholder';
  id: string;
  nameKey: string;
  category: LaunchpadCategory;
  background: string;
  glyph?: string;
  text?: string;
  glyphColor?: string;
  /** If set, the placeholder dialog offers to open this real app instead. */
  suggestAppId?: string;
}

export type LaunchpadTile = LaunchpadRealTile | LaunchpadPlaceholderTile;

export const LAUNCHPAD_TILES: LaunchpadTile[] = [
  // Real, functional apps -------------------------------------------------
  {
    kind: 'real',
    appId: 'settings',
    nameOverride: 'System Settings',
    category: 'utilities',
    background: 'linear-gradient(160deg, #9a9aa0, #525258)',
  },
  { kind: 'real', appId: 'photos', category: 'creativity', background: 'conic-gradient(from 210deg, #ffd43b, #fb7185, #a78bfa, #34d399, #ffd43b)' },
  { kind: 'real', appId: 'safari', category: 'social', background: 'linear-gradient(160deg, #eaf6ff, #2f8fd6)', glyphColor: '#1769aa' },
  { kind: 'real', appId: 'app-store', category: 'utilities', background: 'linear-gradient(160deg, #4f9bff, #0a5fd1)' },
  { kind: 'real', appId: 'calculator', category: 'utilities', background: 'linear-gradient(160deg, #3a3a3c, #121214)' },
  { kind: 'real', appId: 'calendar', category: 'productivity', background: '#fff', glyphColor: '#ff3b30' },
  { kind: 'real', appId: 'games', category: 'entertainment', background: 'linear-gradient(160deg, #c084fc, #6d28d9)' },
  { kind: 'real', appId: 'mail', category: 'social', background: 'linear-gradient(160deg, #6dd5ff, #1270c7)' },
  { kind: 'real', appId: 'notes', category: 'productivity', background: 'linear-gradient(160deg, #ffe48a, #f4b73f)' },
  { kind: 'real', appId: 'music', category: 'entertainment', background: 'linear-gradient(160deg, #fb6f92, #c6174e)' },
  { kind: 'real', appId: 'finder', category: 'utilities', background: 'linear-gradient(160deg, #6fd0ff, #2f6fed)' },
  { kind: 'real', appId: 'terminal', category: 'utilities', background: 'linear-gradient(160deg, #2b2b2e, #000)', glyphColor: '#32d74b' },
  { kind: 'real', appId: 'vscode', nameOverride: 'Code', category: 'utilities', background: 'linear-gradient(160deg, #3b82f6, #1746a2)' },

  // Placeholder apps shown for visual fidelity only ------------------------
  {
    kind: 'placeholder',
    id: 'preview',
    nameKey: 'shell.launchpad.apps.preview',
    category: 'utilities',
    background: 'linear-gradient(160deg, #eef0f3, #b9bec6)',
    glyph: 'eye',
    glyphColor: '#3a3a3c',
  },
  {
    kind: 'placeholder',
    id: 'maps',
    nameKey: 'shell.launchpad.apps.maps',
    category: 'other',
    background: 'linear-gradient(160deg, #a8e6a1, #2e9e5b)',
    glyph: 'globe',
  },
  {
    kind: 'placeholder',
    id: 'automator',
    nameKey: 'shell.launchpad.apps.automator',
    category: 'utilities',
    background: 'linear-gradient(160deg, #c9c9cf, #6e6e73)',
    glyph: 'sparkles',
  },
  {
    kind: 'placeholder',
    id: 'books',
    nameKey: 'shell.launchpad.apps.books',
    category: 'entertainment',
    background: 'linear-gradient(160deg, #ffcf86, #ef7f1a)',
    glyph: 'file-text',
  },
  {
    kind: 'placeholder',
    id: 'chess',
    nameKey: 'shell.launchpad.apps.chess',
    category: 'entertainment',
    background: 'linear-gradient(160deg, #e8e8ea, #4b4b4f)',
    text: '♞',
    glyphColor: '#1c1c1e',
    suggestAppId: 'games',
  },
  {
    kind: 'placeholder',
    id: 'clock',
    nameKey: 'shell.launchpad.apps.clock',
    category: 'utilities',
    background: 'linear-gradient(160deg, #1c1c1e, #000)',
    glyph: 'history',
  },
  {
    kind: 'placeholder',
    id: 'contacts',
    nameKey: 'shell.launchpad.apps.contacts',
    category: 'productivity',
    background: 'linear-gradient(160deg, #fdfdfd, #d8d8dc)',
    glyph: 'user',
    glyphColor: '#3a3a3c',
  },
  {
    kind: 'placeholder',
    id: 'dictionary',
    nameKey: 'shell.launchpad.apps.dictionary',
    category: 'productivity',
    background: 'linear-gradient(160deg, #ff8a80, #d32f2f)',
    text: 'Aa',
  },
  {
    kind: 'placeholder',
    id: 'facetime',
    nameKey: 'shell.launchpad.apps.facetime',
    category: 'social',
    background: 'linear-gradient(160deg, #7be08a, #1f9e4c)',
    glyph: 'video',
  },
  {
    kind: 'placeholder',
    id: 'findmy',
    nameKey: 'shell.launchpad.apps.findMy',
    category: 'utilities',
    background: 'linear-gradient(160deg, #4b4bdc, #1b1b6e)',
    glyph: 'radar',
  },
  {
    kind: 'placeholder',
    id: 'fontbook',
    nameKey: 'shell.launchpad.apps.fontBook',
    category: 'creativity',
    background: 'linear-gradient(160deg, #ffffff, #d8d8dc)',
    text: 'Aa',
    glyphColor: '#ff3b30',
  },
  {
    kind: 'placeholder',
    id: 'freeform',
    nameKey: 'shell.launchpad.apps.freeform',
    category: 'creativity',
    background: 'linear-gradient(160deg, #ffe08a, #ff6fae, #8a7bff)',
    glyph: 'pen',
  },
  {
    kind: 'placeholder',
    id: 'home',
    nameKey: 'shell.launchpad.apps.home',
    category: 'other',
    background: 'linear-gradient(160deg, #6fe3d6, #0f8f8a)',
    glyph: 'home',
  },
];

export const LAUNCHPAD_CATEGORIES: { id: 'all' | LaunchpadCategory; labelKey: string }[] = [
  { id: 'all', labelKey: 'shell.launchpad.categories.all' },
  { id: 'utilities', labelKey: 'shell.launchpad.categories.utilities' },
  { id: 'productivity', labelKey: 'shell.launchpad.categories.productivity' },
  { id: 'creativity', labelKey: 'shell.launchpad.categories.creativity' },
  { id: 'entertainment', labelKey: 'shell.launchpad.categories.entertainment' },
  { id: 'social', labelKey: 'shell.launchpad.categories.social' },
  { id: 'other', labelKey: 'shell.launchpad.categories.other' },
];
