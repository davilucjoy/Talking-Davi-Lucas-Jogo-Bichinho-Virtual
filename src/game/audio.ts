/**
 * Procedural Web Audio Engine & Pitch-Modulated Voice Repeater for Talking Davi Lucas.
 * 100% synthesized - Zero external audio files (No 404 dependencies).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public isMuted: boolean = false;

  // Voice recording & pitch playback
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  public isListening: boolean = false;
  public isRepeatingVoice: boolean = false;
  private audioAnalyser: AnalyserNode | null = null;
  private analyserDataArray: Uint8Array<ArrayBuffer> | null = null;

  constructor() {
    // Lazily initialized on first user gesture
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.audioAnalyser = this.ctx.createAnalyser();
      this.audioAnalyser.fftSize = 64;
      this.analyserDataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getSpeechAmplitude(): number {
    if (!this.audioAnalyser || !this.analyserDataArray) return 0;
    this.audioAnalyser.getByteFrequencyData(this.analyserDataArray);
    let sum = 0;
    for (let i = 0; i < this.analyserDataArray.length; i++) {
      sum += this.analyserDataArray[i];
    }
    return sum / (this.analyserDataArray.length * 255);
  }

  // --- Procedural Sound Effects ---

  // Slap / Punch Impact
  public playSlap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Fast noise burst
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // Punchy low sine thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    oscGain.gain.setValueAtTime(0.9, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Poke / Tickle Giggle
  public playGiggle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.06;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, startTime + 0.05);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.09);
    });
  }

  // Eating / Chomp
  public playChomp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    [0, 0.11, 0.22].forEach((offset) => {
      const t = now + offset;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.08);
    });
  }

  // Spicy Fire Whoosh
  public playFireBreath() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const duration = 1.2;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.5;
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.4);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  // Boba Slurp
  public playSlurp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Bubbling oscillation
    for (let i = 0; i < 6; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.07;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + Math.random() * 300, t);
      osc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 400, t + 0.06);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.06);
    }
  }

  // Funny Fart Sound
  public playFart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(65, now + 0.15);
    osc.frequency.linearRampToValueAtTime(45, now + 0.35);

    // Subtle distortion filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.35);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Burp Sound
  public playBurp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.4);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Rock Guitar Shred Solo
  public playGuitarSolo() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const notes = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + idx * 0.1;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      // Distorted high buzz
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  // Disco Beat
  public playDiscoBeat(onStep?: (step: number) => void) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const tempo = 0.18;
    for (let beat = 0; beat < 8; beat++) {
      const t = now + beat * tempo;
      // Kick drum on every beat
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kick.frequency.setValueAtTime(150, t);
      kick.frequency.exponentialRampToValueAtTime(35, t + 0.09);
      kickGain.gain.setValueAtTime(0.8, t);
      kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
      kick.connect(kickGain);
      kickGain.connect(this.masterGain);
      kick.start(t);
      kick.stop(t + 0.09);

      // Hihat on offbeat
      if (beat % 2 === 1) {
        const hhOsc = this.ctx.createOscillator();
        const hhGain = this.ctx.createGain();
        hhOsc.type = 'sawtooth';
        hhOsc.frequency.setValueAtTime(8000, t);
        hhGain.gain.setValueAtTime(0.25, t);
        hhGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        hhOsc.connect(hhGain);
        hhGain.connect(this.masterGain);
        hhOsc.start(t);
        hhOsc.stop(t + 0.05);
      }

      if (onStep) {
        setTimeout(() => onStep(beat), beat * tempo * 1000);
      }
    }
  }

  // Snoring sound
  public playSnore() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.5);
    osc.frequency.linearRampToValueAtTime(70, now + 0.9);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.9);
  }

  // Coin Collect
  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Jump Bounce
  public playBounce() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Game Over
  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const notes = [440, 415.3, 392, 349.23];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + i * 0.16;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // --- Voice Repeater (Record from Mic + Pitch-Shift Cartoon Playback) ---

  public async startMicrophoneRecording(
    onStatusChange: (isRecording: boolean) => void,
    onSpeechPlaybackStart: (duration: number) => void,
    onSpeechPlaybackEnd: () => void
  ): Promise<boolean> {
    this.initCtx();
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn('Microphone not supported on this browser.');
      return false;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.recordedChunks = [];
      this.isListening = true;
      onStatusChange(true);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.isListening = false;
        onStatusChange(false);
        if (this.recordedChunks.length > 0) {
          const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm;codecs=opus' });
          await this.playbackCartoonVoice(audioBlob, onSpeechPlaybackStart, onSpeechPlaybackEnd);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      this.isListening = false;
      onStatusChange(false);
      return false;
    }
  }

  public stopMicrophoneRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.isListening = false;
  }

  private async playbackCartoonVoice(
    audioBlob: Blob,
    onPlaybackStart: (duration: number) => void,
    onPlaybackEnd: () => void
  ) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Chipmunk / Cartoon pitch modulation (playbackRate 1.45x)
      source.playbackRate.value = 1.48;

      // Connect to analyser for real-time mouth movement
      if (this.audioAnalyser) {
        source.connect(this.audioAnalyser);
        this.audioAnalyser.connect(this.masterGain);
      } else {
        source.connect(this.masterGain);
      }

      const effectiveDuration = audioBuffer.duration / 1.48;
      this.isRepeatingVoice = true;
      onPlaybackStart(effectiveDuration);

      source.onended = () => {
        this.isRepeatingVoice = false;
        onPlaybackEnd();
      };

      source.start();
    } catch (err) {
      console.error('Failed to decode or play cartoon audio:', err);
      this.isRepeatingVoice = false;
      onPlaybackEnd();
    }
  }

  // Pre-baked or text-to-speech phrase playback with cartoon pitch & visemes
  public speakPhrase(
    text: string,
    onStart: (duration: number) => void,
    onEnd: () => void
  ) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.75; // high chipmunk pitch
      utterance.rate = 1.25;  // fast cartoon tempo

      const approxDuration = Math.max(1.0, text.length * 0.08);

      utterance.onstart = () => {
        this.isRepeatingVoice = true;
        onStart(approxDuration);
      };
      utterance.onend = () => {
        this.isRepeatingVoice = false;
        onEnd();
      };
      utterance.onerror = () => {
        this.isRepeatingVoice = false;
        onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback procedural chirp talking
      this.playGiggle();
      onStart(1.5);
      setTimeout(onEnd, 1500);
    }
  }
}

export const soundEngine = new SoundEngine();
