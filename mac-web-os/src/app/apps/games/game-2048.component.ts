import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { GamesStoreService } from './games-store.service';

type Board = number[][];
const SIZE = 4;

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function cloneBoard(b: Board): Board {
  return b.map((row) => [...row]);
}

function addRandomTile(board: Board): void {
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empties.push([r, c]);
    }
  }
  if (!empties.length) return;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

/** Slides and merges one row to the left; returns the merged row and points earned. */
function mergeRowLeft(row: number[]): { row: number[]; gained: number } {
  const compact = row.filter((v) => v !== 0);
  let gained = 0;
  for (let i = 0; i < compact.length - 1; i++) {
    if (compact[i] === compact[i + 1]) {
      compact[i] *= 2;
      gained += compact[i];
      compact.splice(i + 1, 1);
    }
  }
  while (compact.length < SIZE) compact.push(0);
  return { row: compact, gained };
}

function rotateClockwise(board: Board): Board {
  const next = emptyBoard();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      next[c][SIZE - 1 - r] = board[r][c];
    }
  }
  return next;
}

function boardsEqual(a: Board, b: Board): boolean {
  return a.every((row, r) => row.every((v, c) => v === b[r][c]));
}

/** Real 2048 implementation: slide/merge in 4 directions, random tile spawns, win/lose detection. */
@Component({
  selector: 'mw-game-2048',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mw-2048" tabindex="0" (keydown)="onKey($event)">
      <div class="mw-2048__stats">
        <span>{{ i18n.t('apps.games.score') }}: {{ score() }}</span>
        <span>{{ i18n.t('apps.games.best') }}: {{ store.best('2048') }}</span>
      </div>

      <div class="mw-2048__board">
        @for (row of board(); track $index) {
          @for (cell of row; track $index) {
            <div class="mw-2048__cell" [attr.data-value]="cell">
              @if (cell > 0) {
                {{ cell }}
              }
            </div>
          }
        }
      </div>

      @if (won() && !continued()) {
        <div class="mw-2048__overlay">
          <p>{{ i18n.t('apps.games.youWin') }}</p>
          <button type="button" (click)="continued.set(true)">{{ i18n.t('common.ok') }}</button>
        </div>
      } @else if (gameOver()) {
        <div class="mw-2048__overlay">
          <p>{{ i18n.t('apps.games.gameOver') }}</p>
          <button type="button" (click)="reset()">{{ i18n.t('apps.games.newGame') }}</button>
        </div>
      }

      <p class="mw-2048__hint">{{ i18n.t('apps.games.twentyFortyEight.instructions') }}</p>
      <button type="button" class="mw-2048__reset" (click)="reset()">{{ i18n.t('apps.games.newGame') }}</button>
    </div>
  `,
  styleUrl: './game-2048.component.scss',
})
export class Game2048Component {
  readonly i18n = inject(I18nService);
  readonly store = inject(GamesStoreService);

  readonly board = signal<Board>(this.freshBoard());
  readonly score = signal(0);
  readonly continued = signal(false);

  readonly won = computed(() => this.board().some((row) => row.some((v) => v >= 2048)));
  readonly gameOver = computed(() => !this.canMove(this.board()));

  private freshBoard(): Board {
    const b = emptyBoard();
    addRandomTile(b);
    addRandomTile(b);
    return b;
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      a: 'left',
      d: 'right',
      w: 'up',
      s: 'down',
    };
    const dir = map[event.key];
    if (!dir) return;
    event.preventDefault();
    this.move(dir);
  }

  move(direction: 'left' | 'right' | 'up' | 'down'): void {
    if (this.gameOver()) return;
    let board = cloneBoard(this.board());
    let rotations = 0;
    if (direction === 'up') rotations = 3;
    if (direction === 'right') rotations = 2;
    if (direction === 'down') rotations = 1;

    for (let i = 0; i < rotations; i++) board = rotateClockwise(board);

    let gained = 0;
    const merged = board.map((row) => {
      const result = mergeRowLeft(row);
      gained += result.gained;
      return result.row;
    });

    let result = merged;
    for (let i = 0; i < (4 - rotations) % 4; i++) result = rotateClockwise(result);

    if (!boardsEqual(this.board(), result)) {
      addRandomTile(result);
      this.board.set(result);
      this.score.update((s) => s + gained);
      if (this.score() > this.store.best('2048')) this.store.submit('2048', this.score());
    }
  }

  private canMove(board: Board): boolean {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) return true;
        if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
        if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
      }
    }
    return false;
  }

  reset(): void {
    this.board.set(this.freshBoard());
    this.score.set(0);
    this.continued.set(false);
  }
}
