// A simple sound service using the Web Audio API to avoid dealing with audio files.
class SoundService {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true; // Could be controlled by a UI setting in the future

  private initializeAudioContext() {
    if (this.audioCtx || typeof window === 'undefined' || window.document.hidden) {
        return;
    }
    
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser.", e);
    }
  }

  private playSound(
    frequency: number,
    type: OscillatorType,
    duration: number,
    volume: number = 0.5
  ) {
    this.initializeAudioContext();
    if (!this.audioCtx || !this.isEnabled) return;

    // Resume context if it's suspended (e.g., due to browser auto-play policies)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    oscillator.start(this.audioCtx.currentTime);
    oscillator.stop(this.audioCtx.currentTime + duration);
  }
  
  private playFailSound() {
    this.initializeAudioContext();
    if (!this.audioCtx || !this.isEnabled) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    const duration = 0.6; // More prolonged
    const now = this.audioCtx.currentTime;

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + duration * 0.9);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }
  
  private playTriumphSound() {
    this.initializeAudioContext();
    if (!this.audioCtx || !this.isEnabled) return;
    const volume = 0.3;

    // --- Arpeggio ---
    const arpeggioNotes = [
        { freq: 523.25, time: 0, dur: 0.15 }, // C5
        { freq: 659.25, time: 0.1, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.2, dur: 0.15 }, // G5
        { freq: 1046.50, time: 0.3, dur: 0.5 } // C6
    ];
    arpeggioNotes.forEach(note => {
        setTimeout(() => this.playSound(note.freq, 'triangle', note.dur, volume), note.time * 1000);
    });

    // --- "Sparkle" / "Cheer" sound to simulate applause/compliments ---
    const playSparkle = (startTime: number) => {
        if (!this.audioCtx) return;
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(2000, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(4000, startTime + 0.4);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
    }
    
    setTimeout(() => {
        if (this.audioCtx) {
            const sparkleTime = this.audioCtx.currentTime;
            playSparkle(sparkleTime);
            playSparkle(sparkleTime + 0.15);
        }
    }, 400); // Start sparkles after arpeggio begins
  }

  public playClick() {
    this.playSound(2000, 'triangle', 0.05, 0.3);
  }
  
  public playHover() {
    this.playSound(2500, 'sine', 0.03, 0.1);
  }
  
  public playStartRecording() {
      this.playSound(600, 'sine', 0.1, 0.4);
  }

  public playStopRecording() {
      this.playSound(440, 'sine', 0.1, 0.4);
  }
  
  public playSuccess() {
    this.initializeAudioContext();
    if (!this.audioCtx || !this.isEnabled) return;
    
    // Ascending arpeggio - prolonged
    this.playSound(440, 'sine', 0.1, 0.3); // A4
    setTimeout(() => this.playSound(554, 'sine', 0.1, 0.3), 80);  // C#5
    setTimeout(() => this.playSound(659, 'sine', 0.3, 0.3), 160); // E5, prolonged
  }

  public playScoreSound(score: number) {
    this.initializeAudioContext();
    if (!this.audioCtx || !this.isEnabled) return;
    
    if (score < 40) { // Red - Needs improvement
        this.playFailSound();
    } else if (score < 70) { // Yellow - Okay
        this.playSound(330, 'sine', 0.1, 0.3);
        setTimeout(() => this.playSound(440, 'sine', 0.1, 0.3), 100);
    } else if (score < 80) { // Green - Good
        this.playSuccess();
    } else { // High Green - Excellent
        this.playTriumphSound();
    }
  }
}

export const soundService = new SoundService();