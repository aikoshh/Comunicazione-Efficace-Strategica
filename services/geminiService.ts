import { GoogleGenAI } from "@google/genai";
import type { AnalysisResult, ImprovementArea } from '../types';

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper function to parse the text-based analysis from the first AI call
const parseQualitativeAnalysis = (text: string): Omit<AnalysisResult, 'score'> => {
  const getSectionContent = (header: string) => {
    // Regex to find content between the header and the next header or end of string
    const regex = new RegExp(`### ${header}\\s*([\\s\\S]*?)(?=\\s*###|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const strengthsContent = getSectionContent('Punti di Forza');
  const improvementContent = getSectionContent('Aree di Miglioramento');
  const shortResponseContent = getSectionContent('Risposta Suggerita \\(Breve\\)');
  const longResponseContent = getSectionContent('Risposta Suggerita \\(Lunga\\)');

  const strengths = strengthsContent.split('\n').map(s => s.replace(/^- \s*/, '').trim()).filter(Boolean);
  
  const areasForImprovement: ImprovementArea[] = [];
  const improvementRegex = /- \*\*Suggerimento:\*\*\s*([\s\S]*?)\s*-\s*\*\*Esempio:\*\*\s*([\s\S]*?)(?=- \*\*Suggerimento:\*\*|$)/g;
  let match;
  while ((match = improvementRegex.exec(improvementContent)) !== null) {
    areasForImprovement.push({
      suggestion: match[1].trim(),
      example: match[2].trim().replace(/^"|"$/g, ''), // Remove quotes
    });
  }

  const suggestedResponse = {
    short: shortResponseContent.replace(/^"|"$/g, '').trim(),
    long: longResponseContent.replace(/^"|"$/g, '').trim(),
  };

  if (strengths.length === 0 || areasForImprovement.length === 0 || !suggestedResponse.short || !suggestedResponse.long) {
      console.error("Parsing failed for qualitative analysis:", { text });
      throw new Error("Impossibile interpretare l'analisi qualitativa del modello.");
  }
  
  return {
    strengths,
    areasForImprovement,
    suggestedResponse,
  };
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
      
      Le tue analisi devono essere incoraggianti e mirate ad aiutare l'utente a migliorare concretamente.
    `;
    
    // --- STEP 1: Qualitative Analysis ---
    const qualitativePrompt = `
      **Scenario:** ${scenario}
      **Compito dell'utente:** ${task}
      **Risposta dell'utente:** "${userResponse}"
      **Contesto di analisi:** ${verbalContext}

      Analizza la risposta dell'utente secondo le direttive fornite nella tua istruzione di sistema. Fornisci la tua analisi ESCLUSIVAMENTE nel seguente formato, usando esattamente queste intestazioni in markdown. NON aggiungere alcun testo introduttivo o conclusivo.

      ### Punti di Forza
      - [Primo punto di forza]
      - [Secondo punto di forza]

      ### Aree di Miglioramento
      - **Suggerimento:** [Primo suggerimento]
      - **Esempio:** "[Esempio pratico]"
      - **Suggerimento:** [Secondo suggerimento]
      - **Esempio:** "[Esempio pratico]"

      ### Risposta Suggerita (Breve)
      "[Testo della risposta breve con **parole chiave** in grassetto]"

      ### Risposta Suggerita (Lunga)
      "[Testo della risposta lunga con **parole chiave** in grassetto]"
    `;

    const qualitativeResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: qualitativePrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      },
    });

    const qualitativeText = qualitativeResponse.text;
    if (!qualitativeText) {
        throw new Error("Il modello non ha generato l'analisi qualitativa.");
    }
    
    const parsedQualitativeResult = parseQualitativeAnalysis(qualitativeText);

    // --- STEP 2: Quantitative Analysis (Scoring) ---
    const scoringPrompt = `
      Data la seguente analisi di una risposta utente a uno scenario di comunicazione, fornisci un punteggio numerico da 0 a 100 che rappresenti l'efficacia complessiva.
      Il punteggio deve riflettere fedelmente la qualità della risposta dell'utente in base all'analisi fornita. Una risposta molto buona dovrebbe avere un punteggio alto, una mediocre un punteggio medio, e una cattiva un punteggio basso. Non dare sempre lo stesso punteggio.
      RISPONDI SOLO E SOLTANTO CON IL NUMERO, SENZA ALCUN TESTO AGGIUNTIVO.

      **Scenario:** ${scenario}
      **Compito:** ${task}
      **Risposta Utente:** "${userResponse}"
      
      **Analisi Qualitativa:**
      ${qualitativeText}

      **Punteggio (0-100):**
    `;

    const scoringResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: scoringPrompt,
        config: {
            temperature: 0.2, // Low temperature for a deterministic score
        }
    });

    const scoreText = scoringResponse.text.trim();
    const score = parseInt(scoreText, 10);

    if (isNaN(score) || score < 0 || score > 100) {
        console.error("Punteggio non valido ricevuto dal modello:", scoreText);
        throw new Error("Il modello ha restituito un punteggio non valido.");
    }

    // --- STEP 3: Combine results ---
    const finalResult: AnalysisResult = {
        score,
        ...parsedQualitativeResult,
    };
    
    return finalResult;

  } catch (error: any) {
    console.error("Errore durante l'analisi della risposta con Gemini:", error);
    if (error.message.includes('API key') || error.message.includes('API_KEY')) {
         throw new Error("API_KEY non valida o mancante. Controlla la configurazione del tuo ambiente.");
    }
    throw new Error(error.message || "Impossibile ottenere l'analisi dal servizio. Riprova più tardi.");
  }
};
