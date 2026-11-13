export type SfxName =
  | "click"
  | "hover"
  | "toggle"
  | "send"
  | "success"
  | "error"
  | "pop"
  | "open"
  | "close";

type ToneOptions = {
  frequency: number;
  endFrequency?: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  attack?: number;
};

const MASTER_LEVEL = 0.34;
const AMBIENT_LEVEL = 0.018;

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let enabled = true;

let ambientNodes: {
  gain: GainNode;
  oscillators: OscillatorNode[];
  lfo: OscillatorNode;
  lfoGain: GainNode;
} | null = null;
let ambientEnabled = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  if (!audioContext) {
    try {
      audioContext = new AudioContextConstructor();
      masterGain = audioContext.createGain();
      masterGain.gain.value = enabled ? MASTER_LEVEL : 0.0001;
      masterGain.connect(audioContext.destination);
    } catch {
      audioContext = null;
      masterGain = null;
      return null;
    }
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume().catch(() => undefined);
  }

  return audioContext;
}

function tone(context: AudioContext, options: ToneOptions): void {
  if (!masterGain) {
    return;
  }

  const {
    frequency,
    endFrequency,
    duration,
    type = "sine",
    gain = 0.06,
    delay = 0,
    attack = 0.008,
  } = options;

  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const startAt = context.currentTime + delay;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(20, frequency), startAt);

  if (endFrequency && endFrequency > 0) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      startAt + duration,
    );
  }

  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(
    Math.max(0.0002, gain),
    startAt + Math.min(attack, duration * 0.5),
  );
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(envelope);
  envelope.connect(masterGain);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

export function setSfxEnabled(value: boolean): void {
  enabled = value;

  if (masterGain && audioContext) {
    const now = audioContext.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(
      value ? MASTER_LEVEL : 0.0001,
      now,
      0.04,
    );
  }
}

export function isSfxEnabled(): boolean {
  return enabled;
}

export function primeSfx(): void {
  if (enabled) {
    getAudioContext();
  }
}

function stopAmbientNodes(): void {
  if (!ambientNodes || !audioContext) {
    return;
  }

  const { gain, oscillators, lfo } = ambientNodes;
  const stopAt = audioContext.currentTime + 0.6;

  gain.gain.cancelScheduledValues(audioContext.currentTime);
  gain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.12);

  for (const oscillator of oscillators) {
    try {
      oscillator.stop(stopAt);
    } catch {
      // The oscillator may already be stopped.
    }
  }

  try {
    lfo.stop(stopAt);
  } catch {
    // The LFO may already be stopped.
  }

  ambientNodes = null;
}

export function setAmbientEnabled(value: boolean): void {
  ambientEnabled = value;

  if (!value) {
    stopAmbientNodes();
    return;
  }

  const context = getAudioContext();
  if (!context || !masterGain || ambientNodes) {
    return;
  }

  const ambientGain = context.createGain();
  ambientGain.gain.value = 0.0001;

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 340;
  filter.Q.value = 0.6;

  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  lfo.type = "sine";
  lfo.frequency.value = 0.055;
  lfoGain.gain.value = 90;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const frequencies = [55, 82.5, 110.3];
  const gains = [0.42, 0.28, 0.14];
  const oscillators = frequencies.map((frequency, index) => {
    const oscillator = context.createOscillator();
    const voiceGain = context.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    oscillator.detune.value = index * 4 - 4;
    voiceGain.gain.value = gains[index];
    oscillator.connect(voiceGain);
    voiceGain.connect(filter);
    oscillator.start();
    return oscillator;
  });

  filter.connect(ambientGain);
  ambientGain.connect(masterGain);
  lfo.start();

  ambientGain.gain.setTargetAtTime(
    AMBIENT_LEVEL,
    context.currentTime,
    0.9,
  );

  ambientNodes = { gain: ambientGain, oscillators, lfo, lfoGain };
}

export function isAmbientEnabled(): boolean {
  return ambientEnabled;
}

export function playSfx(name: SfxName): void {
  if (!enabled) {
    return;
  }

  const context = getAudioContext();
  if (!context) {
    return;
  }

  try {
    switch (name) {
      case "click":
        tone(context, {
          frequency: 780,
          endFrequency: 560,
          duration: 0.045,
          type: "triangle",
          gain: 0.045,
        });
        break;
      case "hover":
        tone(context, {
          frequency: 1_180,
          endFrequency: 1_320,
          duration: 0.028,
          type: "sine",
          gain: 0.012,
          attack: 0.004,
        });
        break;
      case "toggle":
        tone(context, {
          frequency: 620,
          endFrequency: 900,
          duration: 0.08,
          type: "sine",
          gain: 0.05,
        });
        break;
      case "send":
        tone(context, {
          frequency: 480,
          endFrequency: 640,
          duration: 0.08,
          type: "triangle",
          gain: 0.05,
        });
        tone(context, {
          frequency: 720,
          endFrequency: 960,
          duration: 0.1,
          type: "sine",
          gain: 0.04,
          delay: 0.06,
        });
        break;
      case "success":
        tone(context, {
          frequency: 659.25,
          duration: 0.16,
          type: "sine",
          gain: 0.045,
        });
        tone(context, {
          frequency: 880,
          duration: 0.18,
          type: "sine",
          gain: 0.042,
          delay: 0.07,
        });
        tone(context, {
          frequency: 1_174.66,
          duration: 0.2,
          type: "sine",
          gain: 0.038,
          delay: 0.14,
        });
        break;
      case "error":
        tone(context, {
          frequency: 250,
          endFrequency: 150,
          duration: 0.22,
          type: "sawtooth",
          gain: 0.028,
        });
        tone(context, {
          frequency: 180,
          endFrequency: 120,
          duration: 0.2,
          type: "triangle",
          gain: 0.03,
          delay: 0.03,
        });
        break;
      case "pop":
        tone(context, {
          frequency: 380,
          endFrequency: 780,
          duration: 0.09,
          type: "sine",
          gain: 0.05,
        });
        break;
      case "open":
        tone(context, {
          frequency: 320,
          endFrequency: 560,
          duration: 0.11,
          type: "sine",
          gain: 0.045,
        });
        break;
      case "close":
        tone(context, {
          frequency: 540,
          endFrequency: 280,
          duration: 0.1,
          type: "sine",
          gain: 0.04,
        });
        break;
    }
  } catch {
    // Sound is an enhancement; never let audio break the interface.
  }
}
