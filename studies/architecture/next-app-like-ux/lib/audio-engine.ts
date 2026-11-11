/**
 * A tiny step sequencer on the Web Audio API. Each track's `seed` generates a
 * chord progression, bassline, melody and drum pattern, so the app plays real
 * sound without shipping or licensing a single audio file.
 *
 * This file is browser-only. It is imported by the PlayerProvider (a Client
 * Component) and never runs on the server.
 */

export type EngineTrack = {
  id: string;
  seed: number;
  bpm: number;
  genre: string;
  durationSec: number;
};

type Style = {
  scale: number[];
  lead: OscillatorType;
  bass: OscillatorType;
  kick: number[];
  hat: number[];
  leadDensity: number;
  noteLength: number;
};

const STEPS_PER_BAR = 16;
const LOOKAHEAD_SEC = 0.12;
const TICK_MS = 25;

const STYLES: Record<string, Style> = {
  Ambient: { scale: [0, 2, 4, 7, 9], lead: "sine", bass: "sine", kick: [], hat: [], leadDensity: 0.22, noteLength: 6 },
  House: { scale: [0, 2, 3, 5, 7, 9, 10], lead: "triangle", bass: "sawtooth", kick: [0, 4, 8, 12], hat: [2, 6, 10, 14], leadDensity: 0.4, noteLength: 1.2 },
  "Lo-fi": { scale: [0, 3, 5, 7, 10], lead: "triangle", bass: "sine", kick: [0, 7, 10], hat: [4, 12], leadDensity: 0.32, noteLength: 2 },
  Synthwave: { scale: [0, 2, 3, 5, 7, 8, 10], lead: "sawtooth", bass: "square", kick: [0, 4, 8, 12], hat: [2, 6, 10, 14, 15], leadDensity: 0.45, noteLength: 1.5 },
  "Jazz-hop": { scale: [0, 2, 3, 5, 7, 9, 10], lead: "sine", bass: "triangle", kick: [0, 6, 10], hat: [2, 4, 8, 12, 14], leadDensity: 0.36, noteLength: 1.6 },
  Techno: { scale: [0, 1, 3, 5, 7, 8, 10], lead: "square", bass: "sawtooth", kick: [0, 4, 8, 12], hat: [2, 3, 6, 10, 11, 14], leadDensity: 0.3, noteLength: 0.8 },
};

const PROGRESSIONS = [
  [0, 5, 3, 4],
  [0, 3, 5, 4],
  [0, 4, 5, 3],
  [0, 2, 3, 4],
];

// Small seeded random generator: same seed, same song, every time.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

type Song = {
  style: Style;
  stepSec: number;
  totalSteps: number;
  root: number;
  progression: number[];
  lead: Array<number | null>; // scale degree per step, across 4 bars
  bass: boolean[]; // one bar
};

function compose(track: EngineTrack): Song {
  const random = mulberry32(track.seed);
  const style = STYLES[track.genre] ?? STYLES["Lo-fi"];
  const stepSec = 60 / track.bpm / 4;
  const length = STEPS_PER_BAR * 4;

  const lead: Array<number | null> = [];
  let degree = Math.floor(random() * style.scale.length);
  for (let i = 0; i < length; i++) {
    if (random() < style.leadDensity) {
      // Walk to a nearby scale degree so the melody sounds sung, not random.
      degree = Math.max(0, Math.min(style.scale.length * 2 - 1, degree + Math.floor(random() * 5) - 2));
      lead.push(degree);
    } else {
      lead.push(null);
    }
  }

  const bass = Array.from({ length: STEPS_PER_BAR }, (_, i) => i === 0 || random() < 0.28);

  return {
    style,
    stepSec,
    totalSteps: Math.floor(track.durationSec / stepSec),
    root: 45 + Math.floor(random() * 8),
    progression: PROGRESSIONS[Math.floor(random() * PROGRESSIONS.length)],
    lead,
    bass,
  };
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  // Everything scheduled for the current song goes through `bus`. Swapping
  // tracks or seeking disconnects it, which silences notes already queued.
  private bus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  private track: EngineTrack | null = null;
  private song: Song | null = null;
  private step = 0;
  private nextStepTime = 0;
  private offsetSec = 0;
  private resumedAt = 0;
  private playing = false;
  private volume = 0.8;

  onEnded: (() => void) | null = null;

  get isSupported(): boolean {
    return typeof window !== "undefined" && "AudioContext" in window;
  }

  /** Seconds into the current track. */
  get position(): number {
    if (!this.ctx || !this.track) return 0;
    const elapsed = this.playing ? this.ctx.currentTime - this.resumedAt : 0;
    return Math.min(this.track.durationSec, this.offsetSec + elapsed);
  }

  // Browsers only allow audio to start from a user gesture, so the context is
  // created lazily on the first play() rather than when the page loads.
  private ensureContext(): AudioContext {
    if (this.ctx && this.master) return this.ctx;
    if (!this.isSupported) throw new Error("This browser does not support the Web Audio API.");

    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = this.volume;
    master.connect(ctx.destination);

    const noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    this.ctx = ctx;
    this.master = master;
    this.noise = noise;
    return ctx;
  }

  private resetBus() {
    if (!this.ctx || !this.master) return;
    this.bus?.disconnect();
    this.bus = this.ctx.createGain();
    this.bus.connect(this.master);
  }

  load(track: EngineTrack, startAtSec = 0) {
    this.track = track;
    this.song = compose(track);
    this.offsetSec = Math.max(0, Math.min(startAtSec, track.durationSec));
    this.step = Math.floor(this.offsetSec / this.song.stepSec);
    if (this.ctx) {
      this.resetBus();
      this.resumedAt = this.ctx.currentTime;
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }
  }

  async play() {
    if (!this.track || !this.song) return;
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    if (!this.bus) this.resetBus();

    this.resumedAt = ctx.currentTime;
    this.nextStepTime = ctx.currentTime + 0.05;
    this.playing = true;
    this.timer ??= setInterval(() => this.tick(), TICK_MS);
  }

  pause() {
    if (!this.playing) return;
    this.offsetSec = this.position;
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    // Drop notes that were already scheduled a few milliseconds ahead.
    this.resetBus();
    if (this.song) this.step = Math.floor(this.offsetSec / this.song.stepSec);
  }

  seek(seconds: number) {
    if (!this.track) return;
    const wasPlaying = this.playing;
    this.pause();
    this.load(this.track, seconds);
    if (wasPlaying) void this.play();
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  dispose() {
    this.pause();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.bus = null;
  }

  private tick() {
    if (!this.ctx || !this.song || !this.track || !this.playing) return;

    if (this.position >= this.track.durationSec) {
      this.pause();
      this.offsetSec = this.track.durationSec;
      this.onEnded?.();
      return;
    }

    while (this.nextStepTime < this.ctx.currentTime + LOOKAHEAD_SEC) {
      if (this.step < this.song.totalSteps) this.scheduleStep(this.step, this.nextStepTime);
      this.step += 1;
      this.nextStepTime += this.song.stepSec;
    }
  }

  private scheduleStep(step: number, time: number) {
    const song = this.song;
    if (!song) return;
    const { style } = song;
    const inBar = step % STEPS_PER_BAR;
    const bar = Math.floor(step / STEPS_PER_BAR) % 4;
    const chord = song.progression[bar];

    if (style.kick.includes(inBar)) this.kick(time);
    if (style.hat.includes(inBar)) this.hat(time);

    if (song.bass[inBar]) {
      this.tone(style.bass, this.degreeToMidi(chord, -12), time, song.stepSec * 2.5, 0.16, 520);
    }

    const leadDegree = song.lead[step % song.lead.length];
    if (leadDegree !== null) {
      this.tone(style.lead, this.degreeToMidi(chord + leadDegree, 12), time, song.stepSec * style.noteLength, 0.09, 2400);
    }

    // A soft pad on the first beat of each bar holds the harmony together.
    if (inBar === 0) {
      for (const interval of [0, 2, 4]) {
        this.tone("sine", this.degreeToMidi(chord + interval, 0), time, song.stepSec * STEPS_PER_BAR, 0.035, 1400);
      }
    }
  }

  private degreeToMidi(degree: number, transpose: number): number {
    const { scale } = this.song!.style;
    const octave = Math.floor(degree / scale.length);
    const index = ((degree % scale.length) + scale.length) % scale.length;
    return this.song!.root + scale[index] + octave * 12 + transpose;
  }

  private tone(type: OscillatorType, midi: number, time: number, length: number, level: number, cutoff: number) {
    if (!this.ctx || !this.bus) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = midiToHz(midi);
    filter.type = "lowpass";
    filter.frequency.value = cutoff;

    // Short attack and exponential release: avoids the click a hard cut makes.
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);

    osc.connect(filter).connect(gain).connect(this.bus);
    osc.start(time);
    osc.stop(time + length + 0.05);
  }

  private kick(time: number) {
    if (!this.ctx || !this.bus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    osc.connect(gain).connect(this.bus);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  private hat(time: number) {
    if (!this.ctx || !this.bus || !this.noise) return;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = this.noise;
    filter.type = "highpass";
    filter.frequency.value = 7000;
    gain.gain.setValueAtTime(0.07, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    source.connect(filter).connect(gain).connect(this.bus);
    source.start(time);
    source.stop(time + 0.06);
  }
}
