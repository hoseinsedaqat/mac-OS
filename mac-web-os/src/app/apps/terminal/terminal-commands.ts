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
        'دستورات پشتیبانی‌شده:',
        '  help      نمایش این راهنما',
        '  about     درباره MacWeb OS Terminal',
        '  whoami    نمایش نام کاربر فعلی',
        '  date      نمایش تاریخ و ساعت سیستم',
        '  echo      بازتاب متن ورودی',
        '  ls        نمایش محتویات پوشه فعلی (شبیه‌سازی‌شده)',
        '  pwd       نمایش مسیر پوشه فعلی',
        '  neofetch  نمایش اطلاعات سیستم به‌صورت نمایشی',
        '  clear     پاک‌کردن صفحه ترمینال',
      ];
    case 'about':
      return [
        'MacWeb OS Terminal (شبیه‌سازی‌شده)',
        'این ترمینال هیچ دستوری را روی سیستم واقعی شما اجرا نمی‌کند.',
        'تمام دستورات در یک محیط ایزوله و امن در مرورگر پردازش می‌شوند.',
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
      return entries.length ? [entries.join('   ')] : ['(پوشه خالی است)'];
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
      return [`دستور یافت نشد: ${command}. برای مشاهده فهرست دستورات، help را اجرا کنید.`];
  }
}
