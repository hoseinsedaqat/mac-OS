import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { SettingsService } from '../../core/services/settings.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
}

const TRACKS: Track[] = [
  { id: 't1', title: 'Morning in Cupertino', artist: 'MacWeb Sound Collective', duration: 182 },
  { id: 't2', title: 'Signal & Silence', artist: 'Glass Interface', duration: 214 },
  { id: 't3', title: 'Dock Bounce', artist: 'Pixel Harmony', duration: 156 },
  { id: 't4', title: 'Spotlight (Instrumental)', artist: 'Glass Interface', duration: 198 },
  { id: 't5', title: 'Retina Dreams', artist: 'MacWeb Sound Collective', duration: 241 },
];

/**
 * Demo-mode music player: no licensed audio files are bundled, so playback
 * is a clearly-labelled simulation (progress advances on a timer) rather
 * than a fake claim of real audio output.
 */
@Component({
  selector: 'mw-app-music',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './music.component.html',
  styleUrl: './music.component.scss',
})
export class MusicComponent implements OnDestroy {
  readonly windowId = input<string>('');
  readonly settings = inject(SettingsService);
  readonly tracks = TRACKS;
  readonly currentIndex = signal(0);
  readonly isPlaying = signal(false);
  readonly elapsed = signal(0);

  readonly currentTrack = computed(() => this.tracks[this.currentIndex()]);
  readonly progressPercent = computed(() => (this.elapsed() / this.currentTrack().duration) * 100);

  private timer: ReturnType<typeof setInterval> | null = null;

  togglePlay(): void {
    this.isPlaying.set(!this.isPlaying());
    if (this.isPlaying()) this.startTimer();
    else this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.elapsed.update((v) => {
        if (v + 1 >= this.currentTrack().duration) {
          this.next();
          return 0;
        }
        return v + 1;
      });
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  next(): void {
    this.currentIndex.set((this.currentIndex() + 1) % this.tracks.length);
    this.elapsed.set(0);
  }

  prev(): void {
    this.currentIndex.set((this.currentIndex() - 1 + this.tracks.length) % this.tracks.length);
    this.elapsed.set(0);
  }

  selectTrack(index: number): void {
    this.currentIndex.set(index);
    this.elapsed.set(0);
    this.isPlaying.set(true);
    this.startTimer();
  }

  seek(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.elapsed.set(Math.round((value / 100) * this.currentTrack().duration));
  }

  setVolume(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.settings.update({ volume: value });
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
