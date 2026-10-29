import { Injectable, computed, signal } from '@angular/core';
import { ALLOWED_TRANSITIONS, SystemState } from '../models/system-state.model';

/**
 * Finite state machine governing the whole life cycle of the simulated OS:
 *
 *   splash -> booting -> locked -> login -> desktop -> (sleeping <-> desktop) -> locked
 *
 * Every other service / component reacts to this state instead of inventing
 * its own notion of "are we logged in". Illegal transitions are rejected and
 * logged only to an in-memory signal (never to the console in production).
 */
@Injectable({ providedIn: 'root' })
export class SystemStateService {
  private readonly stateSignal = signal<SystemState>('splash');
  private readonly previousStateSignal = signal<SystemState | null>(null);
  private readonly lastRejection = signal<string | null>(null);

  readonly state = this.stateSignal.asReadonly();
  readonly previousState = this.previousStateSignal.asReadonly();
  readonly isDesktop = computed(() => this.stateSignal() === 'desktop');
  readonly isLocked = computed(() => this.stateSignal() === 'locked' || this.stateSignal() === 'login');
  readonly isSleeping = computed(() => this.stateSignal() === 'sleeping');

  /** Attempts a transition; returns whether it was accepted. */
  transition(to: SystemState): boolean {
    const from = this.stateSignal();
    const allowed = ALLOWED_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      this.lastRejection.set(`Transition ${from} -> ${to} rejected`);
      return false;
    }
    this.previousStateSignal.set(from);
    this.stateSignal.set(to);
    return true;
  }

  /** Convenience helpers used widely across the shell. */
  startBooting(): void {
    this.transition('booting');
  }

  finishBooting(): void {
    this.transition('locked');
  }

  requestLogin(): void {
    this.transition('login');
  }

  cancelLogin(): void {
    this.transition('locked');
  }

  completeLogin(): void {
    this.transition('desktop');
  }

  lock(): void {
    this.transition('locked');
  }

  sleep(): void {
    if (this.stateSignal() === 'desktop') this.transition('sleeping');
  }

  wake(): void {
    if (this.stateSignal() === 'sleeping') this.transition('desktop');
  }

  /** Begins the simulated restart sequence (shows a restart screen, then replays the boot animation). */
  restart(): void {
    this.transition('restarting');
  }

  /** Powers the simulated machine off (black screen) until the user turns it back on. */
  powerOff(): void {
    this.transition('off');
  }

  /** Called internally once the restart/off screens finish their delay/interaction to replay the boot sequence. */
  rebootToSplash(): void {
    this.transition('splash');
  }
}
