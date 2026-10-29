import { TestBed } from '@angular/core/testing';
import { SystemStateService } from './system-state.service';

describe('SystemStateService (boot/lock/login/desktop/sleep state machine)', () => {
  let service: SystemStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SystemStateService);
  });

  it('starts in the splash state', () => {
    expect(service.state()).toBe('splash');
  });

  it('walks the full splash -> booting -> locked -> login -> desktop happy path', () => {
    expect(service.transition('booting')).toBe(true);
    expect(service.state()).toBe('booting');

    service.finishBooting();
    expect(service.state()).toBe('locked');

    service.requestLogin();
    expect(service.state()).toBe('login');

    service.completeLogin();
    expect(service.state()).toBe('desktop');
    expect(service.isDesktop()).toBe(true);
  });

  it('rejects illegal/duplicate transitions instead of silently applying them', () => {
    expect(service.state()).toBe('splash');
    // splash -> desktop is not an allowed edge.
    expect(service.transition('desktop')).toBe(false);
    expect(service.state()).toBe('splash');

    service.startBooting();
    // booting -> booting (duplicate / self-loop) is not allowed either.
    expect(service.transition('booting')).toBe(false);
    expect(service.state()).toBe('booting');
  });

  it('supports sleep/wake only from the desktop state, preserving it otherwise', () => {
    // Sleeping before reaching desktop must have no effect.
    service.sleep();
    expect(service.state()).toBe('splash');

    service.startBooting();
    service.finishBooting();
    service.requestLogin();
    service.completeLogin();
    expect(service.state()).toBe('desktop');

    service.sleep();
    expect(service.state()).toBe('sleeping');
    expect(service.isSleeping()).toBe(true);

    service.wake();
    expect(service.state()).toBe('desktop');
  });

  it('allows cancelling a login attempt back to the lock screen', () => {
    service.startBooting();
    service.finishBooting();
    service.requestLogin();
    service.cancelLogin();
    expect(service.state()).toBe('locked');
  });
});
