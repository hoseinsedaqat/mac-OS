/**
 * Top level states of the simulated operating system.
 * Transitions are governed exclusively by `SystemStateService`
 * so the whole application has a single source of truth.
 */
export type SystemState = 'splash' | 'booting' | 'locked' | 'login' | 'desktop' | 'sleeping';

/** Directed graph of allowed transitions – anything not listed here is rejected. */
export const ALLOWED_TRANSITIONS: Record<SystemState, SystemState[]> = {
  splash: ['booting'],
  booting: ['locked'],
  locked: ['login', 'locked'],
  login: ['desktop', 'locked'],
  desktop: ['locked', 'sleeping'],
  sleeping: ['desktop', 'locked'],
};
