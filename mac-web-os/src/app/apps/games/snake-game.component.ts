import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { GamesStoreService } from './games-store.service';

interface Point {
  x: number;
  y: number;
}

const GRID = 20;
const CELL = 16;
const TICK_MS = 120;

/** Real Snake implementation rendered on a <canvas>: grow, speed never changes, wall/self collision ends the run. */
@Component({
  selector: 'mw-game-snake',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mw-snake" tabindex="0">
      <div class="mw-snake__stats">
        <span>{{ i18n.t('apps.games.score') }}: {{ score() }}</span>
        <span>{{ i18n.t('apps.games.best') }}: {{ store.best('snake') }}</span>
      </div>

      <div class="mw-snake__stage">
        <canvas #canvas [width]="GRID * CELL" [height]="GRID * CELL"></canvas>

        @if (!started()) {
          <div class="mw-snake__overlay">
            <p>{{ i18n.t('apps.games.pressToStart') }}</p>
          </div>
        } @else if (gameOver()) {
          <div class="mw-snake__overlay">
            <p>{{ i18n.t('apps.games.gameOver') }}</p>
            <button type="button" (click)="reset()">{{ i18n.t('apps.games.newGame') }}</button>
          </div>
        }
      </div>

      <p class="mw-snake__hint">{{ i18n.t('apps.games.snake.instructions') }}</p>
    </div>
  `,
  styleUrl: './snake-game.component.scss',
})
export class SnakeGameComponent implements OnInit, OnDestroy {
  readonly i18n = inject(I18nService);
  readonly store = inject(GamesStoreService);
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly GRID = GRID;
  readonly CELL = CELL;

  readonly score = signal(0);
  readonly started = signal(false);
  readonly gameOver = signal(false);

  private snake: Point[] = [{ x: 10, y: 10 }];
  private direction: Point = { x: 1, y: 0 };
  private pendingDirection: Point = { x: 1, y: 0 };
  private food: Point = { x: 14, y: 10 };
  private timer: ReturnType<typeof setInterval> | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  ngOnInit(): void {
    this.ctx = this.canvasRef().nativeElement.getContext('2d');
    this.draw();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const map: Record<string, Point> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      w: { x: 0, y: -1 },
      s: { x: 0, y: 1 },
      a: { x: -1, y: 0 },
      d: { x: 1, y: 0 },
    };
    const next = map[event.key];
    if (!next) return;
    event.preventDefault();

    if (!this.started()) {
      this.started.set(true);
      this.startLoop();
    }
    // Disallow reversing directly into the snake's own body.
    if (next.x === -this.direction.x && next.y === -this.direction.y) return;
    this.pendingDirection = next;
  }

  private startLoop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private tick(): void {
    if (this.gameOver()) return;
    this.direction = this.pendingDirection;
    const head = this.snake[0];
    const newHead: Point = { x: head.x + this.direction.x, y: head.y + this.direction.y };

    const hitWall = newHead.x < 0 || newHead.y < 0 || newHead.x >= GRID || newHead.y >= GRID;
    const hitSelf = this.snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y);

    if (hitWall || hitSelf) {
      this.endGame();
      return;
    }

    this.snake.unshift(newHead);

    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score.update((s) => s + 10);
      this.placeFood();
    } else {
      this.snake.pop();
    }

    this.draw();
  }

  private placeFood(): void {
    let candidate: Point;
    do {
      candidate = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (this.snake.some((seg) => seg.x === candidate.x && seg.y === candidate.y));
    this.food = candidate;
  }

  private endGame(): void {
    this.gameOver.set(true);
    if (this.timer) clearInterval(this.timer);
    this.store.submit('snake', this.score());
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);

    ctx.fillStyle = '#ff5c5c';
    ctx.fillRect(this.food.x * CELL + 1, this.food.y * CELL + 1, CELL - 2, CELL - 2);

    ctx.fillStyle = '#34c759';
    this.snake.forEach((seg, i) => {
      ctx.globalAlpha = i === 0 ? 1 : 0.85;
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.globalAlpha = 1;
  }

  reset(): void {
    this.snake = [{ x: 10, y: 10 }];
    this.direction = { x: 1, y: 0 };
    this.pendingDirection = { x: 1, y: 0 };
    this.score.set(0);
    this.gameOver.set(false);
    this.started.set(false);
    this.placeFood();
    this.draw();
  }
}
