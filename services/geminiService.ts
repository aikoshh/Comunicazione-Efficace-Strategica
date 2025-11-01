// services/geminiService.ts
// FIX: Create full content for the Gemini service file.
import { GoogleGenAI, Type } from "@google/genai";
import { FALLBACK_API_KEY } from '../config';
import {
  Exercise,
  AnalysisResult,
  VoiceAnalysisResult,
  PersonalizationData,
  CommunicatorProfile,
  ResponseStyle,
  StrategicResponse,
  ContinuedStrategicResponse,
} from '../types';

// The app will handle errors if the key is missing.
const getGenAI = () => new GoogleGenAI({ apiKey: (process.env.API_KEY || FALLBACK_API_KEY) as string });

// Helper to safely parse JSON from Gemini response
const parseJson = <T>(jsonString: string, typeName: string): T => {
    try {
        // The model sometimes returns JSON wrapped in markdown ```json ... ```
        const cleanJsonString = jsonString.replace(/^```json\s*|```\s*$/g, '').trim();
        return JSON.parse(cleanJsonString);
    } catch (error) {
        console.error(`Error parsing ${typeName} JSON:`, error);
        console.error("Original string from model:", jsonString);
        throw new Error(`Failed to parse ${typeName} from the model's response.`);
    }
};

const getModel = () => 'gemini-2.5-flash';

export const analyzeWrittenResponse = async (exercise: Exercise, userResponse: string, isPro: boolean): Promise<AnalysisResult> => {
    const ai = getGenAI();
    
    const proRubricSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                criterion: { type: Type.STRING, description: "Criterio di valutazione (es. Chiarezza, Tono, Orientamento alla Soluzione, Assertività, Struttura)." },
                score: { type: Type.INTEGER, description: "Punteggio da 0 a 10." },
                justification: { type: Type.STRING, description: "Motivazione concisa del punteggio." }
            }
        }
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.INTEGER, description: "Punteggio complessivo da 0 a 100." },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array di 2-3 punti di forza." },
            areasForImprovement: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        suggestion: { type: Type.STRING, description: "Suggerimento per migliorare." },
                        example: { type: Type.STRING, description: "Esempio pratico di come applicare il suggerimento." }
                    }
                },
                description: "Array di 2-3 aree di miglioramento con suggerimenti ed esempi."
            },
            suggestedResponse: {
                type: Type.OBJECT,
                properties: {
                    short: { type: Type.STRING, description: "Versione sintetica della risposta ideale." },
                    long: { type: Type.STRING, description: "Versione elaborata e dettagliata della risposta ideale, con motivazioni." }
                }
            },
            ...(isPro && { detailedRubric: proRubricSchema })
        }
    };

    const prompt = `
        Sei un coach esperto di Comunicazione Efficace e Strategica. Analizza la risposta fornita da un utente a un esercizio.
        Scenario: "${exercise.scenario}"
        Compito: "${exercise.task}"
        Risposta dell'utente: "${userResponse}"
        
        Fornisci un'analisi dettagliata in formato JSON. Valuta la risposta in base a chiarezza, assertività, empatia e orientamento alla soluzione.
        Il feedback deve essere costruttivo, incoraggiante e specifico.
        ${isPro ? "Includi anche la 'detailedRubric' con 5 criteri: Chiarezza, Tono, Soluzione, Assertività, Struttura." : ""}
        Tutto il testo deve essere in italiano.
    `;

    const response = await ai.models.generateContent({
        model: getModel(),
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    return parseJson<AnalysisResult>(response.text, 'AnalysisResult');
};

export const analyzeVerbalResponse = async (exercise: Exercise, transcript: string): Promise<VoiceAnalysisResult> => {
    const ai = getGenAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            scores: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        criterion_id: { type: Type.STRING, description: "'ritmo', 'tono', 'volume', 'pause', 'chiarezza'." },
                        score: { type: Type.INTEGER, description: "Punteggio da 0 a 10." },
                        justification: { type: Type.STRING, description: "Motivazione del punteggio." }
                    }
                }
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array di 2-3 punti di forza paraverbali." },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array di 2-3 aree di miglioramento paraverbali." },
            actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array di 2-3 azioni pratiche che l'utente può fare." },
            micro_drill_60s: { type: Type.STRING, description: "Un esercizio pratico di 60 secondi per migliorare un aspetto chiave." },
            suggested_delivery: {
                type: Type.OBJECT,
                properties: {
                    instructions: { type: Type.STRING, description: "Istruzioni su come consegnare la risposta ideale (tono, ritmo, pause)." },
                    ideal_script: { type: Type.STRING, description: "Il testo pulito della risposta ideale, da usare per text-to-speech." },
                    annotated_text: { type: Type.STRING, description: "Il testo della risposta ideale, annotato con simboli per pause (☐) ed enfasi (△)." }
                }
            }
        }
    };
    
    const prompt = `
        Sei un coach vocale esperto. Analizza la trascrizione di una risposta vocale a un esercizio. Valuta gli aspetti paraverbali basandoti sul testo.
        Scenario: "${exercise.scenario}"
        Compito: "${exercise.task}"
        Trascrizione della risposta: "${transcript}"
        
        Fornisci un'analisi dettagliata in JSON. Valuta i 5 criteri: ritmo, tono, volume, pause e chiarezza.
        Simula una valutazione basata sul contenuto del testo (es. frasi brevi e dirette = ritmo deciso; parole gentili = tono empatico).
        Tutto il testo deve essere in italiano.
    `;

    const response = await ai.models.generateContent({
        model: getModel(),
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    return parseJson<VoiceAnalysisResult>(response.text, 'VoiceAnalysisResult');
};

export const generateSuggestedResponse = async (exercise: Exercise): Promise<string> => {
    const ai = getGenAI();
    const prompt = `
        Sei un esperto di comunicazione. Fornisci una risposta ideale per il seguente esercizio. La risposta deve essere un buon esempio di comunicazione efficace e strategica.
        Scenario: "${exercise.scenario}"
        Compito: "${exercise.task}"
        Fornisci solo il testo della risposta, senza commenti aggiuntivi.
    `;
    
    const response = await ai.models.generateContent({
        model: getModel(),
        contents: prompt
    });

    return response.text.trim();
};

export const generateCustomExercise = async (data: PersonalizationData): Promise<{ scenario: string, task: string }> => {
    const ai = getGenAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            scenario: { type: Type.STRING, description: "Lo scenario dettagliato (2-3 frasi)." },
            task: { type: Type.STRING, description: "Il compito specifico per l'utente (1 frase)." }
        }
    };
    
    const prompt = `
        Crea un esercizio di comunicazione personalizzato basato sui seguenti dati utente.
        - Professione: ${data.professione}
        - Livello Carriera: ${data.livelloCarriera}
        - Età: ${data.eta}
        - Contesto Tipico: ${data.contestoComunicativo}
        - Sfida Principale: ${data.sfidaPrincipale}
        
        Genera uno scenario realistico e un compito specifico che aiuti l'utente a praticare la sua sfida principale nel suo contesto lavorativo.
        Lo scenario deve essere una situazione plausibile, il compito deve essere una richiesta chiara di cosa dire o scrivere.
        Fornisci la risposta in formato JSON. Tutto il testo in italiano.
    `;
    
    const response = await ai.models.generateContent({
        model: getModel(),
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });

    return parseJson<{ scenario: string, task: string }>(response.text, 'CustomExercise');
};

export const generateCommunicatorProfile = async (responses: { exerciseTitle: string, userResponse: string }[]): Promise<CommunicatorProfile> => {
    const ai = getGenAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            profileTitle: { type: Type.STRING, description: "Un titolo accattivante per il profilo (es. 'Il Mediatore Pragmatico')." },
            profileDescription: { type: Type.STRING, description: "Una descrizione di 2-3 frasi del profilo di comunicazione." },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array di 2-3 punti di forza." },
            areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array di 2-3 aree chiave su cui lavorare." }
        }
    };
    
    const userResponsesString = responses.map(r => `Esercizio "${r.exerciseTitle}":\nRisposta: "${r.userResponse}"`).join('\n\n');

    const prompt = `
        Sei un profiler esperto in stili di comunicazione. Analizza le seguenti risposte a tre scenari diversi e crea un profilo del comunicatore.
        ${userResponsesString}
        
        Identifica uno stile comunicativo emergente, i punti di forza e le aree di miglioramento più evidenti.
        Fornisci la risposta in JSON. Tutto il testo in italiano.
    `;
    
    const response = await ai.models.generateContent({
        model: getModel(),
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });
    
    return parseJson<CommunicatorProfile>(response.text, 'CommunicatorProfile');
};

export const getStrategicResponse = async (userInput: string, style: ResponseStyle, history: { user: string, assistant: string }[], context?: string, objective?: string): Promise<StrategicResponse> => {
    const ai = getGenAI();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            analysis: { type: Type.STRING, description: "Analisi strategica della situazione e del messaggio ricevuto." },
            suggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, description: "Tipo di risposta: 'assertiva', 'empatica', 'chiarificatrice', 'strategica'." },
                        response: { type: Type.STRING, description: "La bozza di risposta suggerita." }
                    }
                }
            }
        }
    };

    const contextPrompt = context ? `Contesto fornito dall'utente: "${context}"` : '';
    const objectivePrompt = objective ? `Obiettivo dell'utente: "${objective}"` : '';
    
    const prompt = `
        Sei un coach di comunicazione strategica. L'utente ha ricevuto un messaggio e ha bisogno del tuo aiuto per rispondere.
        ${contextPrompt}
        ${objectivePrompt}
        Messaggio ricevuto dall'utente: "${userInput}"
        
        Il tuo compito è:
        1. Analizzare la situazione e gli obiettivi nascosti nel messaggio, tenendo conto del contesto e dell'obiettivo forniti.
        2. Fornire 4 bozze di risposta alternative: una assertiva, una empatica, una chiarificatrice e una strategica.
        3. Per la risposta 'strategica', prima fai una breve riformulazione di quanto detto dall'interlocutore, poi poni una domanda dicotomica che offra due possibili percorsi (es. "Da quello che capisco, la priorità è X. Vorresti che ci concentrassimo prima su A o su B?").
        4. Mantieni uno stile professionale e orientato all'obiettivo.
        
        Fornisci l'output in JSON. Tutto in italiano.
    `;

    const response = await ai.models.generateContent({
        model: getModel(),
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });

    return parseJson<StrategicResponse>(response.text, 'StrategicResponse');
};

export const continueWithPersona = async (
    originalInput: string,
    chosenResponse: string,
    history: { user: string, assistant: string }[],
    context?: string,
    objective?: string
): Promise<ContinuedStrategicResponse> => {
    const ai = getGenAI();
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            personaResponse: { type: Type.STRING, description: "La probabile risposta della persona che ha inviato il messaggio originale." },
            analysis: { type: Type.STRING, description: "La tua nuova analisi strategica basata sulla risposta della persona." },
            suggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, description: "Tipo di risposta: 'assertiva', 'empatica', 'chiarificatrice', 'strategica'." },
                        response: { type: Type.STRING, description: "La nuova bozza di risposta suggerita." }
                    }
                }
            }
        }
    };
    
    const contextPrompt = context ? `Contesto iniziale della conversazione: "${context}"` : '';
    const objectivePrompt = objective ? `Obiettivo iniziale dell'utente: "${objective}"` : '';

    const prompt = `
        Sei un coach di comunicazione e simulatore di conversazioni.
        ${contextPrompt}
        ${objectivePrompt}
        Contesto: un utente ha ricevuto questo messaggio: "${originalInput}"
        L'utente ha scelto di rispondere così: "${chosenResponse}"

        Il tuo compito è duplice:
        1. Simula la risposta della persona che ha inviato il messaggio originale. Sii realistico e coerente con il tono iniziale e il contesto. Chiama questa risposta "personaResponse".
        2. Dopo aver simulato la risposta, agisci di nuovo come coach: analizza la nuova situazione e fornisci 4 nuove bozze di risposta (assertiva, empatica, ecc.). Per la risposta 'strategica', prima fai una breve riformulazione, poi poni una domanda dicotomica (A o B) per guidare la conversazione.

        Fornisci l'output in JSON. Tutto in italiano.
    `;

    const response = await ai.models.generateContent({
        model: getModel(),
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });
    
    return parseJson<ContinuedStrategicResponse>(response.text, 'ContinuedStrategicResponse');
};
