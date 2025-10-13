// A simple sound service using the Web Audio API to avoid dealing with audio files.
const SOUND_ENABLED_KEY = 'ces_coach_sound_enabled';

class SoundService {
  private audioCtx: AudioContext | null = null;

  private initializeAudioContext() {
    // Only run on client side and if not already initialized
    if (this.audioCtx || typeof window === 'undefined') {
        return;
    }
    
    // Defer initialization until the first user interaction (e.g., a click)
    const init = () => {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }
        // Remove the event listener after it has run once
        document.removeEventListener('click', init);
        document.removeEventListener('touchstart', init);
    };

    document.addEventListener('click', init);
    document.addEventListener('touchstart', init);
  }

  constructor() {
      this.initializeAudioContext();
  }

  private isSoundEnabled(): boolean {
      if (typeof window === 'undefined') return false;
      const storedSetting = localStorage.getItem(SOUND_ENABLED_KEY);
      return storedSetting ? JSON.parse(storedSetting) : true; // Default to enabled
  }

  private playSound(
    frequency: number,
    type: OscillatorType,
    duration: number,
    volume: number = 0.5
  ) {
    if (!this.isSoundEnabled() || !this.audioCtx) return;

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
    if (!this.isSoundEnabled() || !this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    const duration = 0.6;
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
    if (!this.isSoundEnabled() || !this.audioCtx) return;
    const volume = 0.3;

    const arpeggioNotes = [
        { freq: 523.25, time: 0, dur: 0.15 }, // C5
        { freq: 659.25, time: 0.1, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.2, dur: 0.15 }, // G5
        { freq: 1046.50, time: 0.3, dur: 0.5 } // C6
    ];
    arpeggioNotes.forEach(note => {
        setTimeout(() => this.playSound(note.freq, 'triangle', note.dur, volume), note.time * 1000);
    });

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
    }, 400);
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
    if (!this.isSoundEnabled() || !this.audioCtx) return;
    
    this.playSound(440, 'sine', 0.1, 0.3); // A4
    setTimeout(() => this.playSound(554, 'sine', 0.1, 0.3), 80);  // C#5
    setTimeout(() => this.playSound(659, 'sine', 0.3, 0.3), 160); // E5, prolonged
  }

  public playScoreSound(score: number) {
    if (!this.isSoundEnabled() || !this.audioCtx) return;
    
    if (score < 40) {
        this.playFailSound();
    } else if (score < 70) {
        this.playSound(330, 'sine', 0.1, 0.3);
        setTimeout(() => this.playSound(440, 'sine', 0.1, 0.3), 100);
    } else if (score < 80) {
        this.playSuccess();
    } else {
        this.playTriumphSound();
    }
  }
}

export const soundService = new SoundService();