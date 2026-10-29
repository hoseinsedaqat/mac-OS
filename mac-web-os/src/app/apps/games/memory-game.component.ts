import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { GamesStoreService } from './games-store.service';

interface MemoryCard {
  id: number;
  symbol: string;
  matched: boolean;
}

const SYMBOLS = ['🍎', '🍌', '🍇', '🍋', '🍉', '🍓', '🍒', '🥝'];

function shuffledDeck(): MemoryCard[] {
  const pairs = [...SYMBOLS, ...SYMBOLS].map((symbol, i) => ({ id: i, symbol, matched: false }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

/** Classic concentration/memory-match game: flip two cards, find every pair. */
@Component({
  selector: 'mw-game-memory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mw-memory">
      <div class="mw-memory__stats">
        <span>{{ i18n.t('apps.games.memory.moves') }}: {{ moves() }}</span>
        @if (won()) {
          <span class="mw-memory__won">{{ i18n.t('apps.games.youWin') }}</span>
        }
      </div>

      <div class="mw-memory__grid">
        @for (card of deck(); track card.id) {
          <button
            type="button"
            class="mw-memory__card"
            [class.flipped]="isFlipped(card.id)"
            [class.matched]="card.matched"
            [disabled]="card.matched"
            (click)="flip(card.id)"
          >
            <span class="mw-memory__face mw-memory__face--front">?</span>
            <span class="mw-memory__face mw-memory__face--back">{{ card.symbol }}</span>
          </button>
        }
      </div>

      <button type="button" class="mw-memory__reset" (click)="reset()">
        {{ i18n.t('apps.games.newGame') }}
      </button>
    </div>
  `,
  styleUrl: './memory-game.component.scss',
})
export class MemoryGameComponent {
  readonly i18n = inject(I18nService);
  private readonly store = inject(GamesStoreService);

  readonly deck = signal<MemoryCard[]>(shuffledDeck());
  readonly flippedIds = signal<number[]>([]);
  readonly moves = signal(0);
  private busy = false;

  readonly won = computed(() => this.deck().every((c) => c.matched));

  isFlipped(id: number): boolean {
    return this.flippedIds().includes(id);
  }

  flip(id: number): void {
    if (this.busy) return;
    if (this.flippedIds().includes(id)) return;
    if (this.flippedIds().length >= 2) return;

    this.flippedIds.update((ids) => [...ids, id]);

    if (this.flippedIds().length === 2) {
      this.moves.update((m) => m + 1);
      this.busy = true;
      const [firstId, secondId] = this.flippedIds();
      const first = this.deck().find((c) => c.id === firstId)!;
      const second = this.deck().find((c) => c.id === secondId)!;

      if (first.symbol === second.symbol) {
        setTimeout(() => {
          this.deck.update((d) => d.map((c) => (c.id === firstId || c.id === secondId ? { ...c, matched: true } : c)));
          this.flippedIds.set([]);
          this.busy = false;
          if (this.won()) {
            const bestMoves = this.store.best('memory');
            const score = bestMoves === 0 ? 1000 - this.moves() : Math.max(bestMoves, 1000 - this.moves());
            this.store.submit('memory', Math.max(score, 1));
          }
        }, 450);
      } else {
        setTimeout(() => {
          this.flippedIds.set([]);
          this.busy = false;
        }, 700);
      }
    }
  }

  reset(): void {
    this.deck.set(shuffledDeck());
    this.flippedIds.set([]);
    this.moves.set(0);
    this.busy = false;
  }
}
