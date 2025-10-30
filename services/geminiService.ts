// services/geminiService.ts

import { GoogleGenAI, Type } from '@google/genai';
import type {
  Exercise,
  AnalysisResult,
  VoiceAnalysisResult,
  PersonalizationData,
  ChatMessage,
  ResponseStyle,
  CommunicatorProfile,
} from '../types';

// Initialization as per guidelines. API key must be in process.env.API_KEY
// The app's build process should make this environment variable available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Model selection based on guidelines
const MODEL_NAME = 'gemini-2.5-pro'; // For complex reasoning, coding, etc.
const FAST_MODEL_NAME = 'gemini-2.5-flash'; // For basic text tasks, summarization, etc.

/**
 * Helper function to safely parse JSON response from Gemini,
 * which might be wrapped in markdown.
 * @param text The raw text response from the API.
 * @param typeName A name for the type being parsed, for better error messages.
 * @returns The parsed object of type T.
 */
const parseJsonResponse = <T>(text: string, typeName: string): T => {
    try {
        // The response might be wrapped in ```json ... ```
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString) as T;
    } catch (e) {
        console.error(`Error parsing JSON for ${typeName}:`, e);
        console.error("Raw text from API:", text);
        throw new Error(`Impossibile analizzare la risposta dal server per ${typeName}.`);
    }
};


export async function analyzeWrittenResponse(exercise: Exercise, userResponse: string, isPro: boolean): Promise<AnalysisResult> {
  const systemInstruction = `Sei un coach esperto di Comunicazione Efficace e Strategica. Il tuo compito è analizzare la risposta di un utente a uno scenario dato, fornendo un feedback costruttivo e dettagliato. Sii incoraggiante ma onesto, e fornisci sempre suggerimenti pratici. Valuta la risposta su una scala da 0 a 100.`;

  const prompt = `
    **Scenario:** ${exercise.scenario}
    **Compito:** ${exercise.task}
    **Risposta dell'utente:** "${userResponse}"

    **Analisi richiesta:**
    1.  **Punti di Forza:** Identifica 2-3 aspetti positivi della risposta dell'utente. Sii specifico.
    2.  **Aree di Miglioramento:** Identifica 2-3 aree di miglioramento. Per ogni area, fornisci un suggerimento chiaro e un esempio concreto di come applicarlo.
    3.  **Risposta Suggerita:** Fornisci una versione "breve" (1-2 frasi) e una "lunga" (più elaborata) della risposta ideale.
    4.  **Punteggio:** Fornisci un punteggio complessivo da 0 a 100, basato sull'efficacia strategica della risposta.
    ${isPro ? `5. **Valutazione Dettagliata (PRO):** Valuta la risposta su una scala da 0 a 10 per i seguenti criteri: Chiarezza, Tono, Orientamento alla Soluzione, Assertività, Struttura. Fornisci una breve giustificazione per ogni punteggio.` : ''}
  `;

  const detailedRubricSchema = {
    type: Type.OBJECT,
    properties: {
      criterion: { type: Type.STRING },
      score: { type: Type.INTEGER, description: 'Score from 0 to 10' },
      justification: { type: Type.STRING },
    },
    required: ['criterion', 'score', 'justification'],
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER, description: 'Overall score from 0 to 100' },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      areasForImprovement: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            suggestion: { type: Type.STRING },
            example: { type: Type.STRING },
          },
          required: ['suggestion', 'example'],
        },
      },
      suggestedResponse: {
        type: Type.OBJECT,
        properties: {
          short: { type: Type.STRING },
          long: { type: Type.STRING },
        },
        required: ['short', 'long'],
      },
      ...(isPro && { detailedRubric: { type: Type.ARRAY, items: detailedRubricSchema } }),
    },
    required: ['score', 'strengths', 'areasForImprovement', 'suggestedResponse'],
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    return parseJsonResponse<AnalysisResult>(response.text, 'AnalysisResult');
  } catch (error) {
    console.error('Error in analyzeWrittenResponse:', error);
    if (error instanceof Error) throw error;
    throw new Error("Si è verificato un errore durante l'analisi della risposta scritta.");
  }
}

export async function analyzeVerbalResponse(exercise: Exercise, userTranscript: string): Promise<VoiceAnalysisResult> {
  const systemInstruction = `Sei un coach vocale e di comunicazione strategica. Il tuo compito è analizzare la trascrizione di una risposta vocale di un utente. Inferisci gli aspetti paraverbali (tono, ritmo, pause) basandoti sulla scelta delle parole, la struttura delle frasi e la punteggiatura. Fornisci un feedback dettagliato e pratico per aiutare l'utente a migliorare il suo impatto vocale.`;

  const prompt = `
    **Scenario:** ${exercise.scenario}
    **Compito:** ${exercise.task}
    **Trascrizione della risposta dell'utente:** "${userTranscript}"

    **Analisi richiesta:**
    1.  **Valutazione Paraverbale:** Fornisci un punteggio da 0 a 10 per ciascuno dei seguenti criteri, con una breve giustificazione. Basa la tua analisi sulla trascrizione.
        - 'ritmo': Il flusso è naturale o affrettato/lento?
        - 'tono': Il tono suggerito dalle parole è appropriato allo scenario (es. assertivo, empatico)?
        - 'volume': Le parole suggeriscono un volume adeguato o sembra troppo alto/basso?
        - 'pause': La struttura suggerisce l'uso efficace delle pause per dare enfasi?
        - 'chiarezza': Il messaggio è chiaro, conciso e facile da capire?
    2.  **Punti di Forza:** Identifica 2-3 punti di forza della comunicazione dell'utente (contenuto e paraverbale inferito).
    3.  **Aree di Miglioramento:** Identifica 2-3 aree di miglioramento specifiche.
    4.  **Azioni Pratiche:** Fornisci una lista di 2-3 azioni concrete che l'utente può intraprendere per migliorare.
    5.  **Micro-Drill (60s):** Suggerisci un esercizio pratico di 60 secondi che l'utente può fare subito.
    6.  **Consegna Suggerita:**
        - 'instructions': Spiega brevemente come dovrebbe essere consegnato il messaggio ideale (es. "Parla con un tono calmo ma fermo...").
        - 'ideal_script': Scrivi lo script ideale per la risposta.
        - 'annotated_text': Riscrivi lo script ideale, inserendo i simboli '☐' per le pause e '△' per le parole da enfatizzare.
  `;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      scores: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            criterion_id: { type: Type.STRING, enum: ['ritmo', 'tono', 'volume', 'pause', 'chiarezza'] },
            score: { type: Type.INTEGER },
            justification: { type: Type.STRING },
          },
          required: ['criterion_id', 'score', 'justification'],
        },
      },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
      actions: { type: Type.ARRAY, items: { type: Type.STRING } },
      micro_drill_60s: { type: Type.STRING },
      suggested_delivery: {
        type: Type.OBJECT,
        properties: {
          instructions: { type: Type.STRING },
          ideal_script: { type: Type.STRING },
          annotated_text: { type: Type.STRING },
        },
        required: ['instructions', 'ideal_script', 'annotated_text'],
      },
    },
    required: ['scores', 'strengths', 'improvements', 'actions', 'micro_drill_60s', 'suggested_delivery'],
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    return parseJsonResponse<VoiceAnalysisResult>(response.text, 'VoiceAnalysisResult');
  } catch (error) {
    console.error('Error in analyzeVerbalResponse:', error);
    if (error instanceof Error) throw error;
    throw new Error("Si è verificato un errore durante l'analisi della risposta verbale.");
  }
}

export async function generateSuggestedResponse(exercise: Exercise): Promise<string> {
  const systemInstruction = `Sei un coach di comunicazione strategica. Fornisci risposte modello concise ed efficaci per gli scenari dati.`;
  
  const prompt = `
    **Scenario:** ${exercise.scenario}
    **Compito:** ${exercise.task}

    Fornisci una risposta ideale e ben formulata per questo compito.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error('Error in generateSuggestedResponse:', error);
    if (error instanceof Error) throw error;
    throw new Error('Impossibile generare un suggerimento.');
  }
}

export async function generateCustomExercise(personalizationData: PersonalizationData): Promise<{ scenario: string; task: string }> {
  const systemInstruction = `Sei un creatore di scenari di formazione per la comunicazione strategica. Genera scenari realistici e compiti sfidanti basati sul profilo dell'utente.`;

  const prompt = `
    Profilo Utente:
    - Professione: ${personalizationData.professione}
    - Livello Carriera: ${personalizationData.livelloCarriera}
    - Età: ${personalizationData.eta}
    - Contesto Comunicativo Tipico: ${personalizationData.contestoComunicativo}
    - Sfida Principale: ${personalizationData.sfidaPrincipale}

    Basandoti su questo profilo, crea un esercizio di comunicazione personalizzato. Fornisci:
    1.  **Scenario:** Una descrizione dettagliata di una situazione realistica che l'utente potrebbe affrontare.
    2.  **Compito:** Un compito chiaro che chiede all'utente come risponderebbe o agirebbe in quello scenario.
  `;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      scenario: { type: Type.STRING },
      task: { type: Type.STRING },
    },
    required: ['scenario', 'task'],
  };

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    return parseJsonResponse<{ scenario: string; task: string }>(response.text, 'CustomExercise');
  } catch (error) {
    console.error('Error in generateCustomExercise:', error);
    if (error instanceof Error) throw error;
    throw new Error("Impossibile generare l'esercizio personalizzato.");
  }
}

export async function generateCommunicatorProfile(responses: { exerciseTitle: string; userResponse: string }[]): Promise<CommunicatorProfile> {
  const systemInstruction = `Sei un profiler esperto in stili di comunicazione. Analizza le risposte fornite dall'utente a diversi scenari per delineare il suo profilo di comunicatore. Sii perspicace, incoraggiante e fornisci un titolo di profilo creativo e una descrizione utile.`;

  const userResponsesString = responses.map(r => `
    ---
    Esercizio: "${r.exerciseTitle}"
    Risposta: "${r.userResponse}"
    ---
  `).join('\n');

  const prompt = `
    Analizza le seguenti risposte dell'utente per creare un profilo di comunicatore:

    ${userResponsesString}

    **Compito:**
    1.  **Titolo del Profilo:** Crea un titolo evocativo e accurato (es. "Il Diplomatico Pragmatico", "L'Analista Assertivo").
    2.  **Descrizione del Profilo:** Scrivi una breve descrizione (2-3 frasi) che riassuma lo stile di comunicazione generale dell'utente.
    3.  **Punti di Forza:** Identifica 2-3 punti di forza chiave che emergono dalle risposte.
    4.  **Aree di Allenamento:** Identifica 2-3 aree principali su cui l'utente dovrebbe concentrarsi per migliorare.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      profileTitle: { type: Type.STRING },
      profileDescription: { type: Type.STRING },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['profileTitle', 'profileDescription', 'strengths', 'areasToImprove'],
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    return parseJsonResponse<CommunicatorProfile>(response.text, 'CommunicatorProfile');
  } catch (error) {
    console.error('Error in generateCommunicatorProfile:', error);
    if (error instanceof Error) throw error;
    throw new Error('Impossibile generare il profilo comunicatore.');
  }
}

export async function continueStrategicChat(
  chatHistory: ChatMessage[],
  situation: string,
  goal: string,
  personaStyle: ResponseStyle
): Promise<{ personaResponse:string; coachFeedback: string }> {
  
  const systemInstruction = `Interpreti due ruoli: un interlocutore in una simulazione di chat e un coach di comunicazione.
  1.  **Interlocutore (Persona):** Rispondi all'ultimo messaggio dell'utente in modo realistico, basandoti sul contesto e sullo stile assegnato (${personaStyle}). La tua risposta deve essere concisa e naturale per una chat.
  2.  **Coach AI:** Dopo aver formulato la risposta dell'interlocutore, fornisci un breve feedback (1-2 frasi) sull'ultimo messaggio dell'utente, valutandone l'efficacia strategica rispetto al suo obiettivo.`;

  const historyString = chatHistory.map(msg => {
    if (msg.role === 'user') return `Utente: ${msg.content}`;
    if (msg.role === 'persona') return `Interlocutore: ${msg.content}`;
    return ''; // ignore coach messages in history
  }).filter(Boolean).join('\n');

  const prompt = `
    **Contesto della Simulazione:**
    - Situazione: ${situation}
    - Obiettivo dell'utente: ${goal}
    - Stile dell'interlocutore: ${personaStyle}

    **Cronologia Chat:**
    ${historyString}

    **Il tuo compito:**
    Basandoti sull'ultimo messaggio dell'utente, genera una risposta dall'interlocutore e un feedback dal coach.
  `;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      personaResponse: { type: Type.STRING, description: "La risposta dell'interlocutore." },
      coachFeedback: { type: Type.STRING, description: "Il feedback del coach sul messaggio dell'utente." },
    },
    required: ['personaResponse', 'coachFeedback'],
  };
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    return parseJsonResponse<{ personaResponse: string; coachFeedback: string }>(response.text, 'ChatResponse');
  } catch (error) {
    console.error('Error in continueStrategicChat:', error);
    if (error instanceof Error) throw error;
    throw new Error('Si è verificato un errore durante la simulazione della chat.');
  }
}

export async function generateChatSuggestion(
  chatHistory: ChatMessage[],
  situation: string,
  goal: string
): Promise<string> {
  
  const systemInstruction = `Sei un coach di comunicazione strategica. Il tuo compito è suggerire il prossimo messaggio ideale per un utente in una simulazione di chat, aiutandolo a raggiungere il suo obiettivo.`;
  
  const historyString = chatHistory.map(msg => {
    if (msg.role === 'user') return `Utente: ${msg.content}`;
    if (msg.role === 'persona') return `Interlocutore: ${msg.content}`;
    return '';
  }).filter(Boolean).join('\n');
  
  const prompt = `
    **Contesto della Simulazione:**
    - Situazione: ${situation}
    - Obiettivo dell'utente: ${goal}

    **Cronologia Chat:**
    ${historyString}

    **Compito:**
    Suggerisci il prossimo messaggio che l'utente dovrebbe inviare per avanzare strategicamente verso il suo obiettivo. La risposta deve essere solo il testo del messaggio suggerito, senza virgolette o prefissi.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error('Error in generateChatSuggestion:', error);
    if (error instanceof Error) throw error;
    throw new Error('Impossibile generare un suggerimento per la chat.');
  }
}
