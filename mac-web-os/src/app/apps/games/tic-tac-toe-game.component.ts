import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { GamesStoreService } from './games-store.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Cell = 'X' | 'O' | null;
type Mode = 'friend' | 'computer';

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** Real, playable Tic-Tac-Toe: two local players, or vs. a lightweight unbeatable-ish computer. */
@Component({
  selector: 'mw-game-tic-tac-toe',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mw-ttt">
      <div class="mw-ttt__modes">
        <button type="button" [class.active]="mode() === 'friend'" (click)="setMode('friend')">
          {{ i18n.t('apps.games.ticTacToe.vsFriend') }}
        </button>
        <button type="button" [class.active]="mode() === 'computer'" (click)="setMode('computer')">
          {{ i18n.t('apps.games.ticTacToe.vsComputer') }}
        </button>
      </div>

      <p class="mw-ttt__status">{{ statusText() }}</p>

      <div class="mw-ttt__board">
        @for (cell of board(); track $index) {
          <button
            type="button"
            class="mw-ttt__cell"
            [disabled]="!!cell || !!winner() || isDraw()"
            (click)="play($index)"
          >
            @if (cell === 'X') {
              <mw-icon name="close" [size]="28" />
            }
            @if (cell === 'O') {
              <span class="mw-ttt__o"></span>
            }
          </button>
        }
      </div>

      <button type="button" class="mw-ttt__reset" (click)="reset()">
        {{ i18n.t('apps.games.newGame') }}
      </button>
    </div>
  `,
  styleUrl: './tic-tac-toe-game.component.scss',
})
export class TicTacToeGameComponent {
  readonly i18n = inject(I18nService);
  private readonly store = inject(GamesStoreService);

  readonly mode = signal<Mode>('friend');
  readonly board = signal<Cell[]>(Array(9).fill(null));
  readonly current = signal<'X' | 'O'>('X');
  private wins = { X: 0, O: 0 };

  readonly winner = computed<Cell>(() => {
    const b = this.board();
    for (const [a, c, d] of LINES) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return null;
  });

  readonly isDraw = computed(() => !this.winner() && this.board().every((c) => c !== null));

  readonly statusText = computed(() => {
    const w = this.winner();
    if (w) return this.i18n.t('apps.games.ticTacToe.winner', w);
    if (this.isDraw()) return this.i18n.t('apps.games.ticTacToe.draw');
    return this.i18n.t('apps.games.ticTacToe.playerTurn', this.current());
  });

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.reset();
  }

  play(index: number): void {
    if (this.board()[index] || this.winner() || this.isDraw()) return;
    this.place(index, this.current());

    if (this.winner() || this.isDraw()) {
      this.recordResult();
      return;
    }

    this.current.set(this.current() === 'X' ? 'O' : 'X');

    if (this.mode() === 'computer' && this.current() === 'O') {
      setTimeout(() => this.computerMove(), 300);
    }
  }

  private place(index: number, mark: 'X' | 'O'): void {
    this.board.update((b) => {
      const next = [...b];
      next[index] = mark;
      return next;
    });
  }

  private computerMove(): void {
    if (this.winner() || this.isDraw()) return;
    const b = this.board();
    const empty = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    const move = this.bestMove(b) ?? empty[Math.floor(Math.random() * empty.length)];
    this.place(move, 'O');
    if (this.winner() || this.isDraw()) {
      this.recordResult();
      return;
    }
    this.current.set('X');
  }

  /** Simple heuristic: win if possible, block if necessary, else take center/corner. */
  private bestMove(board: Cell[]): number | null {
    const tryWinFor = (mark: 'X' | 'O'): number | null => {
      for (const [a, c, d] of LINES) {
        const line = [board[a], board[c], board[d]];
        const marks = line.filter((v) => v === mark).length;
        const empties = [a, c, d].filter((i) => !board[i]);
        if (marks === 2 && empties.length === 1) return empties[0];
      }
      return null;
    };
    return (
      tryWinFor('O') ??
      tryWinFor('X') ??
      (board[4] === null ? 4 : null) ??
      [0, 2, 6, 8].find((i) => board[i] === null) ??
      null
    );
  }

  private recordResult(): void {
    const w = this.winner();
    if (w) {
      this.wins[w] = (this.wins[w] ?? 0) + 1;
      this.store.submit('tic-tac-toe', Math.max(this.wins.X, this.wins.O));
    }
  }

  reset(): void {
    this.board.set(Array(9).fill(null));
    this.current.set('X');
  }
}
