import { TestBed } from '@angular/core/testing';
import { MailStoreService } from './mail-store.service';

describe('MailStoreService (demo mode — never a real send)', () => {
  let service: MailStoreService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MailStoreService);
  });

  it('seeds sample inbox messages', () => {
    expect(service.byFolder('inbox').length).toBeGreaterThan(0);
  });

  it('byFolder sorts messages newest first', () => {
    const inbox = service.byFolder('inbox');
    for (let i = 1; i < inbox.length; i++) {
      expect(inbox[i - 1].date).toBeGreaterThanOrEqual(inbox[i].date);
    }
  });

  it('markRead() flips the read flag on a single message', () => {
    const msg = service.byFolder('inbox').find((m) => !m.read)!;
    service.markRead(msg.id);
    expect(service.byFolder('inbox').find((m) => m.id === msg.id)?.read).toBe(true);
  });

  it('saveDraft() stores a message in the Drafts folder', () => {
    service.saveDraft({ to: 'a@b.com', subject: 'Draft', body: 'wip' });
    expect(service.byFolder('drafts').some((m) => m.subject === 'Draft')).toBe(true);
  });

  it('send() moves the message into Sent without any network call (demo mode)', () => {
    service.send({ to: 'x@y.com', subject: 'Hello', body: 'Hi there' });
    const sent = service.byFolder('sent');
    expect(sent.some((m) => m.subject === 'Hello' && m.to === 'x@y.com')).toBe(true);
  });

  it('remove() deletes a message from whichever folder it is in', () => {
    service.saveDraft({ to: 'z@z.com', subject: 'Delete me', body: '' });
    const draft = service.byFolder('drafts').find((m) => m.subject === 'Delete me')!;
    service.remove(draft.id);
    expect(service.byFolder('drafts').some((m) => m.id === draft.id)).toBe(false);
  });

  it('search() matches subject, body or sender', () => {
    service.saveDraft({ to: 'w@w.com', subject: 'Unique keyword zzz', body: '' });
    const results = service.search('zzz');
    expect(results.some((m) => m.subject.includes('zzz'))).toBe(true);
    expect(service.search('')).toEqual([]);
  });
});
