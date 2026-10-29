export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowState {
  /** Unique identifier for this window instance. */
  id: string;
  /** Identifier of the application that owns this window (see ApplicationRegistry). */
  appId: string;
  /** Title shown in the title bar / menu bar. */
  title: string;
  /** Current geometry in desktop pixel coordinates. */
  rect: Rect;
  /** Geometry stored before maximizing, so it can be restored. */
  restoreRect: Rect | null;
  /** Minimum allowed size for manual resize. */
  minSize: { width: number; height: number };
  /** Whether the window may be resized by the user. */
  resizable: boolean;
  minimized: boolean;
  maximized: boolean;
  /** Only one window can be active (focused) at a time. */
  active: boolean;
  /** Stacking order – higher draws on top. */
  zIndex: number;
  /** Arbitrary payload passed by the opener (e.g. file to open, route). */
  data: Record<string, unknown>;
  /** Icon id used in Dock / window switchers. */
  icon: string;
  createdAt: number;
}

export interface OpenWindowOptions {
  title?: string;
  rect?: Partial<Rect>;
  minSize?: { width: number; height: number };
  resizable?: boolean;
  data?: Record<string, unknown>;
  /** Force a brand new window even for single-instance apps. */
  forceNew?: boolean;
}
