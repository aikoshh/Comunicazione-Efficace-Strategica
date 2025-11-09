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

const SILENCE_THRESHOLD = 0.01; // RMS threshold for silence
const PAUSE_DURATION_MS = 500; // 0.5 seconds to be considered a pause

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [highlightedTranscript, setHighlightedTranscript] = useState<React.ReactNode>(null);
  const [liveMetrics, setLiveMetrics] = useState<RealTimeMetrics>({
    volume: 0, wpm: 0, fillerCount: 0, dynamicRange: 0, pauseCount: 0, pitchVariation: 0
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const metricsHistoryRef = useRef<{ volume: number[], wpm: number[], pitch: number[] }>({ volume: [], wpm: [], pitch: [] });
  const startTimeRef = useRef<number>(0);
  
  // Refs for pause detection
  const isSilentRef = useRef(false);
  const silenceStartTimeRef = useRef(0);
  const pauseCountRef = useRef(0);

  // --- Load available voices ---
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const processTranscript = useCallback((text: string) => {
    const words = text.split(/\s+/).filter(Boolean);
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
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
    }
  }, []);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopAudioProcessing();
    setIsListening(false);

    const capturedTranscript = transcript;
    
    const { wpm, pitch } = metricsHistoryRef.current;
    const avgWpm = wpm.length > 0 ? Math.round(wpm.reduce((a, b) => a + b, 0) / wpm.length) : 0;
    const avgPitchVariation = pitch.length > 0 ? (pitch.reduce((a, b) => a + b, 0) / pitch.length) : 0;

    const summary: RealTimeMetricsSummary = {
      avgWpm,
      totalFillers: liveMetrics.fillerCount,
      avgDynamicRange: liveMetrics.dynamicRange,
      totalPauses: pauseCountRef.current,
      avgPitchVariation,
    };

    return { finalTranscript: capturedTranscript, finalSummary: summary };
  }, [stopAudioProcessing, transcript, liveMetrics]);

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
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    cancelSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    
    const italianVoices = voices.filter(v => v.lang === 'it-IT');
    const preferredVoiceNames = ['Federica', 'Alice', 'Paola', 'Google italiano'];
    let selectedVoice = italianVoices.find(v => preferredVoiceNames.some(name => v.name.includes(name)));
    if (!selectedVoice && italianVoices.length > 0) selectedVoice = italianVoices[0];
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => setIsSpeaking(true);
    const onEnd = () => { setIsSpeaking(false); utteranceRef.current = null; };
    utterance.onend = onEnd;
    utterance.onerror = (e) => { console.error("Speech synthesis error", e); onEnd(); };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [cancelSpeaking, voices]);

  useEffect(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'it-IT';

    recognition.onresult = (event: any) => {
        let finalTranscriptPart = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscriptPart += event.results[i][0].transcript + ' ';
            }
        }
        if (finalTranscriptPart) {
            setTranscript(prev => {
                const newFullTranscript = (prev + ' ' + finalTranscriptPart).trim();
                processTranscript(newFullTranscript); 
                return newFullTranscript;
            });
        }
    };

    recognition.onend = () => { setIsListening(false); stopAudioProcessing(); };
    recognition.onerror = (event: any) => {
      if(event.error !== 'aborted') console.error('Speech recognition error:', event.error);
      if(event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        alert("Accesso al microfono negato. Per favore, abilita l'accesso nelle impostazioni del browser.");
      }
      setIsListening(false);
      stopAudioProcessing();
    };

    recognitionRef.current = recognition;
    return () => {
      recognitionRef.current?.stop();
      stopAudioProcessing();
      cancelSpeaking();
    };
  }, [processTranscript, stopAudioProcessing, cancelSpeaking]);

  const startListening = useCallback(async () => {
    if (isListening) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        const processor = audioContext.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;

        const timeDomainData = new Uint8Array(analyser.fftSize);
        const freqDomainData = new Float32Array(analyser.fftSize);

        processor.onaudioprocess = (event) => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteTimeDomainData(timeDomainData);
            
            let sum = 0.0;
            for(let i = 0; i < timeDomainData.length; i++) {
                const normalized = (timeDomainData[i] / 128.0) - 1.0;
                sum += normalized * normalized;
            }
            const rms = Math.sqrt(sum / timeDomainData.length);
            const volume = Math.min(100, rms * 300);

            // Pause Detection
            if (rms < SILENCE_THRESHOLD) {
                if (!isSilentRef.current) {
                    isSilentRef.current = true;
                    silenceStartTimeRef.current = Date.now();
                }
            } else {
                if (isSilentRef.current) {
                    const silenceDuration = Date.now() - silenceStartTimeRef.current;
                    if (silenceDuration > PAUSE_DURATION_MS) {
                        pauseCountRef.current += 1;
                        setLiveMetrics(prev => ({...prev, pauseCount: pauseCountRef.current}));
                    }
                    isSilentRef.current = false;
                }
            }
            
            // Pitch Variation (Proxy)
            analyserRef.current.getFloatFrequencyData(freqDomainData);
            const maxFreq = Math.max(...freqDomainData.filter(f => f > -Infinity));
            const pitchVariation = maxFreq > -100 ? Math.min(100, ((maxFreq + 100) / 70) * 100) : 0;
            metricsHistoryRef.current.pitch.push(pitchVariation);
            
            const volumes = metricsHistoryRef.current.volume;
            volumes.push(volume);
            if (volumes.length > 50) volumes.shift();
            const maxVol = Math.max(...volumes);
            const minVol = Math.min(...volumes);
            const dynamicRange = (maxVol > 0) ? ((maxVol - minVol) / maxVol) * 100 : 0;
            
            setLiveMetrics(prev => ({ ...prev, volume, dynamicRange, pitchVariation }));
        };

        source.connect(analyser);
        analyser.connect(processor);
        processor.connect(audioContext.destination);

        setTranscript('');
        setHighlightedTranscript(null);
        metricsHistoryRef.current = { volume: [], wpm: [], pitch: [] };
        pauseCountRef.current = 0;
        startTimeRef.current = Date.now();
        
        recognitionRef.current?.start();
        setIsListening(true);
    } catch (err) {
        console.error("Error starting audio capture:", err);
        alert("Impossibile accedere al microfono. Controlla le autorizzazioni del browser.");
    }
  }, [isListening]);

  return {
    isListening, transcript, highlightedTranscript, liveMetrics,
    startListening, stopListening, speak, isSpeaking, cancelSpeaking,
  };
};