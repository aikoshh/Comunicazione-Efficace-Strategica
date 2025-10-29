// services/geminiService.ts

import { GoogleGenAI, Type } from "@google/genai";
import { FALLBACK_API_KEY } from '../config';
import type {
  Exercise,
  AnalysisResult,
  VoiceAnalysisResult,
  Entitlements,
  PersonalizationData,
  CommunicatorProfile,
  StrategicResponse,
  ContinuedStrategicResponse,
  ResponseStyle,
} from '../types';
import { hasProAccess } from './monetizationService';

// Helper function to initialize the client.
// As per guidelines, this ensures the most up-to-date API key is used for each call.
const getClient = () => {
    // Prioritize environment variable for security
    let apiKey = process.env.API_KEY;

    // If env var is not set, use the fallback key from the config file
    if (!apiKey || apiKey.trim() === '') {
        console.warn("API_KEY environment variable not set. Using fallback key from config.ts. This is not recommended for production.");
        apiKey = FALLBACK_API_KEY;
    }

    // Final check: if the key is still missing or is a placeholder, throw a clear error.
    if (!apiKey || apiKey.startsWith('INCOLLA-QUI')) {
        throw new Error("API key not configured. Please set the API_KEY environment variable or provide a valid key in config.ts.");
    }
    
    return new GoogleGenAI({ apiKey });
};


// --- PROMPTS and SCHEMAS ---

const analysisResultSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: "Punteggio generale da 0 a 100." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Elenco puntato dei punti di forza." },
        areasForImprovement: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    suggestion: { type: Type.STRING, description: "Area di miglioramento specifica." },
                    example: { type: Type.STRING, description: "Esempio pratico di come migliorare." },
                },
                required: ['suggestion', 'example'],
            },
            description: "Elenco delle aree di miglioramento con suggerimenti ed esempi."
        },
        suggestedResponse: {
            type: Type.OBJECT,
            properties: {
                short: { type: Type.STRING, description: "Versione breve e concisa della risposta ideale." },
                long: { type: Type.STRING, description: "Versione più elaborata e dettagliata della risposta ideale, con eventuali spiegazioni." },
            },
            required: ['short', 'long'],
            description: "Una risposta suggerita in versione breve ed elaborata."
        },
    },
    required: ['score', 'strengths', 'areasForImprovement', 'suggestedResponse'],
};

const proAnalysisResultSchema = {
    ...analysisResultSchema,
    properties: {
        ...analysisResultSchema.properties,
        detailedRubric: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    criterion: { type: Type.STRING, description: "Criterio di valutazione (es. Chiarezza, Tono, Soluzione)." },
                    score: { type: Type.NUMBER, description: "Punteggio da 0 a 10 per il criterio." },
                    justification: { type: Type.STRING, description: "Motivazione del punteggio assegnato." },
                },
                required: ['criterion', 'score', 'justification'],
            },
            description: "Valutazione dettagliata PRO basata su 5 rubriche."
        }
    },
     required: [...(analysisResultSchema.required || []), 'detailedRubric']
};


const voiceAnalysisResultSchema = {
    type: Type.OBJECT,
    properties: {
        scores: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    criterion_id: { type: Type.STRING, description: "ID del criterio: 'ritmo', 'tono', 'volume', 'pause', 'chiarezza'." },
                    score: { type: Type.NUMBER, description: "Punteggio da 0 a 10." },
                    justification: { type: Type.STRING, description: "Motivazione del punteggio." },
                },
                required: ['criterion_id', 'score', 'justification'],
            },
            description: "Punteggi dettagliati per i criteri paraverbali."
        },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Punti di forza dell'analisi paraverbale." },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Aree di miglioramento dell'analisi paraverbale." },
        actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Azioni pratiche e concrete suggerite." },
        micro_drill_60s: { type: Type.STRING, description: "Un breve esercizio (micro-drill) da 60 secondi." },
        suggested_delivery: {
            type: Type.OBJECT,
            properties: {
                instructions: { type: Type.STRING, description: "Istruzioni su come interpretare la consegna ideale." },
                ideal_script: { type: Type.STRING, description: "Trascrizione pulita della risposta ideale da usare per il text-to-speech." },
                annotated_text: { type: Type.STRING, description: "Testo annotato con simboli per pause (☐) ed enfasi (△)." },
            },
            required: ['instructions', 'ideal_script', 'annotated_text'],
            description: "Suggerimenti sulla consegna ideale della risposta."
        },
    },
    required: ['scores', 'strengths', 'improvements', 'actions', 'micro_drill_60s', 'suggested_delivery'],
};

const communicatorProfileSchema = {
    type: Type.OBJECT,
    properties: {
        profileTitle: { type: Type.STRING, description: "Titolo accattivante per il profilo (es. 'Il Diplomatico Pragmatico')." },
        profileDescription: { type: Type.STRING, description: "Descrizione di 2-3 frasi del profilo." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Elenco di 3-4 punti di forza." },
        areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Elenco di 2-3 aree di miglioramento primarie." },
    },
    required: ['profileTitle', 'profileDescription', 'strengths', 'areasToImprove'],
};

const strategicResponseSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: { type: Type.STRING, description: "Breve analisi strategica della situazione." },
        suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "Tipo di risposta: 'assertiva', 'empatica', 'chiarificatrice', 'solutiva'." },
                    response: { type: Type.STRING, description: "Bozza di risposta suggerita." },
                },
                required: ['type', 'response'],
            },
            description: "Elenco di 4 suggerimenti di risposta, uno per ogni tipo."
        },
    },
    required: ['analysis', 'suggestions'],
};

// --- API FUNCTIONS ---

async function handleResponse(responsePromise: Promise<any>): Promise<any> {
    try {
        const response = await responsePromise;
        const candidate = response.candidates?.[0];

        if (!candidate || !candidate.content || candidate.finishReason !== 'STOP') {
            const safetyReason = candidate?.finishReason;
            const safetyMessage = `L'analisi è stata interrotta per motivi di sicurezza (${safetyReason || 'sconosciuto'}). Prova a riformulare la tua risposta.`;
            throw new Error(safetyMessage);
        }
        
        // Pulizia del testo da eventuali markdown
        let jsonText = candidate.content.parts[0].text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        } else if (jsonText.startsWith('```')) {
             jsonText = jsonText.substring(3, jsonText.length - 3).trim();
        }
        
        return JSON.parse(jsonText);
    } catch (e: any) {
        console.error("Error processing AI response:", e);
        if (e.message.includes('JSON')) {
             throw new Error("L'AI ha restituito un formato imprevisto. Riprova.");
        }
        throw e; // Rilancia l'errore originale (es. blocco di sicurezza)
    }
}


export async function analyzeResponse(
  exercise: Exercise,
  userResponse: string,
  entitlements: Entitlements | null,
  personalization: Partial<PersonalizationData>,
  style: ResponseStyle | null
): Promise<AnalysisResult> {
    const ai = getClient();
    const isPro = hasProAccess(entitlements);

    const prompt = `
        Sei un coach di comunicazione strategica di livello mondiale. Il tuo compito è analizzare la risposta di un utente a uno scenario specifico e fornire un feedback costruttivo e dettagliato.
        
        CONTESTO DELL'ESERCIZIO:
        - Titolo: ${exercise.title}
        - Scenario: ${exercise.scenario}
        - Compito: ${exercise.task}

        RISPOSTA DELL'UTENTE:
        "${userResponse}"

        ISTRUZIONI PER L'ANALISI:
        1.  Valuta la risposta su una scala da 0 a 100, considerando efficacia, strategia, chiarezza ed empatia.
        2.  Identifica 2-3 punti di forza specifici.
        3.  Identifica 2-3 aree di miglioramento concrete. Per ogni area, fornisci un suggerimento chiaro e un esempio pratico di come l'utente avrebbe potuto riformulare una parte della sua risposta.
        4.  Scrivi una risposta suggerita ideale, sia in versione breve che elaborata. Includi **markdown bold** per le parole chiave.
        ${isPro ? `5.  FORNISCI UNA VALUTAZIONE DETTAGLIATA (detailedRubric) basata sui seguenti 5 criteri, assegnando un punteggio da 0 a 10 e una breve giustificazione per ciascuno:
            - Chiarezza: Il messaggio è chiaro, conciso e facile da capire?
            - Tono: Il tono è appropriato per la situazione e l'obiettivo?
            - Orientamento alla Soluzione: La risposta è proattiva e orientata a risolvere il problema o a raggiungere l'obiettivo?
            - Assertività: L'utente esprime il suo punto di vista in modo rispettoso ma fermo?
            - Struttura: La comunicazione ha una struttura logica e ben organizzata?` : ''
        }
        
        FORMATTA L'OUTPUT ESCLUSIVAMENTE IN JSON.
    `;

    const responsePromise = ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: isPro ? proAnalysisResultSchema : analysisResultSchema,
            temperature: 0.3,
        }
    });
    
    return handleResponse(responsePromise);
}


export async function analyzeParaverbalResponse(
  transcript: string,
  scenario: string,
  task: string
): Promise<VoiceAnalysisResult> {
    const ai = getClient();
    const prompt = `
        Sei un coach esperto in comunicazione paraverbale e vocale. Analizza la trascrizione di un messaggio audio in relazione a uno scenario. Il tuo focus è SOLO sul CONTENUTO del testo per INFERIRE le probabili qualità paraverbali.
        
        SCENARIO: ${scenario}
        COMPITO: ${task}
        TRASCRIZIONE UTENTE: "${transcript}"

        ISTRUZIONI:
        1.  VALUTAZIONE (scores): Valuta la trascrizione su 5 criteri paraverbali. Assegna un punteggio da 0 a 10 per ciascuno e una giustificazione basata SUL TESTO.
            - 'ritmo': Un ritmo troppo veloce suggerisce ansia, troppo lento noia. Un buon ritmo è variato.
            - 'tono': Il tono è assertivo, empatico, aggressivo? Deduci dal lessico.
            - 'volume': Le parole suggeriscono un volume alto (rabbia) o basso (insicurezza)?
            - 'pause': Il testo ha una struttura che suggerisce pause efficaci o è un flusso ininterrotto?
            - 'chiarezza': Il messaggio è diretto e facile da seguire o è contorto?
        2.  PUNTI DI FORZA (strengths): Identifica 2-3 punti di forza DEDOTTI dal testo.
        3.  AREE DI MIGLIORAMENTO (improvements): Identifica 2-3 aree di miglioramento DEDOTTE dal testo.
        4.  AZIONI PRATICHE (actions): Fornisci 2-3 azioni concrete che l'utente può fare per migliorare.
        5.  MICRO-DRILL (micro_drill_60s): Proponi un esercizio pratico di 60 secondi correlato a un'area di miglioramento.
        6.  RISPOSTA CONSIGLIATA (suggested_delivery):
            - 'instructions': Spiega brevemente come dovrebbe essere la consegna ideale (es. "Inizia con un tono calmo...").
            - 'ideal_script': Scrivi la trascrizione della risposta ideale. Questo testo sarà usato per un text-to-speech, quindi deve essere pulito.
            - 'annotated_text': Riscrivi l'ideal_script inserendo il simbolo '☐' dove suggerisci una pausa e '△' dove suggerisci enfasi vocale.
        
        FORMATTA L'OUTPUT ESCLUSIVAMENTE IN JSON.
    `;

    const responsePromise = ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: voiceAnalysisResultSchema,
            temperature: 0.5,
        }
    });
    
    return handleResponse(responsePromise);
}


export async function generateCustomExercise(
  data: PersonalizationData
): Promise<{ scenario: string, task: string }> {
    const ai = getClient();
    const prompt = `
        Crea uno scenario di comunicazione e un compito su misura per un utente con questo profilo:
        - Professione: ${data.professione}
        - Livello Carriera: ${data.livelloCarriera}
        - Età: ${data.eta}
        - Contesto Comunicativo Tipico: ${data.contestoComunicativo}
        - Sfida Principale: ${data.sfidaPrincipale}

        REGOLE:
        - Lo scenario deve essere realistico e specifico per il profilo.
        - Il compito deve essere chiaro e richiedere all'utente di formulare una risposta.
        - Rispondi SOLO con un oggetto JSON contenente "scenario" e "task". Non aggiungere altro testo.
    `;

     const responsePromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    scenario: { type: Type.STRING },
                    task: { type: Type.STRING },
                },
                required: ['scenario', 'task'],
            },
            temperature: 0.8,
        }
    });
    
    return handleResponse(responsePromise);
}

export async function generateCommunicatorProfile(
  responses: { exerciseTitle: string; userResponse: string }[]
): Promise<CommunicatorProfile> {
    const ai = getClient();
    const userResponses = responses.map(r => `- Esercizio "${r.exerciseTitle}": "${r.userResponse}"`).join('\n');
    
    const prompt = `
        Sei un profiler psicologico specializzato in stili di comunicazione. Analizza le seguenti risposte di un utente a tre diversi scenari di check-up per delineare il suo profilo di comunicatore.

        RISPOSTE DELL'UTENTE:
        ${userResponses}

        ISTRUZIONI:
        1.  Sintetizza lo stile comunicativo emergente in un titolo accattivante (es. "Il Mediatore Analitico", "Il Risolutore Diretto", "L'Empatico Cauto").
        2.  Scrivi una breve descrizione (2-3 frasi) che riassuma le tendenze principali.
        3.  Identifica 3-4 punti di forza chiari e specifici.
        4.  Identifica 2-3 aree di miglioramento primarie su cui l'utente dovrebbe concentrarsi.

        FORMATTA L'OUTPUT ESCLUSIVAMENTE IN JSON.
    `;

    const responsePromise = ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: communicatorProfileSchema,
            temperature: 0.4,
        }
    });
        
    return handleResponse(responsePromise);
}

export async function getStrategicSuggestions(
    situation: string,
    goal: string,
    context: string
): Promise<StrategicResponse> {
    const ai = getClient();
    const prompt = `
        Sei un coach di comunicazione strategica. Un utente ha bisogno di suggerimenti per gestire una conversazione.

        - Situazione: ${situation}
        - Obiettivo dell'utente: ${goal}
        - Contesto aggiuntivo: ${context || 'Nessuno'}

        ISTRUZIONI:
        1.  Fornisci una breve analisi strategica (2-3 frasi) della situazione.
        2.  Crea 4 bozze di risposta, una per ogni approccio:
            - 'empatica': Focalizzata sulla comprensione e validazione dell'emozione altrui.
            - 'assertiva': Esprime chiaramente bisogni o posizioni in modo rispettoso.
            - 'chiarificatrice': Fa domande per capire meglio la situazione.
            - 'solutiva': Si concentra sul trovare una soluzione pratica.

        FORMATTA L'OUTPUT ESCLUSIVAMENTE IN JSON.
    `;

     const responsePromise = ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: strategicResponseSchema,
            temperature: 0.7,
        }
    });
        
    return handleResponse(responsePromise);
}

export async function continueStrategicChat(
    history: { role: 'user' | 'persona'; content: string }[],
    situation: string,
    goal: string,
    context: string
): Promise<ContinuedStrategicResponse> {
    const ai = getClient();
    const chatHistory = history.map(m => `- ${m.role === 'user' ? 'Tu' : 'Interlocutore'}: ${m.content}`).join('\n');
    
    const prompt = `
        Sei un coach di comunicazione strategica che agisce in una simulazione di chat. Il tuo compito è duplice:
        1.  Interpretare il ruolo dell'interlocutore ("persona").
        2.  Fornire un'analisi da coach sulla risposta dell'utente.

        CONTESTO DELLA SIMULAZIONE:
        - Situazione Iniziale: ${situation}
        - Obiettivo dell'utente: ${goal}
        - Contesto Aggiuntivo: ${context || 'Nessuno'}
        
        STORICO DELLA CONVERSAZIONE:
        ${chatHistory}

        ISTRUZIONI:
        1.  **Risposta della Persona (personaResponse):** Basandoti sull'ultima risposta dell'utente ("Tu"), formula una risposta realistica e coerente per l'interlocutore ("persona").
        2.  **Analisi del Coach (analysis):** Valuta l'ultima risposta dell'utente. È strategica? Si avvicina all'obiettivo? Fornisci un feedback conciso.
        3.  **Suggerimenti del Coach (suggestions):** Come prima, fornisci 4 bozze di risposta alternative (empatica, assertiva, chiarificatrice, solutiva) che l'utente potrebbe usare.

        FORMATTA L'OUTPUT ESCLUSIVAMENTE IN JSON.
    `;
    
    const continuedStrategicResponseSchema = {
        ...strategicResponseSchema,
        properties: {
            ...strategicResponseSchema.properties,
            personaResponse: { type: Type.STRING, description: "La risposta dell'interlocutore simulato (persona)." },
        },
        required: [...(strategicResponseSchema.required || []), 'personaResponse'],
    };

    const responsePromise = ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: continuedStrategicResponseSchema,
            temperature: 0.8,
        }
    });
        
    return handleResponse(responsePromise);
}
