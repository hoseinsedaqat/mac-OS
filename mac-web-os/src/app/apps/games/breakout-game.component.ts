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

const WIDTH = 320;
const HEIGHT = 360;
const PADDLE_WIDTH = 64;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_HEIGHT = 16;
const BRICK_GAP = 3;
const BRICK_COLORS = ['#ff5c5c', '#ff9f43', '#ffd93d', '#34c759', '#0a84ff'];

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  color: string;
}

/** Real Breakout: paddle (mouse or ←/→), bouncing ball, destructible brick grid. */
@Component({
  selector: 'mw-game-breakout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mw-breakout" tabindex="0">
      <div class="mw-breakout__stats">
        <span>{{ i18n.t('apps.games.score') }}: {{ score() }}</span>
        <span>{{ i18n.t('apps.games.best') }}: {{ store.best('breakout') }}</span>
      </div>

      <div class="mw-breakout__stage" (pointermove)="onPointerMove($event)">
        <canvas #canvas [width]="WIDTH" [height]="HEIGHT"></canvas>

        @if (!started()) {
          <div class="mw-breakout__overlay">
            <p>{{ i18n.t('apps.games.pressToStart') }}</p>
          </div>
        } @else if (gameOver()) {
          <div class="mw-breakout__overlay">
            <p>{{ won() ? i18n.t('apps.games.youWin') : i18n.t('apps.games.gameOver') }}</p>
            <button type="button" (click)="reset()">{{ i18n.t('apps.games.newGame') }}</button>
          </div>
        }
      </div>

      <p class="mw-breakout__hint">{{ i18n.t('apps.games.breakout.instructions') }}</p>
    </div>
  `,
  styleUrl: './breakout-game.component.scss',
})
export class BreakoutGameComponent implements OnInit, OnDestroy {
  readonly i18n = inject(I18nService);
  readonly store = inject(GamesStoreService);
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly WIDTH = WIDTH;
  readonly HEIGHT = HEIGHT;

  readonly score = signal(0);
  readonly started = signal(false);
  readonly gameOver = signal(false);
  readonly won = signal(false);

  private ctx: CanvasRenderingContext2D | null = null;
  private paddleX = (WIDTH - PADDLE_WIDTH) / 2;
  private ball = { x: WIDTH / 2, y: HEIGHT - 40, vx: 2.4, vy: -2.4 };
  private bricks: Brick[] = [];
  private raf: number | null = null;
  private leftHeld = false;
  private rightHeld = false;

  ngOnInit(): void {
    this.ctx = this.canvasRef().nativeElement.getContext('2d');
    this.buildBricks();
    this.draw();
  }

  ngOnDestroy(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  private buildBricks(): void {
    this.bricks = [];
    const brickWidth = (WIDTH - BRICK_GAP * (BRICK_COLS + 1)) / BRICK_COLS;
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        this.bricks.push({
          x: BRICK_GAP + col * (brickWidth + BRICK_GAP),
          y: 30 + BRICK_GAP + row * (BRICK_HEIGHT + BRICK_GAP),
          w: brickWidth,
          h: BRICK_HEIGHT,
          alive: true,
          color: BRICK_COLORS[row % BRICK_COLORS.length],
        });
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') this.leftHeld = true;
    if (event.key === 'ArrowRight') this.rightHeld = true;
    if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && !this.started()) {
      this.start();
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') this.leftHeld = false;
    if (event.key === 'ArrowRight') this.rightHeld = false;
  }

  onPointerMove(event: PointerEvent): void {
    const stage = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - stage.left;
    this.paddleX = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
    if (!this.started()) this.start();
  }

  private start(): void {
    if (this.started()) return;
    this.started.set(true);
    this.loop();
  }

  private loop = (): void => {
    if (this.gameOver()) return;
    if (this.leftHeld) this.paddleX = Math.max(0, this.paddleX - 5);
    if (this.rightHeld) this.paddleX = Math.min(WIDTH - PADDLE_WIDTH, this.paddleX + 5);

    this.stepBall();
    this.draw();

    if (!this.gameOver()) {
      this.raf = requestAnimationFrame(this.loop);
    }
  };

  private stepBall(): void {
    const b = this.ball;
    b.x += b.vx;
    b.y += b.vy;

    if (b.x <= BALL_RADIUS || b.x >= WIDTH - BALL_RADIUS) b.vx *= -1;
    if (b.y <= BALL_RADIUS) b.vy *= -1;

    const paddleY = HEIGHT - 18;
    if (
      b.y + BALL_RADIUS >= paddleY &&
      b.y + BALL_RADIUS <= paddleY + PADDLE_HEIGHT &&
      b.x >= this.paddleX &&
      b.x <= this.paddleX + PADDLE_WIDTH &&
      b.vy > 0
    ) {
      const hitPos = (b.x - (this.paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
      b.vx = hitPos * 3.2;
      b.vy = -Math.abs(b.vy);
    }

    if (b.y > HEIGHT + BALL_RADIUS) {
      this.endGame(false);
      return;
    }

    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (b.x + BALL_RADIUS > brick.x && b.x - BALL_RADIUS < brick.x + brick.w && b.y + BALL_RADIUS > brick.y && b.y - BALL_RADIUS < brick.y + brick.h) {
        brick.alive = false;
        b.vy *= -1;
        this.score.update((s) => s + 10);
        if (this.score() > this.store.best('breakout')) this.store.submit('breakout', this.score());
        break;
      }
    }

    if (this.bricks.every((brk) => !brk.alive)) {
      this.endGame(true);
    }
  }

  private endGame(won: boolean): void {
    this.gameOver.set(true);
    this.won.set(won);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.store.submit('breakout', this.score());
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'rgba(127,127,127,0.08)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    }

    ctx.fillStyle = '#0a84ff';
    ctx.fillRect(this.paddleX, HEIGHT - 18, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(this.ball.x, this.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  reset(): void {
    this.buildBricks();
    this.ball = { x: WIDTH / 2, y: HEIGHT - 40, vx: 2.4, vy: -2.4 };
    this.paddleX = (WIDTH - PADDLE_WIDTH) / 2;
    this.score.set(0);
    this.started.set(false);
    this.gameOver.set(false);
    this.won.set(false);
    this.draw();
  }
}
