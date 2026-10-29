import { runCommand, TerminalContext } from './terminal-commands';

describe('Terminal command parser (allow-listed only, never real shell exec)', () => {
  const ctx: TerminalContext = {
    userName: 'Guest User',
    currentPath: '/Macintosh HD/Documents',
    listCurrentDir: () => ['Welcome.txt', 'Resume.txt'],
  };

  it('returns an empty array for blank input', () => {
    expect(runCommand('   ', ctx)).toEqual([]);
  });

  it('help lists the supported commands', () => {
    const out = runCommand('help', ctx);
    expect(out.join('\n')).toContain('whoami');
    expect(out.join('\n')).toContain('neofetch');
  });

  it('whoami derives a slug from the current user name', () => {
    expect(runCommand('whoami', ctx)).toEqual(['guest-user']);
  });

  it('echo reflects back exactly what was typed after it', () => {
    expect(runCommand('echo hello world', ctx)).toEqual(['hello world']);
  });

  it('pwd reports the simulated current path', () => {
    expect(runCommand('pwd', ctx)).toEqual(['/Macintosh HD/Documents']);
  });

  it('ls lists the simulated directory contents', () => {
    expect(runCommand('ls', ctx)[0]).toContain('Welcome.txt');
  });

  it('clear emits the dedicated clear-screen sentinel', () => {
    expect(runCommand('clear', ctx)).toEqual(['__CLEAR__']);
  });

  it('is case-insensitive and tolerant of surrounding whitespace', () => {
    expect(runCommand('  WHOAMI  ', ctx)).toEqual(['guest-user']);
  });

  it('never executes unknown input as code — it reports a friendly unknown-command message', () => {
    const out = runCommand('rm -rf / ; sudo reboot', ctx);
    expect(out[0]).toContain('rm');
    expect(out[0].toLowerCase()).not.toContain('error:');
  });

  it('date returns a real Date#toString() formatted value, not a crash', () => {
    const out = runCommand('date', ctx);
    expect(out.length).toBe(1);
    expect(Number.isNaN(new Date(out[0]).getTime())).toBe(false);
  });
});
