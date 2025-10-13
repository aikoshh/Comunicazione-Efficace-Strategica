import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocalization } from '../context/LocalizationContext';

// Polyfill for browsers that support it under a webkit prefix
// Fix: Cast window to `any` to access non-standard SpeechRecognition API which is not in the default Window type.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useSpeech() {
  const { language } = useLocalization();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
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
        if (voices.length === 0) return;

        const langCode = language === 'it' ? 'it-IT' : 'en-US';
        const targetVoices = voices.filter(v => v.lang.startsWith(language));
        if (targetVoices.length === 0) {
            console.warn(`No voices found for language: ${language}`);
            return;
        }

        let bestVoice: SpeechSynthesisVoice | undefined;

        if (language === 'it') {
            const preferredVoices = ["Alice", "Silvia", "Luca", "Google italiano", "Federica", "Paola"];
            for (const preferredName of preferredVoices) {
                bestVoice = targetVoices.find(v => v.name === preferredName);
                if (bestVoice) break;
            }
        } else { // English voices
            const preferredVoices = ["Samantha", "Google US English", "Alex", "Victoria"];
             for (const preferredName of preferredVoices) {
                bestVoice = targetVoices.find(v => v.name === preferredName);
                if (bestVoice) break;
            }
             if (!bestVoice) {
                bestVoice = targetVoices.find(v => v.name.toLowerCase().includes('female'));
            }
        }
        
        if (!bestVoice) {
            bestVoice = targetVoices[0];
        }

        setSelectedVoice(bestVoice || null);
    };

    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }
  }, []);
  
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) {
        console.warn("Speech Synthesis API is not supported in this browser.");
        if (onEnd) onEnd();
        return;
    }
    stopSpeaking();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'it' ? 'it-IT' : 'en-US';
    utterance.rate = 1; 
    utterance.pitch = 1.1; 
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, stopSpeaking, language]);

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;
    stopSpeaking();

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'it' ? 'it-IT' : 'en-US';
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

    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [isSupported, isListening, stopSpeaking, language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, speak, isSupported, isSpeaking, stopSpeaking };
}