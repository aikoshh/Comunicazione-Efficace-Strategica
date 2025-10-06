import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, ImprovementArea } from '../types';

const getAI = () => {
  let apiKey;
  try {
    // Accede in modo sicuro alla chiave API. Lancia un ReferenceError se 'process' non è definito.
    apiKey = process.env.API_KEY;
  } catch (e) {
    // 'process' non è definito in questo ambiente.
    return null;
  }

  // Controlla se la chiave API è una stringa non vuota.
  if (!apiKey) {
    return null;
  }
  
  // Restituisce una nuova istanza del client AI.
  return new GoogleGenAI({ apiKey });
};

const getMockAnalysis = (): Promise<AnalysisResult> => {
  console.warn("API_KEY non trovata. Utilizzo di una risposta mockata per la demo.");
  const mockAnalysis: AnalysisResult = {
    score: 85,
    strengths: [
      "Ottimo uso di un tono empatico e collaborativo.",
      "La proposta di soluzione è chiara e orientata al futuro.",
      "Hai descritto l'impatto del comportamento in modo oggettivo, senza accusare."
    ],
    areasForImprovement: [
      {
        suggestion: "Potresti essere ancora più specifico nell'esprimere le tue sensazioni usando una 'frase-io'.",
        example: "Invece di dire 'questo modo di fare causa ritardi', potresti provare con 'Quando vedo che i dettagli vengono controllati più volte, mi sento frustrato perché rallenta il mio lavoro.'"
      },
      {
        suggestion: "Concludi la conversazione con un accordo chiaro sui prossimi passi.",
        example: "Potresti finire dicendo: 'Siamo d'accordo nel provare questo nuovo approccio per le prossime due settimane e poi fare un check-in per vedere come sta andando?'"
      }
    ],
    suggestedResponse: {
      short: "Ho notato che hai **grande attenzione ai dettagli**, il che è prezioso. A volte, però, questo rallenta il nostro flusso di lavoro. Potremmo provare a definire dei **punti di controllo specifici** invece di una revisione costante?",
      long: "Apprezzo molto la tua dedizione alla qualità e la tua attenzione ai dettagli. Ho notato che tendi a revisionare il mio lavoro molto da vicino. Se da un lato capisco il desiderio di non commettere errori, dall'altro questo approccio sta avendo un impatto sulla mia autonomia e a volte crea dei colli di bottiglia. Mi piacerebbe proporti una soluzione: potremmo stabilire 1-2 momenti di revisione chiari durante il progetto invece di controlli continui? Credo che questo potrebbe **darmi più fiducia** e **rendere il processo più efficiente** per entrambi. Cosa ne pensi?"
    },
    isMock: true,
  };
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockAnalysis);
    }, 1500); // Simulate network delay
  });
};

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
                    description: "Una versione più dettagliata e completa della risposta dell'utente che incarna i principi di comunicazione efficace. Le parole chiave importanti sono evidenziate con **doppi asterischi**."
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
  const ai = getAI();

  // Se getAI() restituisce null, la chiave API non è configurata.
  // Utilizza l'analisi mock per la modalità demo.
  if (!ai) {
    return getMockAnalysis();
  }

  try {
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
      
      Basa il tuo punteggio (score) su una valutazione olistica di questi criteri in relazione allo specifico scenario e compito. Il punteggio deve riflettere fedelmente la qualità della risposta dell'utente. Una risposta molto buona dovrebbe avere un punteggio alto, una mediocre un punteggio medio, e una cattiva un punteggio basso. Non dare sempre lo stesso punteggio.
      
      Le tue analisi devono essere incoraggianti e mirate ad aiutare l'utente a migliorare concretamente. Fornisci la tua analisi esclusivamente nel formato JSON richiesto.
    `;

    const prompt = `
      **Scenario:** ${scenario}
      
      **Compito dell'utente:** ${task}

      **Risposta dell'utente:** "${userResponse}"

      **Contesto di analisi:** ${verbalContext}

      Analizza la risposta dell'utente secondo le direttive fornite nella tua istruzione di sistema e genera il feedback strutturato in formato JSON.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        topP: 0.95,
        topK: 64,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });
    
    const rawText = response.text;
    let jsonStringToParse = rawText.trim();

    // The model might wrap the JSON in ```json ... ``` or add introductory text.
    // We need to robustly extract the JSON part.
    const jsonBlockMatch = jsonStringToParse.match(/```json\s*([\s\S]+?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
        jsonStringToParse = jsonBlockMatch[1];
    }

    const result: AnalysisResult = JSON.parse(jsonStringToParse);

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
         throw new Error("API_KEY non valida o mancante. Se stai usando una chiave, assicurati che sia corretta e attiva.");
    }
    throw new Error("Impossibile ottenere l'analisi dal servizio. Riprova più tardi.");
  }
};
