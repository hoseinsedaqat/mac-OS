export interface TerminalContext {
  userName: string;
  currentPath: string;
  listCurrentDir: () => string[];
}

export type CommandOutput = string[];

/**
 * Allow-listed, pure command handlers. The terminal only ever looks commands
 * up in this table and never evaluates user input as code – unknown
 * commands produce a friendly error instead of doing nothing silently.
 */
export function runCommand(input: string, ctx: TerminalContext): CommandOutput {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const [name, ...args] = trimmed.split(/\s+/);
  const command = name.toLowerCase();

  switch (command) {
    case 'help':
      return [
        'Available commands:',
        '  help      Show this help',
        '  about     About MacWeb OS Terminal',
        '  whoami    Show the current user name',
        '  date      Show the system date and time',
        '  echo      Echo back the input text',
        '  ls        List the current folder contents (simulated)',
        '  pwd       Show the current folder path',
        '  neofetch  Show system info for show',
        '  clear     Clear the terminal screen',
      ];
    case 'about':
      return [
        'MacWeb OS Terminal (simulated)',
        'This terminal never executes any command on your real machine.',
        'Every command is processed in an isolated, sandboxed browser environment.',
      ];
    case 'whoami':
      return [ctx.userName.toLowerCase().replace(/\s+/g, '-')];
    case 'date':
      return [new Date().toString()];
    case 'echo':
      return [args.join(' ')];
    case 'pwd':
      return [ctx.currentPath];
    case 'ls': {
      const entries = ctx.listCurrentDir();
      return entries.length ? [entries.join('   ')] : ['(empty folder)'];
    }
    case 'neofetch':
      return [
        `${ctx.userName}@macweb-os`,
        '--------------------',
        'OS: MacWeb OS 1.0.0 (Simulated)',
        'Host: Browser Virtual Machine',
        'Kernel: Angular 22 Signals Runtime',
        `Shell: macweb-sh (sandboxed)`,
        `Uptime: ${Math.floor(performance.now() / 1000)}s`,
        'CPU: Simulated (depends on host browser)',
      ];
    case 'clear':
      return ['__CLEAR__'];
    default:
      return [`Command not found: ${command}. Run "help" to see the list of commands.`];
  }
}
