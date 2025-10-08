import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, ImprovementArea, VoiceAnalysisResult, VoiceScore, CommunicatorProfile } from '../types';

export const config = { runtime: 'nodejs', maxDuration: 60 };

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schemas and System Instructions (moved from client-side) ---

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: "Punteggio da 0 a 100 sull'efficacia della risposta." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Elenco di 2-3 punti di forza." },
        areasForImprovement: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    suggestion: { type: Type.STRING, description: "Consiglio specifico per migliorare." },
                    example: { type: Type.STRING, description: "Esempio pratico virgolettato." }
                },
                required: ["suggestion", "example"]
            },
            description: "Elenco di 2-3 aree di miglioramento con suggerimento ed esempio."
        },
        suggestedResponse: {
            type: Type.OBJECT,
            properties: {
                short: { type: Type.STRING, description: "Versione riscritta e concisa (1-2 frasi) con parole chiave in **doppi asterischi**." },
                long: { type: Type.STRING, description: "Versione più dettagliata e completa con parole chiave in **doppi asterischi**." }
            },
            required: ["short", "long"]
        }
    },
    required: ["score", "strengths", "areasForImprovement", "suggestedResponse"]
};

const paraverbalAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        scores: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    criterion_id: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    why: { type: Type.STRING }
                },
                required: ["criterion_id", "score", "why"]
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
                annotated_text: { type: Type.STRING },
                ideal_script: { type: Type.STRING }
            },
            required: ["instructions", "annotated_text", "ideal_script"]
        }
    },
    required: ["scores", "strengths", "improvements", "actions", "micro_drill_60s", "suggested_delivery"]
};

const communicatorProfileSchema = {
    type: Type.OBJECT,
    properties: {
        profileTitle: { type: Type.STRING },
        profileDescription: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["profileTitle", "profileDescription", "strengths", "areasToImprove"]
};


// --- Handler Logic ---

function setCorsHeaders(res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseJsonResponse(text: string): any {
    let jsonString = text.trim();
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    }
    return JSON.parse(jsonString);
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!process.env.API_KEY) {
        return res.status(500).json({ error: 'API_KEY not configured on the server.' });
    }
    
    try {
        const { analysisType, payload } = req.body;
        let data;

        switch (analysisType) {
            case 'analyzeResponse':
                data = await handleAnalyzeResponse(payload);
                break;
            case 'analyzeParaverbalResponse':
                data = await handleAnalyzeParaverbalResponse(payload);
                break;
            case 'generateCommunicatorProfile':
                data = await handleGenerateCommunicatorProfile(payload);
                break;
            default:
                return res.status(400).json({ error: 'Invalid analysisType' });
        }
        
        return res.status(200).json({ data });

    } catch (err: any) {
        console.error(`Error in /api/gemini (${req.body?.analysisType}):`, err);
        return res.status(500).json({ error: err.message || 'An internal server error occurred.' });
    }
}


// --- Analysis Functions ---

async function handleAnalyzeResponse(payload: any): Promise<AnalysisResult> {
    const { userResponse, scenario, task, isVerbal } = payload;
    const verbalContext = isVerbal ? "La risposta è verbale. Considera concisione e chiarezza. Ignora errori di trascrizione." : "La risposta è scritta. Analizzala per chiarezza, tono e struttura.";
    const systemInstruction = `Sei un coach di Comunicazione Efficace Strategica (CES). Analizza la risposta dell'utente in base a Chiarezza, Tono, Orientamento alla Soluzione, Assertività, Struttura. Fornisci un feedback costruttivo e personalizzato. Rispondi SEMPRE e solo in italiano e nel formato JSON richiesto.`;
    const prompt = `Scenario: ${scenario}\nCompito: ${task}\nRisposta utente: "${userResponse}"\nContesto: ${verbalContext}\nAnalizza la risposta e genera il feedback JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    return parseJsonResponse(response.text) as AnalysisResult;
}

async function handleAnalyzeParaverbalResponse(payload: any): Promise<VoiceAnalysisResult> {
    const { transcript, scenario, task } = payload;
    const systemInstruction = `Sei CES Coach Engine, modulo Voce Strategica. Valuta il paraverbale (ritmo, velocità, volume, tono, intonazione, dizione, enfasi, pause, disfluenze, allineamento strategico). Dà un feedback fermo, empatico e operativo. Rispondi SEMPRE e solo in italiano e nel formato JSON richiesto.`;
    const prompt = `Valuta la traccia vocale trascritta. Scenario: ${scenario}\nCompito: ${task}\nTrascrizione: "${transcript}"\nIstruzioni: Valuta ogni criterio da 1 a 10 con motivazione, usando gli ID specificati. Evidenzia 3 punti di forza e 3 aree di miglioramento. Suggerisci 3 azioni pratiche e 1 micro-drill. Fornisci una "consegna annotata" (con ☐ per pause, △ per enfasi) e un "ideal_script" ottimale. Genera l'output in JSON.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction,
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: paraverbalAnalysisSchema,
        },
    });

    return parseJsonResponse(response.text) as VoiceAnalysisResult;
}

async function handleGenerateCommunicatorProfile(payload: any): Promise<CommunicatorProfile> {
    const { analysisResults } = payload;
    const systemInstruction = `Sei un esperto di profilazione della comunicazione CES. Analizza una serie di esercizi e sintetizzali in un profilo conciso, incoraggiante e strategico, identificando pattern ricorrenti. Rispondi SEMPRE e solo in italiano e nel formato JSON richiesto.`;
    const formattedResults = analysisResults.map((r: any) =>
        `---\nEsercizio ID: ${r.exerciseId}\nPunteggio: ${r.analysis.score}\nPunti di Forza: ${r.analysis.strengths.join(', ')}\nAree di Miglioramento: ${r.analysis.areasForImprovement.map((a: any) => a.suggestion).join(', ')}\n---`
    ).join('\n');
    const prompt = `Dati i seguenti risultati di un check-up, genera un "Profilo del Comunicatore" in formato JSON:\n${formattedResults}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction,
            temperature: 0.8,
            responseMimeType: "application/json",
            responseSchema: communicatorProfileSchema,
        },
    });

    return parseJsonResponse(response.text) as CommunicatorProfile;
}
