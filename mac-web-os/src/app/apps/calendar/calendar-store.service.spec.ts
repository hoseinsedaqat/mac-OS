import { TestBed } from '@angular/core/testing';
import { CalendarStoreService } from './calendar-store.service';
import { dateKey } from '../../shared/utils/date.util';

describe('CalendarStoreService', () => {
  let service: CalendarStoreService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalendarStoreService);
  });

  it('seeds a welcome event on today', () => {
    const today = dateKey(new Date());
    expect(service.eventsFor(today).length).toBe(1);
  });

  it('create() adds an event for the given day and countFor() reflects it', () => {
    const key = '2026-12-25';
    service.create({ dateKey: key, title: 'Holiday', description: '', time: '09:00' });
    expect(service.countFor(key)).toBe(1);
    expect(service.eventsFor(key)[0].title).toBe('Holiday');
  });

  it('eventsFor() returns events for a day sorted by time', () => {
    const key = '2026-07-04';
    service.create({ dateKey: key, title: 'Late', description: '', time: '18:00' });
    service.create({ dateKey: key, title: 'Early', description: '', time: '08:00' });
    const events = service.eventsFor(key);
    expect(events.map((e) => e.title)).toEqual(['Early', 'Late']);
  });

  it('update() patches an existing event in place', () => {
    const key = '2026-03-01';
    service.create({ dateKey: key, title: 'Draft', description: '', time: '10:00' });
    const id = service.eventsFor(key)[0].id;
    service.update(id, { title: 'Final' });
    expect(service.eventsFor(key)[0].title).toBe('Final');
  });

  it('remove() deletes an event so it no longer shows up for that day', () => {
    const key = '2026-03-02';
    service.create({ dateKey: key, title: 'Temp', description: '', time: '10:00' });
    const id = service.eventsFor(key)[0].id;
    service.remove(id);
    expect(service.countFor(key)).toBe(0);
  });

  it('persists events across service instances', () => {
    const key = '2026-09-09';
    service.create({ dateKey: key, title: 'Persisted', description: '', time: '12:00' });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const second = TestBed.inject(CalendarStoreService);
    expect(second.eventsFor(key).some((e) => e.title === 'Persisted')).toBe(true);
  });
});
