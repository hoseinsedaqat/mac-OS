import { TestBed } from '@angular/core/testing';
import { App } from '../../app';
import { SystemStateService } from '../../core/services/system-state.service';

describe('MenuBarComponent — menu dropdowns (real bubbling DOM click, like an actual user click)', () => {
  function bootToDesktop() {
    TestBed.configureTestingModule({ imports: [App] });
    const fixture = TestBed.createComponent(App);
    const system = TestBed.inject(SystemStateService);
    system.transition('booting');
    system.transition('locked');
    system.transition('login');
    system.transition('desktop');
    fixture.detectChanges();
    return fixture;
  }

  function realClick(el: HTMLElement) {
    // A real user click bubbles all the way up to `document`, unlike calling
    // the Angular (click) handler directly from a test. This is what exposed
    // the regression below: the context menu's own `document:click` listener
    // was closing the menu in the very same tick it was opened in.
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  it('REGRESSION: clicking the system menu button actually opens and keeps open its dropdown', () => {
    // A real bug found in manual testing: every menu-bar dropdown (system
    // menu, File, Edit, View, Window, Help, Wi-Fi) opened via
    // ContextMenuService.open(), but the opening click handler never called
    // event.stopPropagation(). The click bubbled from the button up to
    // `document`, where ContextMenuComponent's `document:click` listener
    // immediately closed the just-opened menu again — all within the same
    // synchronous click — so clicking the logo mark (or File/Edit/View/
    // Window/Help/Wi-Fi) appeared to do nothing at all.
    const fixture = bootToDesktop();
    const appleBtn = fixture.nativeElement.querySelector('.mw-menubar__apple') as HTMLButtonElement;
    expect(appleBtn).toBeTruthy();

    realClick(appleBtn);
    fixture.detectChanges();

    const menu = document.querySelector('.mw-context-menu');
    expect(menu).toBeTruthy();

    const labels = Array.from(menu!.querySelectorAll('.mw-context-menu__item')).map(
      (btn) => btn.textContent?.trim(),
    );
    expect(labels.some((l) => l?.includes('Shut Down'))).toBe(true);
  });

  it('keeps the File menu open after a real click (same bug, different button)', () => {
    const fixture = bootToDesktop();
    const fileBtn = Array.from(
      fixture.nativeElement.querySelectorAll('.mw-menubar__item') as NodeListOf<HTMLButtonElement>,
    ).find((btn) => btn.textContent?.trim() === 'File')!;
    expect(fileBtn).toBeTruthy();

    realClick(fileBtn);
    fixture.detectChanges();

    expect(document.querySelector('.mw-context-menu')).toBeTruthy();
  });

  it('closes the menu on a real click outside of it', () => {
    const fixture = bootToDesktop();
    const appleBtn = fixture.nativeElement.querySelector('.mw-menubar__apple') as HTMLButtonElement;

    realClick(appleBtn);
    fixture.detectChanges();
    expect(document.querySelector('.mw-context-menu')).toBeTruthy();

    realClick(document.body);
    fixture.detectChanges();
    expect(document.querySelector('.mw-context-menu')).toBeFalsy();
  });
});
