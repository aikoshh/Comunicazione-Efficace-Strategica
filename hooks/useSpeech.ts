import { useState, useRef, useEffect, useCallback } from 'react';

// Polyfill for browsers that support it under a webkit prefix
// Fix: Cast window to `any` to access non-standard SpeechRecognition API which is not in the default Window type.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  // Fix: Use `any` for the ref type as the `SpeechRecognition` type is not available globally and the name is shadowed by the constant above.
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn("Speech Recognition API is not supported in this browser.");
    }
    
    const loadVoices = () => {
        if (!window.speechSynthesis) return;
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            return; // Voices might not be loaded yet.
        }

        const italianVoices = voices.filter(v => v.lang === 'it-IT');
        if (italianVoices.length === 0) {
            console.warn("No Italian voices found.");
            return;
        }

        // Prioritize known high-quality voices
        const preferredVoices = [
            "Google italiano",
            "Alice",
            "Federica",
            "Paola"
        ];
        
        let bestVoice: SpeechSynthesisVoice | undefined;
        
        for (const preferredName of preferredVoices) {
            bestVoice = italianVoices.find(v => v.name === preferredName);
            if (bestVoice) break;
        }

        // Fallback to the first available Italian voice if no preferred ones are found
        if (!bestVoice) {
            bestVoice = italianVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('donna'));
        }

        if (!bestVoice) {
            bestVoice = italianVoices[0];
            console.warn("Could not find a preferred Italian voice, falling back to the default available one.");
        }

        setSelectedVoice(bestVoice || null);
    };

    // Voices can be loaded asynchronously. The 'onvoiceschanged' event is crucial for this.
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // Make an initial attempt to load voices
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel(); // Stop any ongoing speech on unmount
      }
    };
  }, []);
  
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) {
        console.warn("Speech Synthesis API is not supported in this browser.");
        if (onEnd) onEnd(); // Still call onEnd if TTS is not supported
        return;
    }
    window.speechSynthesis.cancel(); // Cancel any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 1; // Natural speed
    utterance.pitch = 1.1; // Slightly higher pitch for clarity
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    if (onEnd) {
        utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice]);

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      const currentTranscript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, speak, isSupported };
}