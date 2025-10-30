// services/geminiService.ts
// FIX: Populating the full content of the missing geminiService.ts file.
import { GoogleGenAI, Type } from "@google/genai";
import { FALLBACK_API_KEY } from '../config';
import { 
    PersonalizationData, 
    AnalysisResult, 
    CommunicatorProfile, 
    VoiceAnalysisResult,
    ChatMessage,
    ResponseStyle,
    Exercise,
} from '../types';

let API_KEY = process.env.API_KEY;

// If the env var is not set OR it looks invalid, use the fallback.
if (!API_KEY || !API_KEY.startsWith('AIza')) {
    API_KEY = FALLBACK_API_KEY;
}

// Now do the final check and throw if the fallback is also bad.
if (!API_KEY || !API_KEY.startsWith('AIza')) { // Basic check for a valid key format
    throw new Error('API_KEY is not configured correctly. Please check your environment variables or config.ts');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-pro'; // Use pro for high-quality analysis
const flashModel = 'gemini-2.5-flash'; // Use flash for faster, simpler tasks

const detailedRubricSchema = {
    type: Type.OBJECT,
    properties: {
        criterion: { type: Type.STRING },
        score: { type: Type.NUMBER },
        justification: { type: Type.STRING },
    },
    required: ['criterion', 'score', 'justification']
};

const areaForImprovementSchema = {
    type: Type.OBJECT,
    properties: {
        suggestion: { type: Type.STRING },
        example: { type: Type.STRING },
    },
    required: ['suggestion', 'example']
};

const analysisResultSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: 'Overall score from 0 to 100.' },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        areasForImprovement: { type: Type.ARRAY, items: areaForImprovementSchema },
        suggestedResponse: {
            type: Type.OBJECT,
            properties: {
                short: { type: Type.STRING },
                long: { type: Type.STRING },
            },
            required: ['short', 'long']
        },
        detailedRubric: {
            type: Type.ARRAY,
            items: detailedRubricSchema
        }
    },
    required: ['score', 'strengths', 'areasForImprovement', 'suggestedResponse', 'detailedRubric']
};

const voiceAnalysisScoreSchema = {
    type: Type.OBJECT,
    properties: {
        criterion_id: { type: Type.STRING, enum: ['ritmo', 'tono', 'volume', 'pause', 'chiarezza'] },
        score: { type: Type.NUMBER },
        justification: { type: Type.STRING },
    },
    required: ['criterion_id', 'score', 'justification']
};

const voiceAnalysisResultSchema = {
    type: Type.OBJECT,
    properties: {
        scores: { type: Type.ARRAY, items: voiceAnalysisScoreSchema },
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
            required: ['instructions', 'ideal_script', 'annotated_text']
        },
    },
    required: ['scores', 'strengths', 'improvements', 'actions', 'micro_drill_60s', 'suggested_delivery']
};


const generateAndParse = async (prompt: string, schema: any, selectedModel: string = model): Promise<any> => {
    try {
        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.5,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e: any) {
        console.error("Gemini API call failed:", e);
        throw new Error("L'analisi AI non è riuscita. Riprova. Dettaglio: " + e.message);
    }
}

export const analyzeWrittenResponse = async (exercise: { title: string, scenario: string, task: string }, userResponse: string, isPro: boolean): Promise<AnalysisResult> => {
    const proRubric = isPro 
        ? `Fornisci anche una "detailedRubric" con 5 criteri: Chiarezza, Orientamento alla Soluzione, Assertività, Empatia, Struttura. Per ogni criterio, dai un punteggio da 0 a 10 e una breve giustificazione.`
        : `Il campo "detailedRubric" deve essere un array vuoto [].`;
    
    const prompt = `
        Sei un coach di comunicazione strategica. Analizza la risposta di un utente a un esercizio.
        
        Esercizio:
        - Titolo: ${exercise.title}
        - Scenario: ${exercise.scenario}
        - Compito: ${exercise.task}

        Risposta dell'utente:
        "${userResponse}"

        Fornisci un'analisi completa in formato JSON.
        - "score": un punteggio generale da 0 a 100. Sii critico, un punteggio di 100 è quasi irraggiungibile.
        - "strengths": un array di 2-3 punti di forza specifici.
        - "areasForImprovement": un array di 2-3 aree di miglioramento. Per ciascuna, fornisci un "suggestion" (es. "Sii più specifico") e un "example" (un breve esempio di come applicare il suggerimento).
        - "suggestedResponse": fornisci due versioni di una risposta ideale. "short" per una versione concisa e "long" per una versione più elaborata e dettagliata. Evidenzia le parole chiave in grassetto usando markdown (**parola**).
        - ${proRubric}
    `;
    return generateAndParse(prompt, analysisResultSchema);
};

export const analyzeVerbalResponse = async (exercise: { title: string, scenario: string, task: string }, transcript: string): Promise<VoiceAnalysisResult> => {
    const prompt = `
        Sei un coach esperto in comunicazione paraverbale. Analizza la trascrizione di una risposta vocale di un utente a un esercizio.
        
        Esercizio:
        - Titolo: ${exercise.title}
        - Scenario: ${exercise.scenario}
        - Compito: ${exercise.task}

        Trascrizione della risposta dell'utente:
        "${transcript}"

        Basandoti SOLO sulla trascrizione, inferisci le qualità paraverbali. Fornisci un'analisi completa in formato JSON.
        - "scores": un array di 5 oggetti, uno per ogni criterio: 'ritmo', 'tono', 'volume', 'pause', 'chiarezza'. Ogni oggetto deve avere "criterion_id", un "score" da 0 a 10 e una "justification" che spiega il punteggio basandosi sulle parole usate.
        - "strengths": un array di 2-3 punti di forza paraverbali inferiti dal testo.
        - "improvements": un array di 2-3 aree di miglioramento paraverbali.
        - "actions": un array di 2 azioni pratiche e concrete che l'utente può fare per migliorare.
        - "micro_drill_60s": un esercizio pratico di 60 secondi per migliorare un'area chiave.
        - "suggested_delivery":
            - "instructions": brevi istruzioni su come leggere la versione ideale (es. "Leggi con un tono calmo ma deciso, facendo una pausa prima delle parole chiave...").
            - "ideal_script": la trascrizione della risposta ideale.
            - "annotated_text": lo stesso "ideal_script", ma con simboli per pause (☐) ed enfasi (△) inseriti nel testo per guidare la lettura.
    `;
    return generateAndParse(prompt, voiceAnalysisResultSchema);
};


export const generateCustomExercise = async (data: PersonalizationData): Promise<{ scenario: string, task: string }> => {
    const prompt = `
        Crea uno scenario di comunicazione realistico e una task specifica per un esercizio di allenamento, basato su questo profilo utente:
        - Professione: ${data.professione}
        - Livello Carriera: ${data.livelloCarriera}
        - Età: ${data.eta}
        - Contesto Tipico: ${data.contestoComunicativo}
        - Sfida Principale: ${data.sfidaPrincipale}

        Lo scenario deve essere plausibile per il profilo. La task deve essere una richiesta chiara di cosa l'utente deve fare o dire.
        Rispondi in formato JSON con i campi "scenario" e "task".
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            scenario: { type: Type.STRING },
            task: { type: Type.STRING },
        },
        required: ['scenario', 'task']
    };
    return generateAndParse(prompt, schema, flashModel);
};

export const generateCommunicatorProfile = async (responses: { exerciseTitle: string, userResponse: string }[]): Promise<CommunicatorProfile> => {
    const responsesString = responses.map(r => `- Esercizio "${r.exerciseTitle}": "${r.userResponse}"`).join('\n');
    const prompt = `
        Analizza le seguenti risposte di un utente a tre diversi scenari di comunicazione. 
        ${responsesString}
        
        Sintetizza queste risposte per creare un profilo di comunicatore. Identifica pattern ricorrenti nel suo stile.
        Rispondi in formato JSON.
        - "profileTitle": un titolo accattivante per il profilo (es. "Il Diplomatico Pragmatico", "L'Analista Cauto").
        - "profileDescription": una descrizione di 2-3 frasi del suo stile di comunicazione generale.
        - "strengths": un array di 2-3 punti di forza evidenti.
        - "areasToImprove": un array di 2-3 aree chiave su cui l'utente dovrebbe concentrarsi per migliorare.
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            profileTitle: { type: Type.STRING },
            profileDescription: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['profileTitle', 'profileDescription', 'strengths', 'areasToImprove']
    };
    return generateAndParse(prompt, schema);
};

export const continueStrategicChat = async (history: ChatMessage[], situation: string, goal: string, personaStyle: ResponseStyle): Promise<{ personaResponse: string, coachFeedback: string }> => {
    const chatHistory = history.map(m => `${m.role === 'user' ? 'Utente' : 'Interlocutore'}: ${m.content}`).join('\n');
    
    const prompt = `
        Sei un simulatore di conversazione avanzato. Interpreti due ruoli: un interlocutore e un coach AI.
        
        CONTESTO:
        - Situazione: ${situation}
        - Obiettivo dell'utente: ${goal}
        - Stile dell'interlocutore: ${personaStyle}.

        STORICO CHAT:
        ${chatHistory}

        L'utente ha appena scritto: "${history[history.length - 1].content}"

        COMPITO:
        Rispondi in formato JSON con due campi:
        1. "personaResponse": La risposta dell'interlocutore, agendo secondo lo stile "${personaStyle}". La risposta deve essere realistica e portare avanti la conversazione.
        2. "coachFeedback": Un feedback conciso (1-2 frasi) sull'ultimo messaggio dell'utente, valutando la sua efficacia rispetto all'obiettivo.
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            personaResponse: { type: Type.STRING },
            coachFeedback: { type: Type.STRING },
        },
        required: ['personaResponse', 'coachFeedback']
    };
    return generateAndParse(prompt, schema);
};

export const generateSuggestedResponse = async (exercise: Pick<Exercise, 'scenario' | 'task'>): Promise<string> => {
    const prompt = `
        Sei un esperto di comunicazione strategica. Fornisci una risposta ideale e ben strutturata per il seguente esercizio.
        La tua risposta deve essere solo il testo della comunicazione che l'utente dovrebbe scrivere/dire, senza alcuna meta-analisi, commenti, o prefissi come "Ecco la risposta:".

        Esercizio:
        - Scenario: ${exercise.scenario}
        - Compito: ${exercise.task}
    `;

    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: prompt,
            config: { temperature: 0.6 }
        });
        return response.text.trim();
    } catch (e: any) {
        console.error("Gemini suggestion generation failed:", e);
        throw new Error("La generazione del suggerimento non è riuscita. Riprova. Dettaglio: " + e.message);
    }
};

export const generateChatSuggestion = async (history: ChatMessage[], situation: string, goal: string): Promise<string> => {
    const chatHistory = history.map(m => `${m.role === 'user' ? 'Utente' : 'Interlocutore'}: ${m.content}`).join('\n');
    
    const prompt = `
        Sei un coach di comunicazione strategica. Stai aiutando un utente in una simulazione di chat.
        
        CONTESTO:
        - Situazione: ${situation}
        - Obiettivo dell'utente: ${goal}

        STORICO CHAT:
        ${chatHistory}

        COMPITO:
        Suggerisci la prossima risposta ideale che l'utente dovrebbe scrivere per proseguire la conversazione in modo efficace verso il suo obiettivo.
        Fornisci solo il testo della risposta suggerita, senza prefissi, commenti o virgolette.
    `;

    try {
        const response = await ai.models.generateContent({
            model: flashModel,
            contents: prompt,
            config: { temperature: 0.7 }
        });
        return response.text.trim();
    } catch (e: any) {
        console.error("Gemini chat suggestion failed:", e);
        throw new Error("La generazione del suggerimento non è riuscita. Riprova. Dettaglio: " + e.message);
    }
};