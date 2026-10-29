import { TestBed } from '@angular/core/testing';
import { DesktopService } from './desktop.service';

describe('DesktopService (desktop icons + position persistence)', () => {
  let service: DesktopService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(DesktopService);
  });

  it('exposes the fixed set of required desktop shortcuts', () => {
    const ids = service.icons().map((i) => i.id);
    expect(ids).toEqual(
      expect.arrayContaining(['macintosh-hd', 'documents', 'downloads', 'applications', 'trash', 'settings', 'about-this-mac']),
    );
  });

  it('positionFor() falls back to a deterministic grid position before anything is persisted', () => {
    const pos = service.positionFor('documents', 1);
    expect(pos.id).toBe('documents');
    expect(typeof pos.x).toBe('number');
    expect(typeof pos.y).toBe('number');
  });

  it('setPosition() persists the new coordinates for subsequent lookups', () => {
    service.setPosition('trash', 300, 450);
    const pos = service.positionFor('trash', 4);
    expect(pos).toEqual({ id: 'trash', x: 300, y: 450 });
  });

  it('persisted positions survive a fresh service instance (localStorage round trip)', () => {
    service.setPosition('settings', 10, 20);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const second = TestBed.inject(DesktopService);
    expect(second.positionFor('settings', 0)).toEqual({ id: 'settings', x: 10, y: 20 });
  });

  it('resetPositions() clears all custom placements', () => {
    service.setPosition('trash', 300, 450);
    service.resetPositions();
    const pos = service.positionFor('trash', 4);
    expect(pos).not.toEqual({ id: 'trash', x: 300, y: 450 });
  });

  it('select()/selectedId tracks the currently selected icon, including deselecting with null', () => {
    service.select('trash');
    expect(service.selectedId()).toBe('trash');
    service.select(null);
    expect(service.selectedId()).toBeNull();
  });
});
