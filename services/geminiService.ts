import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, ImprovementArea, VoiceAnalysisResult, VoiceScore, CommunicatorProfile, Entitlements, DetailedRubricScore } from '../types';
import { hasEntitlement } from './monetizationService';

// ATTENZIONE: Inserire le chiavi API direttamente nel codice client-side è un grave rischio per la sicurezza.
// Questa chiave è visibile a chiunque ispezioni il codice sorgente dell'applicazione.
const API_KEY = "AIzaSyCPKmoJbTg3jhxo9oJIcY7DKPYXKj1kA_c";

const getAI = () => {
    if (!API_KEY) {
        throw new Error("API_KEY non configurata nel codice sorgente.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
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
                    description: "Eine detailliertere und vollständigere Version der Benutzerantwort, die die Prinzipien effektiver Kommunikation verkörpert. Wichtige Schlüsselwörter sind mit **doppelten Sternchen** hervorgehoben."
                }
            },
            required: ["short", "long"]
        },
        // --- PRO Schema Fields ---
        detailedRubric: {
            type: Type.ARRAY,
            nullable: true,
            items: {
                type: Type.OBJECT,
                properties: {
                    criterion: { type: Type.STRING, enum: ['Chiarezza', 'Tono ed Empatia', 'Orientamento alla Soluzione', 'Assertività', 'Struttura'] },
                    score: { type: Type.NUMBER },
                    justification: { type: Type.STRING }
                },
                 required: ["criterion", "score", "justification"]
            },
            description: "Valutazione dettagliata PRO. Compila questo campo SOLO se richiesto nelle istruzioni del prompt."
        },
        utilityScore: {
            type: Type.NUMBER,
            nullable: true,
            description: "Punteggio da 1 a 10 sull'utilità della domanda posta. Compila questo campo SOLO se richiesto."
        },
        clarityScore: {
            type: Type.NUMBER,
            nullable: true,
            description: "Punteggio da 1 a 10 sulla chiarezza della domanda posta. Compila questo campo SOLO se richiesto."
        }
    },
    required: ["score", "strengths", "areasForImprovement", "suggestedResponse"]
};


export const analyzeResponse = async (
  userResponse: string,
  scenario: string,
  task: string,
  entitlements: Entitlements | null,
  isVerbal: boolean,
  customObjective?: string,
): Promise<AnalysisResult> => {
  try {
    const ai = getAI();

    const isRiformulazionePro = hasEntitlement(entitlements, 'ces.addon.riformulazione.pro');
    const isDomandePro = hasEntitlement(entitlements, 'ces.addon.domande.pro');
    const isQuestionTask = task.toLowerCase().includes('domand');

    let proInstructions = '';
    if (isRiformulazionePro) {
        proInstructions += `
          **Funzionalità PRO ATTIVA: Riformulazione PRO.**
          DEVI fornire una valutazione dettagliata per ciascuno dei 5 criteri chiave (Chiarezza, Tono ed Empatia, Orientamento alla Soluzione, Assertività, Struttura). Per ogni criterio, fornisci un punteggio da 1 a 10 e una breve motivazione. Popola il campo 'detailedRubric' nel JSON.
        `;
    }
     if (isDomandePro && isQuestionTask) {
        proInstructions += `
          **Funzionalità PRO ATTIVA: Domande PRO.**
          L'utente sta formulando una domanda. Valutala secondo due metriche specifiche: 'utilityScore' (quanto la domanda è utile per raggiungere l'obiettivo) e 'clarityScore' (quanto la domanda è chiara e non ambigua), entrambe con un punteggio da 1 a 10. Popola i campi 'utilityScore' and 'clarityScore' nel JSON.
        `;
    }

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
    
    let objectivePrompt = '';
    if (customObjective && customObjective.trim() !== '') {
        objectivePrompt = `\n**Obiettivo Personale dell'Utente:** Oltre al compito principale, l'utente voleva specificamente raggiungere questo obiettivo: "${customObjective}". Valuta la sua risposta anche in base a questo, includendo un commento su questo punto nei tuoi feedback (punti di forza o aree di miglioramento).`
    }

    const prompt = `
      **Scenario:** ${scenario}
      
      **Compito dell'utente:** ${task}
      ${objectivePrompt}

      **Risposta dell'utente:** "${userResponse}"

      **Contesto di analisi:** ${verbalContext}
      
      ${proInstructions}

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

    const jsonBlockMatch = jsonStringToParse.match(/```json\s*([\s\S]+?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
        jsonStringToParse = jsonBlockMatch[1];
    }

    const result: AnalysisResult = JSON.parse(jsonStringToParse);

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
         throw new Error("La chiave API fornita nel codice non è valida o è scaduta. Controlla il file geminiService.ts.");
    }
    throw new Error("Impossibile ottenere l'analisi dal servizio. Riprova più tardi.");
  }
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

export const analyzeParaverbalResponse = async (
  transcript: string,
  scenario: string,
  task: string
): Promise<VoiceAnalysisResult> => {
    try {
        const ai = getAI();

        const systemInstruction = `
            Sei **CES Coach Engine** esteso con il modulo **Voce Strategica (Paraverbale)**. Valuta e allena il paraverbale per rendere più efficace il messaggio secondo i principi della Comunicazione Efficace Strategica®.
            
            Considera i seguenti **fattori chiave paraverbali**:
            - **Respirazione & ritmo (pacing)**: regolarità, pause significative, assenza di affanno.
            - **Velocità (parole/minuto)**: ritmo naturale; evitare eccesso/deficit di velocità.
            - **Volume**: udibile e stabile; variazioni intenzionali per enfasi.
            - **Tono/Timbro & Calore**: fermo, empatico, professionale; evitare piattezza/metallicità.
            - **Intonazione & Melodia**: variazione per mantenere attenzione; evitare monotonia/cantilena.
            - **Articolazione & Dizione**: nitidezza di consonanti, sillabe non elise.
            - **Enfasi strategica**: parole-chiave evidenziate con pause/intonazione.
            - **Pause strategiche**: prima/dopo concetti chiave; evitare silenzi imbarazzanti.
            - **Disfluenze & filler**: gestione di “ehm”, autocorrezioni, sovrapposizioni.
            - **Allineamento con intento strategico**: coerenza vocale con obiettivo (empatia, fermezza, negoziazione, de-escalation).

            Stile del feedback: **fermo, empatico, strategico**. Linguaggio operativo, non giudicante.
            Output preferito: **JSON strutturato + testo breve esplicativo quando richiesto**.
            Sii rigoroso nella valutazione. Se un criterio è sotto 6, deve essere considerato un'area di miglioramento. Punta ad avere la maggioranza dei criteri fra 7 e 9.

            Fornisci la tua analisi esclusivamente nel formato JSON richiesto.
        `;

        const prompt = `
            Valuta la seguente traccia vocale (trascritta) e genera un feedback operativo.

            **Scenario:** ${scenario}
            **Compito dell'utente:** ${task}
            **Trascrizione della risposta dell'utente:** "${transcript}"
            
            Istruzioni:
            1. Valuta ogni criterio della rubrica da 1 a 10 con una motivazione breve (1-2 frasi). Per il campo 'criterion_id' nel tuo output JSON, DEVI usare ESATTAMENTE uno dei seguenti valori: "pacing_breath", "speed", "volume", "tone_warmth", "intonation", "articulation", "emphasis", "pauses", "disfluencies", "strategy_alignment".
            2. Evidenzia **3 punti di forza** e **3 aree da migliorare**.
            3. Suggerisci **3 azioni pratiche** e **1 micro-drill (≤60s)** immediato.
            4. Fornisci una **"consegna annotata"** del testo originale con simboli: ☐ (pausa), △ (enfasi). Ad esempio: "Capisco ☐ la tua preoccupazione. △ Possiamo lavorare insieme su un primo passo."
            5. Scrivi un **"ideal_script"**: la versione ottimale della risposta dell'utente, scritta in modo naturale e pronta per essere letta da un motore di sintesi vocale.
            
            Genera l'output in formato JSON.
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
                responseSchema: paraverbalAnalysisSchema,
            },
        });
        
        const rawText = response.text;
        const result: VoiceAnalysisResult = JSON.parse(rawText.trim());

        // Basic validation
        if (
            !Array.isArray(result.scores) || 
            !result.scores.every((s: VoiceScore) => typeof s.score === 'number') ||
            !Array.isArray(result.strengths) ||
            !Array.isArray(result.improvements) ||
            !Array.isArray(result.actions) ||
            typeof result.micro_drill_60s !== 'string' ||
            typeof result.suggested_delivery?.annotated_text !== 'string' ||
            typeof result.suggested_delivery?.ideal_script !== 'string'
        ) {
            throw new Error("Formato di analisi paraverbale non valido ricevuto dall'API.");
        }

        return result;

    } catch (error: any) {
        console.error("Errore durante l'analisi paraverbale con Gemini:", error);
        if (error.message.includes('API key') || error.message.includes('API_KEY')) {
             throw new Error("La chiave API fornita nel codice non è valida o è scaduta. Controlla il file geminiService.ts.");
        }
        throw new Error("Impossibile ottenere l'analisi vocale dal servizio. Riprova più tardi.");
    }
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


export const generateCommunicatorProfile = async (
    analysisResults: { exerciseId: string; analysis: AnalysisResult }[]
): Promise<CommunicatorProfile> => {
    try {
        const ai = getAI();
        const systemInstruction = `
            Sei un esperto di profilazione della comunicazione basato sulla metodologia CES. Il tuo compito è analizzare una serie di analisi di esercizi di check-up e sintetizzarle in un profilo di comunicazione conciso, incoraggiante e strategico.
            Identifica i pattern ricorrenti, sia positivi che negativi, attraverso le diverse risposte per delineare uno stile di comunicazione complessivo.
            Fornisci la tua analisi esclusivamente nel formato JSON richiesto, in italiano.
        `;

        const formattedResults = analysisResults.map(r => `
            ---
            Esercizio ID: ${r.exerciseId}
            Punteggio: ${r.analysis.score}
            Punti di Forza Rilevati:
            - ${r.analysis.strengths.join('\n- ')}
            Aree di Miglioramento Rilevate:
            - ${r.analysis.areasForImprovement.map(a => a.suggestion).join('\n- ')}
            ---
        `).join('\n');

        const prompt = `
            Ho completato un check-up di comunicazione. Ecco un riassunto delle analisi delle mie risposte:
            
            ${formattedResults}

            Basandoti su questi dati, genera il mio "Profilo del Comunicatore" in formato JSON.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
                responseMimeType: "application/json",
                responseSchema: communicatorProfileSchema,
            },
        });

        const rawText = response.text;
        const result: CommunicatorProfile = JSON.parse(rawText.trim());
        
        if (!result.profileTitle || !Array.isArray(result.strengths) || result.strengths.length === 0) {
             throw new Error("Formato del profilo comunicatore non valido.");
        }

        return result;

    } catch (error: any) {
        console.error("Errore durante la generazione del profilo comunicatore:", error);
        if (error.message.includes('API key') || error.message.includes('API_KEY')) {
             throw new Error("La chiave API fornita nel codice non è valida o è scaduta. Controlla il file geminiService.ts.");
        }
        throw new Error("Impossibile generare il profilo comunicatore.");
    }
};
