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
});
