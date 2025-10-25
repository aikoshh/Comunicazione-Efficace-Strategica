// services/geminiService.ts
import { GoogleGenAI, Type } from '@google/genai';
import {
  Exercise,
  AnalysisResult,
  Entitlements,
  UserProgress,
  PersonalizationData,
  CommunicatorProfile,
  VoiceAnalysisResult,
  DetailedRubricScore,
} from '../types';
import { hasProAccess } from './monetizationService';
import { FALLBACK_API_KEY } from '../config';

// Helper to get the Gemini API client
const getClient = (): GoogleGenAI => {
  // Use the environment variable if available, otherwise use the fallback key.
  const apiKey = process.env.API_KEY || FALLBACK_API_KEY;
  
  if (!apiKey || apiKey.startsWith('INCOLLA-QUI')) {
     throw new Error("API key not configured. Please set the API_KEY environment variable or update it in config.ts.");
  }

  return new GoogleGenAI({ apiKey });
};

// Helper function to parse JSON response from the model
const parseJsonResponse = <T>(jsonString: string): T => {
    try {
        // The model might return a markdown block with JSON inside
        const sanitizedString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(sanitizedString) as T;
    } catch (error) {
        console.error("Failed to parse JSON response:", jsonString);
        throw new Error("La risposta del modello non è in un formato JSON valido.");
    }
};

const detailedRubricScoreSchema = {
    type: Type.OBJECT,
    properties: {
        criterion: { type: Type.STRING },
        score: { type: Type.NUMBER },
        justification: { type: Type.STRING },
    },
    required: ['criterion', 'score', 'justification']
};

const analysisResultSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: "Valutazione complessiva da 0 a 100." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        areasForImprovement: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    suggestion: { type: Type.STRING },
                    example: { type: Type.STRING },
                },
                required: ['suggestion', 'example']
            }
        },
        suggestedResponse: {
            type: Type.OBJECT,
            properties: {
                short: { type: Type.STRING },
                long: { type: Type.STRING },
            },
            required: ['short', 'long']
        },
        // PRO features are optional
        evolutionary_feedback: { type: Type.STRING, nullable: true },
        detailedRubric: { type: Type.ARRAY, items: detailedRubricScoreSchema, nullable: true },
        utilityScore: { type: Type.NUMBER, nullable: true },
        clarityScore: { type: Type.NUMBER, nullable: true },
    },
    required: ['score', 'strengths', 'areasForImprovement', 'suggestedResponse']
};


export const analyzeResponse = async (
  exercise: Exercise,
  userResponse: string,
  entitlements: Entitlements | null,
  analysisHistory: UserProgress['analysisHistory']
): Promise<AnalysisResult> => {
    const ai = getClient();
    const isPro = hasProAccess(entitlements);

    const proInstructions = isPro ? `
      Inoltre, essendo un utente PRO, fornisci anche:
      - "evolutionary_feedback": Un feedback evolutivo che collega questa performance a esercizi precedenti, se presenti.
      - "detailedRubric": Una valutazione dettagliata basata su 5 criteri (Chiarezza, Tono, Orientamento alla Soluzione, Assertività, Struttura), ciascuno con punteggio da 1 a 10 e una breve giustificazione.
      - Se l'esercizio è una domanda (competence: 'riformulazione' o 'ascolto' con 'domanda' nel titolo), fornisci anche "utilityScore" e "clarityScore" da 1 a 10.
    ` : '';
    
    const prompt = `
      Sei un coach di comunicazione strategica. Analizza la risposta di un utente a un esercizio.
      
      **Scenario dell'Esercizio:** ${exercise.scenario}
      **Compito dell'Esercizio:** ${exercise.task}
      **Risposta dell'Utente:** "${userResponse}"
      
      Fornisci un'analisi dettagliata in formato JSON, seguendo lo schema fornito.
      - "score": Un punteggio da 0 a 100 che valuta l'efficacia complessiva della risposta.
      - "strengths": Un array di 2-3 punti di forza specifici.
      - "areasForImprovement": Un array di 2-3 aree di miglioramento, ognuna con un "suggestion" (suggerimento) e un "example" (esempio pratico di come applicarlo).
      - "suggestedResponse": Fornisci una "short" (versione breve e diretta) e una "long" (versione più elaborata ed empatica) della risposta ideale. Usa **asterischi** per evidenziare le parole chiave.
      ${proInstructions}
      
      Sii costruttivo, incoraggiante e strategico nel tuo feedback. La lingua deve essere l'italiano.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: analysisResultSchema,
        },
    });
    
    return parseJsonResponse<AnalysisResult>(response.text);
};


const voiceAnalysisResultSchema = {
    type: Type.OBJECT,
    properties: {
        scores: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    criterion_id: { type: Type.STRING, enum: ['ritmo', 'tono', 'volume', 'pause', 'chiarezza'] },
                    score: { type: Type.NUMBER, description: "Punteggio da 1 a 10" }
                },
                required: ['criterion_id', 'score']
            }
        },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
        actions: { type: Type.ARRAY, items: { type: Type.STRING } },
        micro_drill_60s: { type: Type.STRING },
        suggested_delivery: {
            type: Type.OBJECT,
            properties: {
                instructions: { type: Type.STRING },
                annotated_text: { type: Type.STRING, description: "Usa ☐ per le pause e △ per l'enfasi" },
                ideal_script: { type: Type.STRING, description: "Testo pulito da leggere" }
            },
            required: ['instructions', 'annotated_text', 'ideal_script']
        }
    },
    required: ['scores', 'strengths', 'improvements', 'actions', 'micro_drill_60s', 'suggested_delivery']
};


export const analyzeParaverbalResponse = async (
    userResponse: string, // this is the transcript
    scenario: string,
    task: string
): Promise<VoiceAnalysisResult> => {
    const ai = getClient();
    const prompt = `
      Sei un coach esperto di public speaking e comunicazione paraverbale. Analizza la trascrizione di una risposta audio di un utente. Basandoti SOLO sul testo, inferisci le probabili qualità paraverbali.
      
      **Scenario:** ${scenario}
      **Compito:** ${task}
      **Trascrizione della risposta:** "${userResponse}"
      
      Fornisci un'analisi dettagliata in formato JSON secondo lo schema.
      - "scores": Un array di oggetti, uno per ogni criterio ('ritmo', 'tono', 'volume', 'pause', 'chiarezza'), con un "criterion_id" e uno "score" da 1 a 10. Basa i punteggi sulla probabile efficacia del testo.
      - "strengths": 2-3 punti di forza della risposta (es: "L'uso di parole assertive suggerisce un volume sicuro").
      - "improvements": 2-3 aree di miglioramento (es: "La frase lunga e senza punteggiatura potrebbe indicare un ritmo troppo veloce").
      - "actions": 2-3 azioni pratiche che l'utente può fare per migliorare.
      - "micro_drill_60s": Un esercizio pratico di 60 secondi per lavorare su un'area chiave.
      - "suggested_delivery":
        - "instructions": Spiega la strategia paraverbale della risposta ideale.
        - "annotated_text": Riscrivi la risposta ideale, usando il simbolo ☐ per indicare una pausa e △ per indicare enfasi su una parola.
        - "ideal_script": La stessa risposta ideale, ma senza annotazioni, pronta per essere letta da un text-to-speech.
        
      La lingua deve essere l'italiano.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: voiceAnalysisResultSchema,
        },
    });

    return parseJsonResponse<VoiceAnalysisResult>(response.text);
};

export const generateCustomExercise = async (
    data: PersonalizationData
): Promise<{ scenario: string, task: string }> => {
    const ai = getClient();
    const prompt = `
      Crea un esercizio di comunicazione strategica personalizzato in italiano basato su questo profilo utente:
      - Professione: ${data.professione}
      - Livello Carriera: ${data.livelloCarriera}
      - Contesto Comunicativo: ${data.contestoComunicativo}
      - Sfida Principale: ${data.sfidaPrincipale}
      
      Genera una risposta JSON con due campi:
      - "scenario": Uno scenario realistico e dettagliato (circa 50-70 parole).
      - "task": Un compito chiaro e specifico che l'utente deve svolgere (circa 15-25 parole).
      
      Lo scenario deve essere plausibile per il ruolo e la sfida dell'utente. Il compito deve essere orientato all'azione.
    `;

    const response = await ai.models.generateContent({
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
                required: ['scenario', 'task']
            },
        },
    });
    
    return parseJsonResponse<{ scenario: string, task: string }>(response.text);
};

export const generateCommunicatorProfile = async (
    responses: { exerciseTitle: string, userResponse: string }[]
): Promise<CommunicatorProfile> => {
    const ai = getClient();
    const responsesString = responses.map(r => `- Esercizio "${r.exerciseTitle}": "${r.userResponse}"`).join('\n');
    
    const prompt = `
      Sei un profiler di comunicazione. Analizza le seguenti risposte di un utente a degli esercizi di check-up e definisci il suo profilo di comunicatore.
      
      **Risposte dell'utente:**
      ${responsesString}
      
      Genera una risposta JSON con i seguenti campi in italiano:
      - "profileTitle": Un titolo evocativo per il profilo (es: "Il Diplomatico Pragmatico", "L'Analitico Riservato").
      - "profileDescription": Una descrizione di 2-3 frasi del profilo.
      - "strengths": Un array di 2-3 punti di forza emersi dalle risposte.
      - "areasToImprove": Un array di 2-3 aree di miglioramento concrete su cui l'utente dovrebbe lavorare.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    profileTitle: { type: Type.STRING },
                    profileDescription: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['profileTitle', 'profileDescription', 'strengths', 'areasToImprove']
            },
        },
    });

    return parseJsonResponse<CommunicatorProfile>(response.text);
};


export const generateStrategicChatResponse = async (
  receivedMessage: string,
  objective: string,
  context: string,
  tone: 'Empatico' | 'Diretto' | 'Chiarificatore'
): Promise<string> => {
    const ai = getClient();
    const prompt = `
      Sei un AI Trainer per la comunicazione strategica. Un utente ha ricevuto un messaggio e ha bisogno di aiuto per rispondere.
      
      - **Messaggio Ricevuto:** "${receivedMessage}"
      - **Obiettivo dell'Utente:** "${objective}"
      - **Contesto Aggiuntivo:** "${context || 'Nessun contesto aggiuntivo fornito.'}"
      - **Tono Strategico Richiesto:** ${tone}
      
      Genera una risposta in formato Markdown, strutturata esattamente come segue:
      
      # Proposta di Risposta
      
      ## Risposta Breve
      [Testo della risposta breve e concisa, adatta per chat veloci]
      
      ## Risposta Elaborata
      [Testo della risposta più dettagliata ed empatica, adatta per email o conversazioni importanti]
      
      ## Spiegazione della Strategia
      [Elenco puntato con 2-3 punti che spiegano PERCHÉ le risposte sono efficaci, collegandosi all'obiettivo dell'utente. Usa **asterischi** per evidenziare i concetti chiave.]
      
      La lingua deve essere l'italiano.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text;
};
