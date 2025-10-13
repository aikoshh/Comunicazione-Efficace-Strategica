import { useState, useRef, useEffect, useCallback } from 'react';
import { Language } from '../types';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useSpeech(lang: Language) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  const languageCode = lang === 'en' ? 'en-US' : 'it-IT';
  
  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn("Speech Recognition API is not supported in this browser.");
    }
    
    const loadVoices = () => {
        if (!window.speechSynthesis) return;
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return;

        const targetVoices = voices.filter(v => v.lang.startsWith(lang));
        if (targetVoices.length === 0) {
            console.warn(`No voices found for language: ${lang}`);
            return;
        }
        
        // Simple strategy: prefer native voices and female voices
        let bestVoice = targetVoices.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('apple') || v.name.toLowerCase().includes('microsoft'));
        if (!bestVoice) {
            bestVoice = targetVoices.find(v => v.name.toLowerCase().includes('female'));
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
  }, [lang]);

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
    utterance.lang = languageCode;
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
  }, [selectedVoice, stopSpeaking, languageCode]);

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    stopSpeaking();

    const recognition = new SpeechRecognition();
    recognition.lang = languageCode;
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
  }, [isSupported, isListening, stopSpeaking, languageCode]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, speak, isSupported, isSpeaking, stopSpeaking };
}