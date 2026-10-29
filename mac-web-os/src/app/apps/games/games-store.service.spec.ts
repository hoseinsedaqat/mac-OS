import { TestBed } from '@angular/core/testing';
import { GamesStoreService } from './games-store.service';

describe('GamesStoreService', () => {
  let service: GamesStoreService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GamesStoreService);
  });

  it('starts every game at a best score of 0', () => {
    expect(service.best('snake')).toBe(0);
    expect(service.best('2048')).toBe(0);
    expect(service.best('memory')).toBe(0);
    expect(service.best('tic-tac-toe')).toBe(0);
    expect(service.best('breakout')).toBe(0);
  });

  it('submit() only updates the best score when the new score is higher', () => {
    service.submit('snake', 50);
    expect(service.best('snake')).toBe(50);

    service.submit('snake', 20);
    expect(service.best('snake')).toBe(50);

    service.submit('snake', 90);
    expect(service.best('snake')).toBe(90);
  });

  it('persists best scores across service instances (localStorage)', () => {
    service.submit('2048', 2048);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(GamesStoreService);
    expect(fresh.best('2048')).toBe(2048);
  });

  it('tracks scores for different games independently', () => {
    service.submit('snake', 10);
    service.submit('breakout', 30);
    expect(service.best('snake')).toBe(10);
    expect(service.best('breakout')).toBe(30);
    expect(service.best('memory')).toBe(0);
  });
});
