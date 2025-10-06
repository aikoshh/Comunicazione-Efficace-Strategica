import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, ImprovementArea } from '../types';

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("La variabile d'ambiente API_KEY non è impostata. Per favore, imposta la variabile d'ambiente API_KEY.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.NUMBER,
            description: "Un punteggio da 0 a 100 che rappresenta l'efficacia complessiva della risposta dell'utente."
        },
        strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Un elenco di 2-3 punti che evidenziano ciò che l'utente ha fatto bene."
        },
        areasForImprovement: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    suggestion: {
                        type: Type.STRING,
                        description: "Il consiglio specifico su cosa l'utente potrebbe migliorare."
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
                    description: "Una versione più dettagliata e completa della risposta dell'utente. Le parole chiave importanti sono evidenziate con **doppi asterischi**."
                }
            },
            required: ["short", "long"]
        }
    },
    required: ["score", "strengths", "areasForImprovement", "suggestedResponse"]
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

    const prompt = `
      Sei un coach esperto di comunicazione. Il tuo compito è analizzare la risposta di un utente in un determinato scenario e fornire un feedback costruttivo. Rispondi SEMPRE in italiano.

      **Scenario:** ${scenario}
      
      **Compito dell'utente:** ${task}

      **Risposta dell'utente:** "${userResponse}"

      **Contesto di analisi:** ${verbalContext}

      Per favore, analizza la risposta dell'utente sulla base delle migliori pratiche di comunicazione. Valuta la sua efficacia nel raggiungere l'obiettivo del compito all'interno dello scenario dato.
      
      Fornisci la tua analisi nel seguente formato JSON. L'intero output, inclusi i suggerimenti, deve essere in italiano.
      - Lo "score" deve essere un numero intero da 0 a 100.
      - "strengths" deve essere un elenco di stringhe con i punti di forza.
      - "areasForImprovement" deve essere un elenco di oggetti, dove ogni oggetto contiene una "suggestion" (il consiglio) e un "example" (una frase di esempio virgolettata che mostra come applicare il suggerimento).
      - Per "suggestedResponse", fornisci due versioni:
        - una versione 'short': una risposta concisa e riscritta (1-2 frasi).
        - una versione 'long': una risposta più dettagliata e completa che spieghi il ragionamento.
      - In entrambe le risposte suggerite, evidenzia le parole chiave più importanti racchiudendole tra doppi asterischi, come **questo**.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });
    
    const jsonText = response.text.trim();

    const sanitizedJsonText = jsonText.replace(/^```json\s*|```$/g, '').trim();

    const result: AnalysisResult = JSON.parse(sanitizedJsonText);

    // Validation
    const isValidImprovementArea = (item: any): item is ImprovementArea => {
        return typeof item === 'object' && item !== null && typeof item.suggestion === 'string' && typeof item.example === 'string';
    };

    if (
        typeof result.score !== 'number' || 
        !Array.isArray(result.strengths) || 
        !Array.isArray(result.areasForImprovement) ||
        !result.areasForImprovement.every(isValidImprovementArea) ||
        typeof result.suggestedResponse?.short !== 'string' || 
        typeof result.suggestedResponse?.long !== 'string'
    ) {
        throw new Error("Formato di analisi non valido ricevuto dall'API.");
    }

    return result;

  } catch (error: any) {
    console.error("Errore durante l'analisi della risposta con Gemini:", error);
    if (error.message.includes('API key') || error.message.includes('API_KEY')) {
         throw new Error("API_KEY non valida o mancante. Controlla la configurazione del tuo ambiente.");
    }
    throw new Error("Impossibile ottenere l'analisi dal servizio. Riprova più tardi.");
  }
};
