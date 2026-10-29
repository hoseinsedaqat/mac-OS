import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { SystemStateService } from './core/services/system-state.service';

describe('App (root shell / state-machine rendering)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('starts in the splash state and renders the boot screen', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const system = TestBed.inject(SystemStateService);
    expect(system.state()).toBe('splash');
    expect(fixture.nativeElement.querySelector('mw-boot')).toBeTruthy();
  });

  it('renders the lock screen once the system reaches the locked state', () => {
    const fixture = TestBed.createComponent(App);
    const system = TestBed.inject(SystemStateService);
    system.transition('booting');
    system.transition('locked');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mw-lock-screen')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('mw-boot')).toBeFalsy();
  });

  it('renders the desktop once logged in', () => {
    const fixture = TestBed.createComponent(App);
    const system = TestBed.inject(SystemStateService);
    system.transition('booting');
    system.transition('locked');
    system.transition('login');
    system.transition('desktop');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mw-desktop')).toBeTruthy();
  });

  it('shows the sleep overlay above the desktop while sleeping, and clicking it wakes the system', () => {
    const fixture = TestBed.createComponent(App);
    const system = TestBed.inject(SystemStateService);
    system.transition('booting');
    system.transition('locked');
    system.transition('login');
    system.transition('desktop');
    system.sleep();
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.mw-sleep-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(fixture.nativeElement.querySelector('mw-desktop')).toBeTruthy();

    overlay.click();
    expect(system.state()).toBe('desktop');
  });

  it('REGRESSION: the boot sequence actually completes end-to-end instead of freezing on the splash->booting handoff', () => {
    // Guards against a real bug found in manual testing: splash and booting
    // used to be two separate @switch cases that both rendered <mw-boot/>,
    // which made Angular destroy and recreate the component on the
    // splash -> booting transition, silently resetting its timers and
    // freezing the UI forever on the first boot step.
    vi.useFakeTimers();
    try {
      const fixture = TestBed.createComponent(App);
      const system = TestBed.inject(SystemStateService);
      fixture.detectChanges();
      expect(system.state()).toBe('splash');

      // The SAME <mw-boot> element must stay in the DOM across the whole
      // splash -> booting hand-off (not be torn down and rebuilt).
      const bootElBeforeHandoff = fixture.nativeElement.querySelector('mw-boot');
      expect(bootElBeforeHandoff).toBeTruthy();

      // Drive the splash progress bar (4%/60ms) all the way to 100%.
      vi.advanceTimersByTime(2000);
      fixture.detectChanges();
      expect(system.state()).toBe('booting');

      const bootElAfterHandoff = fixture.nativeElement.querySelector('mw-boot');
      expect(bootElAfterHandoff).toBe(bootElBeforeHandoff);

      // Drive the boot progress bar (2.2%/70ms) all the way to 100% and past
      // the final 350ms settle timeout.
      vi.advanceTimersByTime(5000);
      fixture.detectChanges();

      expect(system.state()).toBe('locked');
      expect(fixture.nativeElement.querySelector('mw-lock-screen')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
