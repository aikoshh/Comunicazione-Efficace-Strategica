// services/geminiService.ts

import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import {
  AnalysisResult,
  Exercise,
  Entitlements,
  PersonalizationData,
  CommunicatorProfile,
  VoiceAnalysisResult,
  StrategicResponse,
  ContinuedStrategicResponse,
  ResponseStyle,
} from '../types';

// The API key MUST be obtained exclusively from the environment variable `process.env.API_KEY`.
// This is a hard requirement from the coding guidelines.
const getApiKey = (): string => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set. Please configure it in your deployment environment.");
    }
    return apiKey;
};

// Centralized function to run prompts and handle JSON parsing
async function runJsonPrompt<T>(prompt: string, schema: any, model: "gemini-2.5-pro" | "gemini-2.5-flash" = "gemini-2.5-pro"): Promise<T> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("Empty response from AI model.");
    }

    return JSON.parse(text) as T;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Provide a more user-friendly error message
    if (error.message.includes('400') || error.message.includes('invalid')) {
         throw new Error("La richiesta all'AI non è valida. Controlla il testo inserito.");
    }
     if (error.message.includes('API key not valid')) {
        throw new Error("La chiave API non è valida. Per favore, controlla la configurazione.");
    }
    throw new Error("Errore durante l'analisi della risposta da parte dell'AI. Riprova.");
  }
}

// --- Schemas for JSON Responses ---

const detailedRubricSchema = {
    type: Type.OBJECT,
    properties: {
        criterion: { type: Type.STRING },
        score: { type: Type.INTEGER, description: "Punteggio da 0 a 10" },
        justification: { type: Type.STRING },
    },
    required: ['criterion', 'score', 'justification']
};

const analysisResultSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER, description: "Punteggio generale da 0 a 100." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Elenco puntato dei punti di forza." },
        areasForImprovement: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    suggestion: { type: Type.STRING, description: "Area di miglioramento principale." },
                    example: { type: Type.STRING, description: "Esempio pratico di come migliorare." },
                },
                required: ['suggestion', 'example']
            },
            description: "Elenco delle aree di miglioramento con esempi."
        },
        suggestedResponse: {
            type: Type.OBJECT,
            properties: {
                short: { type: Type.STRING, description: "Una versione breve e concisa della risposta ideale." },
                long: { type: Type.STRING, description: "Una versione più elaborata e dettagliata della risposta ideale, con spiegazioni." },
            },
            required: ['short', 'long']
        },
        detailedRubric: {
            type: Type.ARRAY,
            items: detailedRubricSchema,
            description: "Valutazione dettagliata PRO basata su 5 criteri: Chiarezza, Tono, Orientamento alla Soluzione, Assertività, Struttura."
        }
    },
    required: ['score', 'strengths', 'areasForImprovement', 'suggestedResponse']
};


const voiceAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        scores: {
            type: Type.ARRAY,
            description: "Un array di 5 oggetti, uno per ogni criterio: ritmo, tono, volume, pause, chiarezza.",
            items: {
                type: Type.OBJECT,
                properties: {
                    criterion_id: { type: Type.STRING, enum: ['ritmo', 'tono', 'volume', 'pause', 'chiarezza'] },
                    score: { type: Type.INTEGER, description: "Punteggio da 1 a 10." },
                    justification: { type: Type.STRING, description: "Breve motivazione del punteggio." },
                },
                required: ['criterion_id', 'score', 'justification']
            }
        },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 punti di forza principali della performance paraverbale." },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 aree di miglioramento principali." },
        actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 azioni pratiche e concrete che l'utente può intraprendere." },
        micro_drill_60s: { type: Type.STRING, description: "Un esercizio pratico di 60 secondi che l'utente può fare subito." },
        suggested_delivery: {
            type: Type.OBJECT,
            properties: {
                instructions: { type: Type.STRING, description: "Spiegazione su come dovrebbe essere la dizione ideale (es. 'Parla con un tono più caldo...')." },
                ideal_script: { type: Type.STRING, description: "Il testo della risposta ideale, pulito, da usare per il Text-to-Speech." },
                annotated_text: { type: Type.STRING, description: "Lo stesso testo, ma con annotazioni per le pause (☐) e l'enfasi (△)." },
            },
            required: ['instructions', 'ideal_script', 'annotated_text']
        }
    },
    required: ['scores', 'strengths', 'improvements', 'actions', 'micro_drill_60s', 'suggested_delivery']
};


const communicatorProfileSchema = {
    type: Type.OBJECT,
    properties: {
        profileTitle: { type: Type.STRING, description: "Un titolo accattivante per il profilo, es: 'Il Mediatore Empatico'." },
        profileDescription: { type: Type.STRING, description: "Una descrizione di 2-3 frasi del profilo di comunicazione dell'utente." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Elenco dei principali punti di forza comunicativi." },
        areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Elenco delle principali aree da allenare." },
    },
    required: ['profileTitle', 'profileDescription', 'strengths', 'areasToImprove']
};

const customExerciseSchema = {
    type: Type.OBJECT,
    properties: {
        scenario: { type: Type.STRING, description: "Lo scenario dettagliato generato per l'utente." },
        task: { type: Type.STRING, description: "Il compito specifico che l'utente deve svolgere." },
    },
    required: ['scenario', 'task']
};

const strategicResponseSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: { type: Type.STRING, description: "Una breve analisi strategica del messaggio ricevuto." },
        suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['assertiva', 'empatica', 'chiarificatrice', 'solutiva'] },
                    response: { type: Type.STRING, description: "La bozza di risposta suggerita." },
                },
                required: ['type', 'response']
            }
        }
    },
    required: ['analysis', 'suggestions']
};

const continuedStrategicResponseSchema = {
    ...strategicResponseSchema,
    type: Type.OBJECT,
    properties: {
        ...strategicResponseSchema.properties,
        personaResponse: { type: Type.STRING, description: "La risposta simulata dell'interlocutore al messaggio dell'utente." },
    },
    required: [...strategicResponseSchema.required, 'personaResponse'],
};


// --- Service Functions ---

export const analyzeResponse = async (
  exercise: Exercise,
  userResponse: string,
  entitlements: Entitlements | null,
  history: any,
  style: ResponseStyle | null,
): Promise<AnalysisResult> => {
  const isPro = entitlements?.productIDs.has('ces.pro.monthly');
  
  const prompt = `
    Sei un coach esperto in comunicazione strategica. Analizza la risposta di un utente a un esercizio.
    
    CONTESTO ESERCIZIO:
    - Titolo: ${exercise.title}
    - Scenario: ${exercise.scenario}
    - Compito: ${exercise.task}

    STILE SCELTO DALL'UTENTE: ${style || 'Nessuno stile specifico richiesto.'}

    RISPOSTA DELL'UTENTE:
    "${userResponse}"

    ISTRUZIONI:
    Fornisci un'analisi completa in formato JSON. Basa la tua valutazione sull'efficacia della risposta in relazione allo STILE SCELTO.
    1.  **score**: Assegna un punteggio generale da 0 a 100.
    2.  **strengths**: Identifica 2-3 punti di forza specifici, commentando come si allineano allo stile scelto.
    3.  **areasForImprovement**: Identifica 2-3 aree di miglioramento, suggerendo come aderire meglio allo stile scelto. Per ciascuna, fornisci una "suggestion" chiara e un "example" pratico.
    4.  **suggestedResponse**: Fornisci una risposta ideale.
        -   **short**: Una versione breve e diretta.
        -   **long**: Una versione più elaborata che spiega il perché di certe scelte comunicative, sempre in relazione allo stile.
    ${isPro ? `5. **detailedRubric**: Valuta la risposta su 5 criteri (Chiarezza, Tono, Soluzione, Assertività, Struttura), ciascuno con un punteggio da 0 a 10 e una motivazione.` : ''}

    Sii costruttivo, incoraggiante e strategico nel tuo feedback.
    `;

    const schema = JSON.parse(JSON.stringify(analysisResultSchema));
    if (!isPro) {
        delete schema.properties.detailedRubric;
    }

    return runJsonPrompt<AnalysisResult>(prompt, schema);
};


export const analyzeParaverbalResponse = async (
  transcript: string,
  scenario: string,
  task: string
): Promise<VoiceAnalysisResult> => {
    const prompt = `
        Sei un coach vocale e di comunicazione paraverbale. Analizza la trascrizione di una risposta vocale di un utente.
        Dato che non puoi sentire l'audio, basa la tua analisi sulla scelta delle parole, la struttura della frase e la probabile intenzione paraverbale.

        SCENARIO: ${scenario}
        COMPITO: ${task}
        TRASCRIZIONE UTENTE: "${transcript}"

        ISTRUZIONI:
        Fornisci un'analisi completa in formato JSON.
        1.  **scores**: Valuta la trascrizione su 5 criteri (ritmo, tono, volume, pause, chiarezza). Assegna un punteggio da 1 a 10 per ciascuno, deducendo la performance dalla scelta delle parole e dalla struttura. Ad esempio, frasi lunghe e complesse potrebbero indicare un ritmo veloce e poche pause. Parole assertive potrebbero suggerire un volume adeguato. Giustifica brevemente ogni punteggio.
        2.  **strengths**: Identifica 2-3 punti di forza della comunicazione basandoti sul testo.
        3.  **improvements**: Identifica 2-3 aree di miglioramento paraverbale suggerite dal testo.
        4.  **actions**: Fornisci 2-3 azioni pratiche che l'utente può fare per migliorare.
        5.  **micro_drill_60s**: Proponi un esercizio pratico e veloce (max 60 secondi) basato sulla sua performance.
        6.  **suggested_delivery**:
            -   **instructions**: Descrivi come dovrebbe essere la dizione ideale per questa risposta.
            -   **ideal_script**: Riscrivi la risposta in modo ideale. Questo testo sarà usato per un Text-to-Speech, quindi deve essere pulito.
            -   **annotated_text**: Prendi l'ideal_script e inserisci il simbolo ☐ dove suggeriresti una pausa e △ prima di una parola o frase da enfatizzare.
    `;
    return runJsonPrompt<VoiceAnalysisResult>(prompt, voiceAnalysisSchema);
};

export const generateCommunicatorProfile = async (
  responses: { exerciseTitle: string; userResponse: string }[]
): Promise<CommunicatorProfile> => {
  const responsesText = responses.map(r => `- ${r.exerciseTitle}:\n  "${r.userResponse}"`).join('\n\n');
  
  const prompt = `
    Sei un profiler esperto di stili comunicativi. Analizza le seguenti risposte di un utente a tre scenari diversi per creare il suo profilo di comunicatore.

    RISPOSTE DELL'UTENTE:
    ${responsesText}

    ISTRUZIONI:
    Sintetizza l'analisi in un profilo JSON.
    1.  **profileTitle**: Crea un titolo accattivante e descrittivo per il profilo (es: "Il Solutore Pragmatico", "Il Diplomatico Cauto").
    2.  **profileDescription**: Scrivi una descrizione di 2-3 frasi che riassuma lo stile comunicativo emerso.
    3.  **strengths**: Elenca 2-3 punti di forza comunicativi chiave dell'utente.
    4.  **areasToImprove**: Elenca 2-3 aree di miglioramento più importanti su cui l'utente dovrebbe concentrarsi.
    
    Sii acuto, costruttivo e incoraggiante.
  `;
  return runJsonPrompt<CommunicatorProfile>(prompt, communicatorProfileSchema, "gemini-2.5-flash");
};

export const generateCustomExercise = async (data: PersonalizationData): Promise<{ scenario: string; task: string; }> => {
    const prompt = `
        Sei un creatore di scenari formativi per la comunicazione. Genera un esercizio personalizzato per un utente basato sul suo profilo.

        PROFILO UTENTE:
        - Professione: ${data.professione}
        - Livello Carriera: ${data.livelloCarriera}
        - Contesto Comunicativo Tipico: ${data.contestoComunicativo}
        - Sfida Principale: "${data.sfidaPrincipale}"

        ISTRUZIONI:
        Crea uno scenario e un compito realistici, specifici e sfidanti per questo utente.
        1.  **scenario**: Descrivi una situazione lavorativa plausibile che l'utente potrebbe affrontare, legata alla sua sfida principale e al suo contesto.
        2.  **task**: Definisci chiaramente cosa l'utente deve fare o dire per risolvere lo scenario.

        Il risultato deve essere in formato JSON.
    `;
    return runJsonPrompt<{ scenario: string; task: string; }>(prompt, customExerciseSchema, "gemini-2.5-flash");
};


export const getStrategicSuggestions = async (message: string, objective: string, context: string): Promise<StrategicResponse> => {
    const prompt = `
    Sei un coach di comunicazione strategica. Un utente ha ricevuto un messaggio e ha bisogno di aiuto per rispondere.

    CONTESTO:
    - Messaggio Ricevuto: "${message}"
    - Obiettivo dell'utente: "${objective}"
    - Contesto aggiuntivo: "${context}"

    ISTRUZIONI:
    Fornisci un'analisi e dei suggerimenti in formato JSON.
    1.  **analysis**: Analizza brevemente la situazione, l'intenzione probabile del mittente e l'obiettivo strategico della risposta.
    2.  **suggestions**: Fornisci 3 o 4 bozze di risposta, ciascuna con un approccio diverso e un 'type' corrispondente:
        -   'assertiva': chiara, diretta e che difende una posizione.
        -   'empatica': che si concentra sul comprendere e validare il punto di vista dell'altro.
        -   'chiarificatrice': che fa domande per capire meglio.
        -   'solutiva': che propone soluzioni concrete.
    `;
    return runJsonPrompt<StrategicResponse>(prompt, strategicResponseSchema, "gemini-2.5-flash");
}


export const continueStrategicChat = async (
    chatHistory: { role: 'user' | 'persona', content: string }[],
    situation: string,
    goal: string,
    context: string
): Promise<ContinuedStrategicResponse> => {
    const historyString = chatHistory.map(m => `${m.role === 'user' ? 'Utente' : 'Interlocutore'}: ${m.content}`).join('\n');

    const prompt = `
    Sei un coach di comunicazione strategica e un simulatore di conversazioni. La chat è già iniziata.
    
    CONTESTO INIZIALE:
    - Situazione: ${situation}
    - Obiettivo dell'utente: ${goal}
    - Contesto aggiuntivo: ${context}

    CRONOLOGIA CHAT FINORA:
    ${historyString}

    ISTRUZIONI:
    Esegui due compiti in un unico output JSON:
    1.  **Simula l'interlocutore**: Basandoti sulla cronologia, genera la prossima risposta dell'interlocutore al messaggio dell'utente. Deve essere realistica. Inseriscila nel campo 'personaResponse'.
    2.  **Agisci come coach**:
        -   **analysis**: Fornisci una nuova, breve analisi strategica della situazione attuale della chat.
        -   **suggestions**: Genera 3 o 4 nuove bozze di risposta (assertiva, empatica, ecc.) che l'utente potrebbe usare come sua prossima mossa.
    `;

    return runJsonPrompt<ContinuedStrategicResponse>(prompt, continuedStrategicResponseSchema, "gemini-2.5-flash");
}