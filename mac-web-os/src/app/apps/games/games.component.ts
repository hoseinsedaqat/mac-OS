import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { GameId, GamesStoreService } from './games-store.service';
import { SnakeGameComponent } from './snake-game.component';
import { MemoryGameComponent } from './memory-game.component';
import { Game2048Component } from './game-2048.component';
import { TicTacToeGameComponent } from './tic-tac-toe-game.component';
import { BreakoutGameComponent } from './breakout-game.component';

interface GameCard {
  id: GameId;
  nameKey: string;
  instructionsKey: string;
  icon: string;
}

const GAME_CARDS: GameCard[] = [
  { id: 'snake', nameKey: 'apps.games.snake.name', instructionsKey: 'apps.games.snake.instructions', icon: 'joystick' },
  { id: 'memory', nameKey: 'apps.games.memory.name', instructionsKey: 'apps.games.memory.instructions', icon: 'grid3' },
  { id: '2048', nameKey: 'apps.games.twentyFortyEight.name', instructionsKey: 'apps.games.twentyFortyEight.instructions', icon: 'grid' },
  { id: 'tic-tac-toe', nameKey: 'apps.games.ticTacToe.name', instructionsKey: 'apps.games.ticTacToe.instructions', icon: 'grid3' },
  { id: 'breakout', nameKey: 'apps.games.breakout.name', instructionsKey: 'apps.games.breakout.instructions', icon: 'games' },
];

@Component({
  selector: 'mw-app-games',
  standalone: true,
  imports: [IconComponent, SnakeGameComponent, MemoryGameComponent, Game2048Component, TicTacToeGameComponent, BreakoutGameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './games.component.html',
  styleUrl: './games.component.scss',
})
export class GamesComponent {
  readonly windowId = input<string>('');

  readonly i18n = inject(I18nService);
  readonly store = inject(GamesStoreService);

  readonly cards = GAME_CARDS;
  readonly activeGame = signal<GameId | null>(null);
  readonly activeGameName = computed(() => {
    const id = this.activeGame();
    const card = this.cards.find((c) => c.id === id);
    return card ? this.i18n.t(card.nameKey) : '';
  });

  open(id: GameId): void {
    this.activeGame.set(id);
  }

  back(): void {
    this.activeGame.set(null);
  }

  best(id: GameId): number {
    return this.store.best(id);
  }
}
