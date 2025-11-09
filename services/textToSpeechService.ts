// services/textToSpeechService.ts
import { GoogleGenAI, Modality } from "@google/genai";
import { getGenAI } from './geminiService';

// --- Funzioni Helper per la Conversione Audio ---

/**
 * Converte una stringa base64 in un Uint8Array.
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Scrive una stringa in un DataView.
 */
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Converte dati audio PCM (raw) in un Blob di tipo WAV.
 * Questo è necessario perché il modello Gemini TTS restituisce audio PCM grezzo.
 * @param pcmData Dati audio come Float32Array.
 * @param sampleRate La frequenza di campionamento (es. 24000).
 * @param numChannels Il numero di canali (es. 1 per mono).
 * @returns Un Blob che rappresenta il file WAV.
 */
function pcmToWavBlob(pcmData: Float32Array, sampleRate: number, numChannels: number): Blob {
  const headerSize = 44;
  const dataSize = pcmData.length * 2; // Campioni a 16 bit
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // Descrittore chunk RIFF
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // Sub-chunk "fmt "
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size per PCM
  view.setUint16(20, 1, true);  // AudioFormat (1 per PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // Sub-chunk "data"
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Scrive i dati PCM
  let offset = 44;
  for (let i = 0; i < pcmData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}


/**
 * Sintetizza il parlato dal testo usando il modello Gemini TTS.
 * @param text Il testo da sintetizzare.
 * @returns Una promise che si risolve in un HTMLAudioElement o null se la chiamata API fallisce.
 */
export const synthesizeSpeech = async (text: string): Promise<HTMLAudioElement | null> => {
  try {
    const ai = getGenAI();
    const model = "gemini-2.5-flash-preview-tts";

    const prompt = `Con un tono di voce femminile caldo, accogliente e stimolante, leggi: "${text}"`;

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Voce femminile italiana di alta qualità
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("La risposta dell'API non contiene dati audio.");
    }

    // Decodifica i dati PCM e convertili in un file WAV riproducibile
    const pcmBytes = decode(base64Audio);
    const dataInt16 = new Int16Array(pcmBytes.buffer);
    const float32Array = new Float32Array(dataInt16.length);
    for (let i = 0; i < dataInt16.length; i++) {
        float32Array[i] = dataInt16[i] / 32768.0;
    }

    const sampleRate = 24000; // Come da documentazione Gemini TTS
    const numChannels = 1;     // Mono

    const wavBlob = pcmToWavBlob(float32Array, sampleRate, numChannels);
    const audioUrl = URL.createObjectURL(wavBlob);
    
    return new Audio(audioUrl);

  } catch (error) {
    console.error("Errore nella sintesi vocale con Gemini, si userà la voce di sistema:", error);
    return null; // Segnala di usare il fallback
  }
};
