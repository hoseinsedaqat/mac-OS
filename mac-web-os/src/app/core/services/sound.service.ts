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

  /** Played when a window/app opens. A quick upward two-note chirp. */
  open(): void {
    this.tone(480, 55, 'sine', 0.03);
    setTimeout(() => this.tone(660, 70, 'sine', 0.035), 45);
  }

  /** Played when a window closes or an app quits. A quick downward chirp. */
  close(): void {
    this.tone(560, 55, 'sine', 0.03);
    setTimeout(() => this.tone(380, 80, 'sine', 0.03), 40);
  }

  /** Played when a window is minimized to the Dock. */
  minimize(): void {
    this.tone(520, 50, 'sine', 0.025);
    setTimeout(() => this.tone(300, 90, 'sine', 0.025), 35);
  }

  /** Played when a window is restored from the Dock or un-maximized/maximized. */
  restore(): void {
    this.tone(420, 45, 'sine', 0.025);
    setTimeout(() => this.tone(600, 60, 'sine', 0.03), 30);
  }

  /** Startup chime, played once when the desktop finishes booting. */
  startup(): void {
    this.tone(392, 160, 'sine', 0.05);
    setTimeout(() => this.tone(523, 160, 'sine', 0.05), 130);
    setTimeout(() => this.tone(659, 260, 'sine', 0.055), 260);
  }

  /** Played when the user triggers Restart or Shut Down. */
  shutdown(): void {
    this.tone(659, 140, 'sine', 0.05);
    setTimeout(() => this.tone(523, 140, 'sine', 0.05), 120);
    setTimeout(() => this.tone(392, 240, 'sine', 0.045), 240);
  }
}
