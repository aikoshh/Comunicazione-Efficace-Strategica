import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.INTEGER,
            description: "Punteggio da 0 a 100 che valuta l'efficacia complessiva della risposta dell'utente."
        },
        strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Elenco puntato dei punti di forza della risposta dell'utente."
        },
        areasForImprovement: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    suggestion: {
                        type: Type.STRING,
                        description: "Un suggerimento specifico e costruttivo per migliorare."
                    },
                    example: {
                        type: Type.STRING,
                        description: "Un esempio pratico che mostra come applicare il suggerimento."
                    }
                },
                required: ['suggestion', 'example']
            },
            description: "Elenco delle aree in cui l'utente può migliorare, con suggerimenti ed esempi."
        },
        suggestedResponse: {
            type: Type.OBJECT,
            properties: {
                short: {
                    type: Type.STRING,
                    description: "Una versione breve e concisa della risposta ideale, con parole chiave in grassetto (usando markdown **parola**)."
                },
                long: {
                    type: Type.STRING,
                    description: "Una versione più lunga e dettagliata della risposta ideale, con parole chiave in grassetto (usando markdown **parola**)."
                }
            },
            required: ['short', 'long']
        }
    },
    required: ['score', 'strengths', 'areasForImprovement', 'suggestedResponse']
};


export const analyzeResponse = async (
  userResponse: string,
  scenario: string,
  task: string,
  isVerbal: boolean,
): Promise<AnalysisResult> => {
  try {
    const ai = getAI();

    const verbalContext = isVerbal 
        ? "La risposta dell'utente è stata fornita verbalmente. Considera fattori come la concisione e la chiarezza adatti alla comunicazione parlata. Ignora eventuali errori di trascrizione o di battitura."
        : "La risposta dell'utente è stata scritta. Analizzala per chiarezza, tono e struttura come faresti con un testo scritto.";

    const systemInstruction = `
      Sei un coach di Comunicazione Efficace Strategica (CES) di livello mondiale. Il tuo ruolo è analizzare le risposte degli utenti a scenari di comunicazione complessi e fornire un feedback dettagliato, costruttivo e personalizzato. Rispondi SEMPRE e solo in italiano.

      Valuta ogni risposta in base ai seguenti criteri chiave:
      1.  **Chiarezza e Concisinza**: La risposta è diretta, facile da capire e priva di ambiguità?
      2.  **Tono ed Empatia**: Il tono è appropriato per lo scenario? Dimostra comprensione e rispetto per l'altra persona?
      3.  **Orientamento alla Soluzione**: La risposta si concentra sulla risoluzione del problema o sul raggiungimento di un obiettivo costruttivo, invece che sulla colpa?
      4.  **Assertività**: L'utente esprime i propri bisogni o punti di vista in modo chiaro e rispettoso, senza essere passivo o aggressivo?
      5.  **Struttura**: La comunicazione segue una logica chiara (es. descrivere i fatti, esprimere l'impatto, proporre una soluzione)?
      
      Le tue analisi devono essere incoraggianti e mirate ad aiutare l'utente a migliorare concretamente. Devi fornire l'analisi compilando lo schema JSON richiesto.
    `;
    
    const prompt = `
      **Scenario:** ${scenario}
      **Compito dell'utente:** ${task}
      **Risposta dell'utente:** "${userResponse}"
      **Contesto di analisi:** ${verbalContext}

      Analizza la risposta dell'utente e fornisci una valutazione completa seguendo lo schema JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("Il modello non ha generato un'analisi valida.");
    }
    
    const result = JSON.parse(jsonText) as AnalysisResult;

    if (typeof result.score !== 'number' || !Array.isArray(result.strengths) || !result.suggestedResponse) {
        console.error("Analisi non valida ricevuta dal modello:", result);
        throw new Error("Il formato dell'analisi ricevuta non è corretto.");
    }

    return result;

  } catch (error: any) {
    console.error("Errore durante l'analisi della risposta con Gemini:", error);
    if (error.message && error.message.toLowerCase().includes('api key')) {
         throw new Error("API_KEY non valida o mancante. Controlla la configurazione del tuo ambiente.");
    }
    if (error instanceof SyntaxError) {
        throw new Error("Impossibile interpretare l'analisi del modello. Il formato non è corretto.");
    }
    throw new Error(error.message || "Impossibile ottenere l'analisi dal servizio. Riprova più tardi.");
  }
};
