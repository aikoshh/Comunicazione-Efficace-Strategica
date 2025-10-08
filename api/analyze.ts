import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, ImprovementArea, VoiceAnalysisResult, VoiceScore, CommunicatorProfile } from '../types';

// Vercel Serverless Function Configuration
export const config = {
  maxDuration: 60,
};

// Schemas for JSON response validation
const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.NUMBER,
            description: "Un punteggio da 0 a 100 che rappresenta l'efficacia complessiva della risposta dell'utente, basato sui criteri di valutazione forniti."
        },
        strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Un elenco di 2-3 punti che evidenziano ciò che l'utente ha fatto bene, in relazione ai criteri di valutazione."
        },
        areasForImprovement: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    suggestion: {
                        type: Type.STRING,
                        description: "Il consiglio specifico su cosa l'utente potrebbe migliorare, collegato a uno dei criteri di valutazione."
                    },
                    example: {
                        type: Type.STRING,
                        description: "Una frase di esempio virgolettata che mostra come applicare il suggerimento. Es: \"Invece di dire 'hai sbagliato', potresti dire 'ho notato che questo approccio ha portato a...'\""
                    }
                },
                required: ["suggestion", "example"]
            },
            description: "Un elenco di 2-3 punti su cosa l'utente potrebbe migliorare, ognuno con un suggerimento e un esempio pratico virgolettato."
        },
        suggestedResponse: {
            type: Type.OBJECT,
            properties: {
                short: {
                    type: Type.STRING,
                    description: "Una versione concisa e riscritta della risposta dell'utente (1-2 frasi). Le parole chiave importanti sono evidenziate con **doppi asterischi**."
                },
                long: {
                    type: Type.STRING,
                    description: "Eine detailliertere und vollständigere Version der Benutzerantwort, die die Prinzipien effektiver Kommunikation verkörpert. Wichtige Schlüsselwörter sind mit **doppelten Sternchen** hervorgehoben."
                }
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
            },
            description: "Un elenco di punteggi (da 1 a 10) per ciascuno dei 10 criteri paraverbali, con una breve motivazione per ogni punteggio."
        },
        strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Un elenco di esattamente 3 punti di forza paraverbali emersi dalla risposta."
        },
        improvements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Un elenco di esattamente 3 aree di miglioramento paraverbali."
        },
        actions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Un elenco di esattamente 3 azioni pratiche e concrete che l'utente può intraprendere per migliorare."
        },
        micro_drill_60s: {
            type: Type.STRING,
            description: "Un micro-esercizio specifico e immediato, della durata massima di 60 secondi, per lavorare su uno dei punti deboli."
        },
        suggested_delivery: {
            type: Type.OBJECT,
            properties: {
                instructions: { type: Type.STRING },
                annotated_text: { type: Type.STRING, description: "Il testo della risposta dell'utente, arricchito con simboli per indicare pause (☐) ed enfasi (△)." },
                ideal_script: { type: Type.STRING, description: "La versione ideale della risposta dell'utente, riscritta per essere pronunciata in modo ottimale. Questo testo verrà usato per la sintesi vocale." }
            },
            required: ["instructions", "annotated_text", "ideal_script"]
        }
    },
    required: ["scores", "strengths", "improvements", "actions", "micro_drill_60s", "suggested_delivery"]
};

const communicatorProfileSchema = {
    type: Type.OBJECT,
    properties: {
        profileTitle: {
            type: Type.STRING,
            description: "Un titolo accattivante e descrittivo per il profilo del comunicatore, ad esempio 'Il Diplomatico Pragmatico' o 'L'Analista Empatico'. Deve essere breve e d'impatto."
        },
        profileDescription: {
            type: Type.STRING,
            description: "Una breve descrizione (2-3 frasi) dello stile di comunicazione prevalente dell'utente, basata sulle sue risposte."
        },
        strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Un elenco di esattamente 2 punti di forza principali emersi dalle analisi."
        },
        areasToImprove: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Un elenco di esattamente 2 aree di miglioramento prioritarie su cui l'utente dovrebbe concentrarsi."
        }
    },
    required: ["profileTitle", "profileDescription", "strengths", "areasToImprove"]
};

function jsonError(res: VercelResponse, status: number, error: string, details?: any) {
  return res.status(status).json({ error, ...(details ? { details } : {}) });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*'); // Should be restricted in production
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method Not Allowed');
  }

  try {
    const { analysisType, payload } = req.body || {};
    if (!analysisType || !payload) {
      return jsonError(res, 400, 'Request body must contain `analysisType` and `payload`.');
    }

    if (!process.env.API_KEY) {
      return jsonError(res, 500, 'API_KEY is not configured on the server.');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let systemInstruction: string = '';
    let prompt: string = '';
    let schema: any;

    switch (analysisType) {
        case 'text':
            const { userResponse, scenario, task, isVerbalContext } = payload;
            systemInstruction = `
              Sei un coach di Comunicazione Efficace Strategica (CES) di livello mondiale. Il tuo ruolo è analizzare le risposte degli utenti a scenari di comunicazione complessi e fornire un feedback dettagliato, costruttivo e personalizzato. Rispondi SEMPRE e solo in italiano.
              Valuta ogni risposta in base ai seguenti criteri chiave: Chiarezza e Concisinza, Tono ed Empatia, Orientamento alla Soluzione, Assertività, Struttura.
              Basa il tuo punteggio (score) su una valutazione olistica di questi criteri. Non dare sempre lo stesso punteggio.
              Le tue analisi devono essere incoraggianti e mirate ad aiutare l'utente a migliorare concretamente. Fornisci la tua analisi esclusivamente nel formato JSON richiesto.
            `;
            prompt = `
              **Scenario:** ${scenario}
              **Compito dell'utente:** ${task}
              **Risposta dell'utente:** "${userResponse}"
              **Contesto di analisi:** ${isVerbalContext ? "La risposta dell'utente è stata fornita verbalmente." : "La risposta dell'utente è stata scritta."}
              Analizza la risposta dell'utente secondo le direttive fornite e genera il feedback strutturato in formato JSON.
            `;
            schema = analysisSchema;
            break;
            
        case 'paraverbal':
            const { transcript, scenario: pScenario, task: pTask } = payload;
            systemInstruction = `
              Sei CES Coach Engine esteso con il modulo Voce Strategica (Paraverbale). Valuta e allena il paraverbale per rendere più efficace il messaggio secondo i principi della Comunicazione Efficace Strategica®.
              Valuta: Respirazione & ritmo, Velocità, Volume, Tono/Timbro & Calore, Intonazione & Melodia, Articolazione & Dizione, Enfasi strategica, Pause strategiche, Disfluenze & filler, Allineamento con intento strategico.
              Stile del feedback: fermo, empatico, strategico. Linguaggio operativo, non giudicante.
              Sii rigoroso nella valutazione. Se un criterio è sotto 6, deve essere considerato un'area di miglioramento.
              Fornisci la tua analisi esclusivamente nel formato JSON richiesto.
            `;
            prompt = `
              Valuta la seguente traccia vocale (trascritta) e genera un feedback operativo.
              **Scenario:** ${pScenario}
              **Compito dell'utente:** ${pTask}
              **Trascrizione della risposta dell'utente:** "${transcript}"
              Istruzioni:
              1. Valuta ogni criterio da 1 a 10. Per 'criterion_id', USA ESATTAMENTE uno dei seguenti: "pacing_breath", "speed", "volume", "tone_warmth", "intonation", "articulation", "emphasis", "pauses", "disfluencies", "strategy_alignment".
              2. Evidenzia 3 punti di forza e 3 aree da migliorare.
              3. Suggerisci 3 azioni pratiche e 1 micro-drill (≤60s).
              4. Fornisci una "consegna annotata" con simboli: ☐ (pausa), △ (enfasi).
              5. Scrivi un "ideal_script" per sintesi vocale.
              Genera l'output in formato JSON.
            `;
            schema = paraverbalAnalysisSchema;
            break;
            
        case 'profile':
            const { analysisResults } = payload;
            systemInstruction = `
              Sei un esperto di profilazione della comunicazione basato sulla metodologia CES. Il tuo compito è analizzare una serie di analisi di esercizi di check-up e sintetizzarle in un profilo di comunicazione conciso, incoraggiante e strategico.
              Identifica i pattern ricorrenti, sia positivi che negativi, per delineare uno stile di comunicazione complessivo.
              Fornisci la tua analisi esclusivamente nel formato JSON richiesto, in italiano.
            `;
            const formattedResults = (analysisResults || []).map((r: any) => `
              ---
              Esercizio ID: ${r.exerciseId}, Punteggio: ${r.analysis.score}
              Punti di Forza: ${r.analysis.strengths.join(', ')}
              Aree di Miglioramento: ${r.analysis.areasForImprovement.map((a: any) => a.suggestion).join(', ')}
              ---
            `).join('\n');
            prompt = `
              Ho completato un check-up di comunicazione. Ecco un riassunto delle analisi:
              ${formattedResults}
              Basandoti su questi dati, genera il mio "Profilo del Comunicatore" in formato JSON.
            `;
            schema = communicatorProfileSchema;
            break;
            
        default:
            return jsonError(res, 400, 'Invalid `analysisType`.');
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) {
        return jsonError(res, 502, 'API did not return text content.');
    }
    
    let data: any;
    try {
        data = JSON.parse(text.trim());
    } catch(e) {
        console.error("Failed to parse JSON from Gemini:", text);
        return jsonError(res, 500, 'Invalid JSON format received from analysis service.');
    }

    return res.status(200).json({ data });

  } catch (err: any) {
    console.error('ANALYZE API ERROR:', err.stack || err);
    return jsonError(res, 500, err.message || 'An internal server error occurred.');
  }
}
