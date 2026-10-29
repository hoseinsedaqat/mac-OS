import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from '../../core/services/storage.service';

export type GameId = 'snake' | 'memory' | '2048' | 'tic-tac-toe' | 'breakout';

const STORAGE_KEY = 'games-best-scores';

/** Persists each game's best score locally so progress survives a reload. */
@Injectable({ providedIn: 'root' })
export class GamesStoreService {
  private readonly storage = inject(StorageService);
  private readonly scores = signal<Record<GameId, number>>(this.load());

  private load(): Record<GameId, number> {
    return this.storage.getItem<Record<GameId, number>>(STORAGE_KEY, {
      snake: 0,
      memory: 0,
      '2048': 0,
      'tic-tac-toe': 0,
      breakout: 0,
    });
  }

  best(game: GameId): number {
    return this.scores()[game] ?? 0;
  }

  submit(game: GameId, score: number): void {
    const current = this.scores()[game] ?? 0;
    if (score > current) {
      this.scores.update((s) => {
        const next = { ...s, [game]: score };
        this.storage.setItem(STORAGE_KEY, next);
        return next;
      });
    }
  }
}
