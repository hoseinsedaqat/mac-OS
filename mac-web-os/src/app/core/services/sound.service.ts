import { Injectable } from '@angular/core';
import { SettingsService } from './settings.service';

/**
 * Tiny UI sound feedback generated on the fly with the Web Audio API.
 *
 * No audio files are bundled or fetched from a remote CDN; every sound is a
 * short synthesized tone. Sounds only ever play in direct response to a user
 * action (click, unlock, ...) – never automatically on boot – and are fully
 * disabled when the user turns off "Sound" in Settings.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  private ctx: AudioContext | null = null;

  constructor(private readonly settings: SettingsService) {}

  private getContext(): AudioContext | null {
    if (!this.settings.settings().soundEnabled) return null;
    if (!this.ctx) {
      const AudioCtor = window.AudioContext;
      if (!AudioCtor) return null;
      this.ctx = new AudioCtor();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(freq: number, durationMs: number, type: OscillatorType = 'sine', gainValue = 0.05): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const volume = this.settings.settings().volume / 100;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainValue * volume;
    osc.connect(gain).connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  }

  click(): void {
    this.tone(720, 60, 'sine', 0.03);
  }

  unlock(): void {
    this.tone(523, 90, 'sine', 0.05);
    setTimeout(() => this.tone(784, 140, 'sine', 0.05), 90);
  }

  lock(): void {
    this.tone(392, 160, 'sine', 0.05);
  }

  notify(): void {
    this.tone(880, 120, 'triangle', 0.04);
  }

  trash(): void {
    this.tone(220, 180, 'sawtooth', 0.03);
  }

  error(): void {
    this.tone(160, 220, 'square', 0.03);
  }
}
