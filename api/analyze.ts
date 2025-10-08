import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';

// Vercel Serverless Function Configuration
export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // Set timeout to 60 seconds
};

// Schemas define the exact JSON structure the AI must return.
// Copied from the original geminiService to keep them server-side.
const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: "Un punteggio da 0 a 100 che rappresenta l'efficacia complessiva." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Un elenco di 2-3 punti di forza." },
        areasForImprovement: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    suggestion: { type: Type.STRING, description: "Un consiglio specifico su cosa migliorare." },
                    example: { type: Type.STRING, description: "Una frase di esempio virgolettata." }
                },
                required: ["suggestion", "example"]
            },
        },
        suggestedResponse: {
            type: Type.OBJECT,
            properties: {
                short: { type: Type.STRING, description: "Una versione concisa e riscritta. Le parole chiave sono evidenziate con **doppi asterischi**." },
                long: { type: Type.STRING, description: "Una versione più dettagliata. Le parole chiave sono evidenziate con **doppi asterischi**." }
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
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                    criterion_id: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    why: { type: Type.STRING }
                }, required: ["criterion_id", "score", "why"]
            },
        },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
        actions: { type: Type.ARRAY, items: { type: Type.STRING } },
        micro_drill_60s: { type: Type.STRING },
        suggested_delivery: {
            type: Type.OBJECT, properties: {
                instructions: { type: Type.STRING },
                annotated_text: { type: Type.STRING, description: "Testo annotato con simboli per pause (☐) ed enfasi (△)." },
                ideal_script: { type: Type.STRING, description: "Versione ideale della risposta, pronta per la sintesi vocale." }
            }, required: ["instructions", "annotated_text", "ideal_script"]
        }
    },
    required: ["scores", "strengths", "improvements", "actions", "micro_drill_60s", "suggested_delivery"]
};

const communicatorProfileSchema = {
    type: Type.OBJECT,
    properties: {
        profileTitle: { type: Type.STRING, description: "Un titolo accattivante per il profilo, es: 'Il Diplomatico Pragmatico'." },
        profileDescription: { type: Type.STRING, description: "Una breve descrizione (2-3 frasi) dello stile di comunicazione." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Elenco di 2 punti di forza principali." },
        areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Elenco di 2 aree di miglioramento prioritarie." }
    },
    required: ["profileTitle", "profileDescription", "strengths", "areasToImprove"]
};

// Map analysis types to their configuration
const analysisConfigs = {
  text: { schema: analysisSchema },
  paraverbal: { schema: paraverbalAnalysisSchema },
  profile: { schema: communicatorProfileSchema },
};

// Prompt building functions
const buildTextPrompt = (payload: any) => {
    const { userResponse, scenario, task, isVerbalContext } = payload;
    const verbalContext = isVerbalContext
        ? "La risposta dell'utente è stata fornita verbalmente. Considera fattori come la concisione e la chiarezza adatti alla comunicazione parlata."
        : "La risposta dell'utente è stata scritta. Analizzala per chiarezza, tono e struttura.";
    return {
        prompt: `**Scenario:** ${scenario}\n**Compito:** ${task}\n**Risposta Utente:** "${userResponse}"\n**Contesto:** ${verbalContext}\nAnalizza la risposta secondo le direttive e genera il feedback in JSON.`,
        systemInstruction: `Sei un coach di Comunicazione Efficace Strategica (CES). Valuta le risposte in base a Chiarezza, Tono/Empatia, Orientamento alla Soluzione, Assertività, Struttura. Fornisci un'analisi incoraggiante e mirata esclusivamente nel formato JSON richiesto, in italiano.`
    };
};

const buildParaverbalPrompt = (payload: any) => {
    const { transcript, scenario, task } = payload;
    return {
        prompt: `Valuta la traccia vocale trascritta.\n**Scenario:** ${scenario}\n**Compito:** ${task}\n**Trascrizione:** "${transcript}"\nIstruzioni: Valuta ogni criterio paraverbale da 1 a 10 (usa gli ID: "pacing_breath", "speed", etc.). Evidenzia 3 punti di forza e 3 aree di miglioramento. Suggerisci 3 azioni pratiche e 1 micro-drill. Fornisci una "consegna annotata" con simboli ☐ (pausa) e △ (enfasi) e scrivi un "ideal_script" per la sintesi vocale. Genera l'output in JSON.`,
        systemInstruction: `Sei CES Coach Engine con il modulo Voce Strategica. Valuta il paraverbale (ritmo, velocità, volume, tono, intonazione, articolazione, enfasi, pause, disfluenze) per rendere il messaggio più efficace. Fornisci la tua analisi esclusivamente nel formato JSON richiesto, in italiano.`
    };
};

const buildProfilePrompt = (payload: any) => {
    const { analysisResults } = payload;
    const formattedResults = analysisResults.map((r: any) =>
        `---\nEsercizio ID: ${r.exerciseId}\nPunteggio: ${r.analysis.score}\nPunti di Forza: ${r.analysis.strengths.join(', ')}\nAree Miglioramento: ${r.analysis.areasForImprovement.map((a: any) => a.suggestion).join(', ')}\n---`
    ).join('\n');
    return {
        prompt: `Ho completato un check-up. Ecco un riassunto delle analisi:\n\n${formattedResults}\n\nBasandoti su questi dati, genera il mio "Profilo del Comunicatore" in formato JSON.`,
        systemInstruction: `Sei un esperto di profilazione della comunicazione. Analizza una serie di esercizi e sintetizzali in un profilo conciso, incoraggiante e strategico. Identifica i pattern ricorrenti. Fornisci la tua analisi esclusivamente nel formato JSON richiesto, in italiano.`
    };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Restrict in production
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { analysisType, payload } = req.body;

    if (!analysisType || !payload || !analysisConfigs[analysisType as keyof typeof analysisConfigs]) {
      return res.status(400).json({ error: 'Richiesta non valida. `analysisType` mancante o non valido.' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing GOOGLE_API_KEY on the server.' });
    }
    
    let promptData;
    switch(analysisType) {
        case 'text':
            promptData = buildTextPrompt(payload);
            break;
        case 'paraverbal':
            promptData = buildParaverbalPrompt(payload);
            break;
        case 'profile':
            promptData = buildProfilePrompt(payload);
            break;
        default:
             return res.status(400).json({ error: 'Invalid analysisType' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptData.prompt,
        config: {
            systemInstruction: promptData.systemInstruction,
            responseMimeType: "application/json",
            responseSchema: analysisConfigs[analysisType as keyof typeof analysisConfigs].schema,
            temperature: 0.8,
        },
    });

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      return res.status(502).json({
        error: `Risposta AI non completata (${finishReason})`,
        details: response.candidates?.[0]?.safetyRatings ?? null,
      });
    }
    
    const rawText = response.text;
    if (!rawText) {
        return res.status(502).json({ error: 'L\'API non ha restituito una risposta valida.' });
    }
    
    let data;
    try {
        data = JSON.parse(rawText.trim());
    } catch(e) {
        console.error("JSON Parsing Error:", e, "Raw Text:", rawText);
        return res.status(500).json({ error: 'Formato di risposta AI non valido (non JSON).'});
    }

    res.setHeader('Access-Control-Allow-Origin', '*'); // Restrict in production
    return res.status(200).json({ data });

  } catch (err: any) {
    console.error('ANALYZE_API_ERROR:', err);
    return res.status(500).json({ error: err.message || 'Errore interno del server.' });
  }
}
