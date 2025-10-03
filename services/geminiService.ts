import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, IdealResponse } from '../types';

const cesStepSchema = {
    type: Type.OBJECT,
    properties: {
        covered: { type: Type.BOOLEAN, description: "Indica se l'utente ha coperto questa fase." },
        suggestion: { type: Type.STRING, description: "Se non coperta, fornisci una frase esatta che l'utente avrebbe potuto usare. Altrimenti, lascia vuoto." }
    },
    required: ['covered']
};

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "Un punteggio da 0 a 100 che valuta l'efficacia della risposta dell'utente."
    },
    feedback: {
      type: Type.STRING,
      description: "Un feedback generale, dettagliato e costruttivo sulla risposta data, evidenziando punti di forza e di debolezza. Sii incoraggiante."
    },
    isPositive: {
        type: Type.BOOLEAN,
        description: "Un booleano che indica se la risposta è complessivamente positiva e raggiunge l'obiettivo (true) o se necessita di miglioramenti significativi (false)."
    },
    cesHeatmap: {
        type: Type.OBJECT,
        description: "Analisi di ogni fase del modello di Comunicazione Efficace Strategica (CES).",
        properties: {
            ingaggio: { ...cesStepSchema, description: "Fase di ingaggio/apertura." },
            ricalco: { ...cesStepSchema, description: "Fase di ricalco empatico." },
            riformulazione: { ...cesStepSchema, description: "Fase di riformulazione del problema." },
            direzionamento: { ...cesStepSchema, description: "Fase di direzionamento verso una soluzione." },
            chiusura: { ...cesStepSchema, description: "Fase di chiusura dell'interazione." },
        },
        required: ['ingaggio', 'ricalco', 'riformulazione', 'direzionamento', 'chiusura']
    },
    communicativeScaleAnalysis: {
        type: Type.OBJECT,
        description: "Analisi basata sulla 'Scala del Coinvolgimento Comunicativo'.",
        properties: {
            phase: { type: Type.STRING, description: "Identifica in quale delle 5 fasi della scala si colloca la risposta (es. 'Consiglio non richiesto', 'Espressione personale')." },
            feedback: { type: Type.STRING, description: "Fornisci un feedback specifico relativo a quella fase, spiegando perché la risposta rientra in quella categoria e quali sono le implicazioni." },
            scaleScore: { type: Type.NUMBER, description: "Un punteggio da 1 a 10 che indica l'intensità del coinvolgimento comunicativo, dove 1 è 'Espressione Personale' e 10 è 'Creazione di aspettative reciproche'." }
        },
        required: ['phase', 'feedback', 'scaleScore']
    },
    idealResponse: {
        type: Type.OBJECT,
        description: "Fornisci due versioni di una risposta ideale (100/100): una breve e una lunga.",
        properties: {
            short: { type: Type.STRING, description: "La versione breve: concisa, diretta ed efficace." },
            long: { type: Type.STRING, description: "La versione lunga: più articolata, dettagliata e che spiega il ragionamento." }
        },
        required: ['short', 'long']
    }
  },
  required: ['score', 'feedback', 'isPositive', 'cesHeatmap', 'communicativeScaleAnalysis', 'idealResponse']
};


export async function analyzeResponse(
  userResponse: string,
  scenario: string,
  task: string,
  isVerbal: boolean,
  apiKey: string // The API key is now passed as a parameter
): Promise<AnalysisResult> {

  if (!apiKey || apiKey.trim() === '') {
    throw new Error("La chiave API fornita non è valida.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const modality = isVerbal ? "verbale" : "scritta";

  const systemInstruction = `Sei un coach esperto di Comunicazione Efficace Strategica (CES) e della "Scala del Coinvolgimento Comunicativo". Il tuo compito è analizzare la risposta di un utente a uno scenario di training. Sii costruttivo, incoraggiante e focalizzato sui principi teorici. Non usare mai markdown nella tua risposta, solo JSON.

  Modello CES:
  Valuta la risposta secondo 5 fasi: Ingaggio (apertura), Ricalco (empatia), Riformulazione (chiarire il problema), Direzionamento (guidare a soluzione), Chiusura (concludere). Per ogni fase, indica se è stata coperta. Se non lo è, fornisci una frase esatta che l'utente avrebbe potuto dire.

  Scala del Coinvolgimento Comunicativo:
  Analizza la risposta e identificala in una di queste 5 fasi:
  1. Espressione personale: L'utente esprime solo i propri pensieri/sentimenti.
  2. Consiglio non richiesto (Smutandamento): L'utente offre soluzioni non richieste esplicitamente.
  3. Consiglio richiesto: La risposta segue una richiesta esplicita di consiglio.
  4. Tentativo di convincimento: L'utente cerca di persuadere l'altro.
  5. Creazione di aspettative reciproche: La conversazione stabilisce un supporto futuro.
  Fornisci un feedback specifico per la fase identificata e un punteggio di intensità da 1 a 10 (1=basso, 10=alto).
  
  Infine, fornisci due versioni di una risposta ideale (100/100): una breve e concisa, e una più lunga e articolata. In entrambe le versioni, metti in grassetto usando la sintassi markdown (es. **parola chiave**) le parole chiave che hai utilizzato nelle domande proposte e che si ricollegano al contenuto dello scenario iniziale.

  Fornisci la tua analisi completa esclusivamente nel formato JSON specificato.`;
  
  const userPrompt = `Ecco lo scenario e il compito:
  - Scenario: "${scenario}"
  - Compito: "${task}"
  
  Ecco la risposta dell'utente (modalità ${modality}):
  - Risposta Utente: "${userResponse}"
  
  Analizza la risposta e fornisci il tuo feedback nel formato JSON richiesto.`;

  try {
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        }
    });

    const textResponse = result.text.trim();
    
    const cleanedJson = textResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');

    const analysis: AnalysisResult = JSON.parse(cleanedJson);
    return analysis;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error("La chiave API inserita non è valida. Controllala e riprova.");
    }
    if (error instanceof Error && error.message.includes('SAFETY')) {
        throw new Error("La risposta è stata bloccata per motivi di sicurezza. Prova a riformulare.");
    }
    throw new Error("Non è stato possibile analizzare la risposta. Riprova più tardi.");
  }
}
