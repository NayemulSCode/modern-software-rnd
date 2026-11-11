import { toast } from "sonner";
import { AudioEngine } from "@/lib/audio-engine";
import type { Track } from "@/features/track/types";

export type PlayerSnapshot = {
  current: Track | null;
  queue: Track[];
  isPlaying: boolean;
  position: number;
  volume: number;
};

export const initialSnapshot: PlayerSnapshot = {
  current: null,
  queue: [],
  isPlaying: false,
  position: 0,
  volume: 0.8,
};

const PROGRESS_INTERVAL_MS = 250;

/**
 * Playback state lives in a plain object outside React. Components subscribe
 * to just the slice they need (see `usePlayer`), so the progress bar ticking
 * four times a second does not re-render every play button on the page.
 */
export class PlayerStore {
  private snapshot = initialSnapshot;
  private listeners = new Set<() => void>();
  private engine: AudioEngine | null = null;
  private progressTimer: ReturnType<typeof setInterval> | null = null;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  private set(patch: Partial<PlayerSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }

  private getEngine(): AudioEngine {
    if (!this.engine) {
      this.engine = new AudioEngine();
      this.engine.setVolume(this.snapshot.volume);
      this.engine.onEnded = () => this.next({ stopAtEnd: true });
    }
    return this.engine;
  }

  private startProgress() {
    this.progressTimer ??= setInterval(() => {
      this.set({ position: this.engine?.position ?? 0 });
    }, PROGRESS_INTERVAL_MS);
  }

  private stopProgress() {
    if (this.progressTimer) clearInterval(this.progressTimer);
    this.progressTimer = null;
  }

  private async start(track: Track, queue: Track[]) {
    try {
      const engine = this.getEngine();
      engine.load(track);
      this.set({ current: track, queue, position: 0, isPlaying: true });
      await engine.play();
      this.startProgress();
    } catch (error) {
      console.error("Playback failed", error);
      this.stopProgress();
      this.set({ isPlaying: false });
      toast.error("Playback is not available in this browser.");
    }
  }

  /** Play a track. `queue` is the list it was started from, for next/previous. */
  play = (track: Track, queue: Track[] = [track]) => {
    if (this.snapshot.current?.id === track.id) {
      this.toggle();
      return;
    }
    void this.start(track, queue);
  };

  toggle = () => {
    const { current, isPlaying } = this.snapshot;
    if (!current) return;

    if (isPlaying) {
      this.engine?.pause();
      this.stopProgress();
      this.set({ isPlaying: false, position: this.engine?.position ?? 0 });
      return;
    }

    this.set({ isPlaying: true });
    this.getEngine()
      .play()
      .then(() => this.startProgress())
      .catch((error: unknown) => {
        console.error("Playback failed", error);
        this.set({ isPlaying: false });
        toast.error("Playback could not be resumed.");
      });
  };

  next = ({ stopAtEnd = false }: { stopAtEnd?: boolean } = {}) => {
    const { current, queue } = this.snapshot;
    if (!current || queue.length === 0) return;
    const index = queue.findIndex((track) => track.id === current.id);
    const isLast = index === queue.length - 1;

    if (isLast && stopAtEnd) {
      this.stopProgress();
      this.set({ isPlaying: false, position: current.durationSec });
      return;
    }
    void this.start(queue[(index + 1) % queue.length], queue);
  };

  previous = () => {
    const { current, queue, position } = this.snapshot;
    if (!current) return;
    // Like most players: a few seconds in, "previous" restarts the track.
    if (position > 3) {
      this.seek(0);
      return;
    }
    const index = queue.findIndex((track) => track.id === current.id);
    void this.start(queue[(index - 1 + queue.length) % queue.length] ?? current, queue);
  };

  seek = (seconds: number) => {
    if (!this.snapshot.current) return;
    this.engine?.seek(seconds);
    this.set({ position: seconds });
  };

  setVolume = (volume: number) => {
    this.engine?.setVolume(volume);
    this.set({ volume });
  };

  dispose = () => {
    this.stopProgress();
    this.engine?.dispose();
    this.engine = null;
    this.snapshot = initialSnapshot;
  };
}
