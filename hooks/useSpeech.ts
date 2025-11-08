// hooks/useSpeech.ts
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RealTimeMetrics, RealTimeMetricsSummary } from '../types';

// Polyfill for cross-browser compatibility
const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
const SpeechRecognitionEvent = window.SpeechRecognitionEvent || (window as any).webkitSpeechRecognitionEvent;

const FILLER_WORDS_IT = new Set([
  'ehm', 'uhm', 'cioè', 'diciamo', 'praticamente', 
  'tipo', 'allora', 'insomma', 'quindi', 'niente', 'ecco'
]);

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [highlightedTranscript, setHighlightedTranscript] = useState<React.ReactNode>(null);
  const [liveMetrics, setLiveMetrics] = useState<RealTimeMetrics>({
    volume: 0, wpm: 0, fillerCount: 0, dynamicRange: 0
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const metricsHistoryRef = useRef<{ volume: number[], wpm: number[] }>({ volume: [], wpm: [] });
  const startTimeRef = useRef<number>(0);

  const processTranscript = useCallback((text: string) => {
    const words = text.split(/\s+/);
    const fillerCount = words.filter(word => FILLER_WORDS_IT.has(word.toLowerCase().replace(/[.,!?]/g, ''))).length;

    const elapsedTime = (Date.now() - startTimeRef.current) / 1000 / 60; // in minutes
    const wpm = elapsedTime > 0 ? Math.round(words.length / elapsedTime) : 0;

    setLiveMetrics(prev => ({ ...prev, fillerCount, wpm }));
    metricsHistoryRef.current.wpm.push(wpm);

    const highlighted = words.map((word, i) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?]/g, '');
        if (FILLER_WORDS_IT.has(cleanWord)) {
            return React.createElement('span', { key: i, style: { color: 'red', fontWeight: 'bold' } }, `${word} `);
        }
        return `${word} `;
    });
    setHighlightedTranscript(highlighted);
  }, []);

  const stopAudioProcessing = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
    }
  }, []);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // This will trigger 'onend' which handles state changes
    }
    stopAudioProcessing(); // Stop visual processing immediately for better UX
    setIsListening(false);

    // --- NEW LOGIC: Immediately capture and return final data ---
    const capturedTranscript = transcript;
    
    const avgWpm = metricsHistoryRef.current.wpm.length > 0
      ? Math.round(metricsHistoryRef.current.wpm.reduce((a, b) => a + b, 0) / metricsHistoryRef.current.wpm.length)
      : 0;
      
    const summary: RealTimeMetricsSummary = {
      avgWpm,
      totalFillers: liveMetrics.fillerCount,
      avgDynamicRange: liveMetrics.dynamicRange,
    };

    return { finalTranscript: capturedTranscript, finalSummary: summary };
    // --- END NEW LOGIC ---

  }, [stopAudioProcessing, transcript, liveMetrics.fillerCount, liveMetrics.dynamicRange]);

  const cancelSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('Speech Synthesis API not supported.');
      return;
    }
    
    cancelSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.onstart = () => setIsSpeaking(true);
    const onEnd = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onend = onEnd;
    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      onEnd();
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [cancelSpeaking]);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.error('Speech Recognition API not supported.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'it-IT';

    recognition.onresult = (event: any) => {
      let finalTranscriptChunk = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscriptChunk += event.results[i][0].transcript;
      }
      setTranscript(finalTranscriptChunk);
      processTranscript(finalTranscriptChunk);
    };

    recognition.onend = () => {
      // Cleanup logic remains here, but it no longer controls the UI flow
      setIsListening(false);
      stopAudioProcessing();
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if(event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        alert("Accesso al microfono negato. Per favore, abilita l'accesso nelle impostazioni del browser.");
      }
      setIsListening(false);
      stopAudioProcessing();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioProcessing();
      cancelSpeaking();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        mediaStreamSourceRef.current = source;
        
        const processor = audioContext.createScriptProcessor(2048, 1, 1);
        analyserRef.current = processor;

        const volumes: number[] = [];
        processor.onaudioprocess = (event) => {
            const inputData = event.inputBuffer.getChannelData(0);
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);
            const volume = Math.min(100, rms * 300);
            volumes.push(volume);

            if (volumes.length > 50) {
                volumes.shift();
            }

            const maxVol = Math.max(...volumes);
            const minVol = Math.min(...volumes);
            const dynamicRange = (maxVol > 0) ? ((maxVol - minVol) / maxVol) * 100 : 0;
            
            setLiveMetrics(prev => ({ ...prev, volume, dynamicRange }));
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        setTranscript('');
        setHighlightedTranscript(null);
        metricsHistoryRef.current = { volume: [], wpm: [] };
        startTimeRef.current = Date.now();
        
        recognitionRef.current?.start();
        setIsListening(true);
    } catch (err) {
        console.error("Error starting audio capture:", err);
        alert("Impossibile accedere al microfono. Controlla le autorizzazioni del browser.");
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    highlightedTranscript,
    liveMetrics,
    startListening,
    stopListening,
    speak,
    isSpeaking,
    cancelSpeaking,
  };
};