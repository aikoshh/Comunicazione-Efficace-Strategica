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
    
    // Ascending arpeggio
    this.playSound(440, 'sine', 0.1, 0.3); // A4
    setTimeout(() => this.playSound(554, 'sine', 0.1, 0.3), 80);  // C#5
    setTimeout(() => this.playSound(659, 'sine', 0.15, 0.3), 160); // E5
  }
}

export const soundService = new SoundService();