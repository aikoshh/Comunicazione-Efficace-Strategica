// services/geminiService.ts

import { GoogleGenAI, Type } from "@google/genai";
import type {
  AnalysisResult,
  VoiceAnalysisResult,
  PersonalizationData,
  CommunicatorProfile,
  Entitlements,
  DetailedRubricScore,
  AnalysisHistoryItem,
  Exercise
} from '../types';
import { hasProAccess } from './monetizationService';
import { VOICE_RUBRIC_CRITERIA } from '../constants';
import { FALLBACK_API_KEY } from '../config';

const getAi = () => {
    const key = process.env.API_KEY || (FALLBACK_API_KEY && (FALLBACK_API_KEY as string) !== 'INCOLLA-QUI-LA-TUA-CHIAVE-API-GEMINI' ? FALLBACK_API_KEY : undefined);
    
    if (!key) {
        throw new Error('La chiave API di Gemini non è configurata. Inseriscila nel file `config.ts` o imposta la variabile d\'ambiente API_KEY.');
    }
    return new GoogleGenAI({ apiKey: key });
};


const safeJsonParse = <T>(text: string): T => {
    try {
        const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
        return JSON.parse(cleanText) as T;
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", text);
        throw new Error("Received an invalid response from the analysis service. Please try again.");
    }
};

export async function analyzeResponse(
    exercise: Exercise,
    userResponse: string,
    entitlements: Entitlements | null,
    analysisHistory: { [key: string]: AnalysisHistoryItem }
): Promise<AnalysisResult> {
    const ai = getAi();
    const isPro = hasProAccess(entitlements);

    // Prepare history for PRO feedback
    let formattedHistory = '';
    if (isPro && analysisHistory) {
        const pastAttempts = Object.values(analysisHistory)
            .filter(item => item.type === 'written')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 3); // Take last 3 relevant attempts

        if (pastAttempts.length > 0) {
            formattedHistory = 'CRONOLOGIA RECENTE DELL\'UTENTE (per feedback contestuale):\n';
            pastAttempts.forEach((attempt, index) => {
                const result = attempt.result as AnalysisResult;
                formattedHistory += `${index + 1}. Risposta: "${attempt.userResponse}" - Punteggio: ${result.score} - Feedback Principale: ${result.areasForImprovement[0]?.suggestion}\n`;
            });
        }
    }

    const proFeaturesSchema = isPro ? {
        evolutionary_feedback: { type: Type.STRING, description: "Un breve (1-2 frasi) feedback contestuale che commenta i progressi dell'utente rispetto ai tentativi passati, se presenti nella cronologia. Sii incoraggiante." },
        detailedRubric: {
            type: Type.ARRAY,
            description: "Valutazione dettagliata PRO con 5 criteri specifici: Chiarezza (Clarity), Tono (Tone), Orientamento alla Soluzione (Solution-focus), Assertività (Assertiveness), Struttura (Structure).",
            items: {
                type: Type.OBJECT,
                properties: {
                    criterion: { type: Type.STRING },
                    score: { type: Type.NUMBER, description: "Punteggio da 1 a 10 per il criterio." },
                    justification: { type: Type.STRING, description: "Motivazione concisa del punteggio." }
                },
                required: ["criterion", "score", "justification"]
            }
        },
        utilityScore: { type: Type.NUMBER, description: "Solo per esercizi di domande, valuta l'utilità della domanda da 1 a 10." },
        clarityScore: { type: Type.NUMBER, description: "Solo per esercizi di domande, valuta la chiarezza della domanda da 1 a 10." },
    } : {};
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER, description: "Punteggio generale della risposta da 0 a 100, basato sull'efficacia e aderenza al compito." },
            strengths: { type: Type.ARRAY, description: "Elenco puntato (2-3 punti) dei punti di forza della risposta.", items: { type: Type.STRING } },
            areasForImprovement: {
                type: Type.ARRAY,
                description: "Elenco puntato (2-3 punti) delle aree di miglioramento più importanti.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        suggestion: { type: Type.STRING, description: "Il suggerimento specifico." },
                        example: { type: Type.STRING, description: "Un esempio concreto che mostra come applicare il suggerimento." }
                    },
                    required: ["suggestion", "example"]
                }
            },
            suggestedResponse: {
                type: Type.OBJECT,
                description: "Una risposta alternativa ideale, in due versioni.",
                properties: {
                    short: { type: Type.STRING, description: "Una versione concisa e diretta." },
                    long: { type: Type.STRING, description: "Una versione più elaborata ed empatica." }
                },
                required: ["short", "long"]
            },
            ...proFeaturesSchema
        },
        required: ["score", "strengths", "areasForImprovement", "suggestedResponse"]
    };

    const modelToUse = isPro ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const prompt = `Sei un coach esperto in Comunicazione Efficace Strategica (CES). Analizza la risposta dell'utente a uno scenario di training. Sii incoraggiante ma diretto.
    
    SCENARIO: ${exercise.scenario}
    COMPITO: ${exercise.task}
    ${exercise.customObjective ? `OBIETTIVO PERSONALIZZATO DELL'UTENTE: ${exercise.customObjective}` : ''}
    RISPOSTA DELL'UTENTE: "${userResponse}"
    
    ${formattedHistory}

    ISTRUZIONI:
    1.  Valuta la risposta dell'utente in base ai principi della CES.
    2.  Assegna un punteggio da 0 a 100.
    3.  Identifica 2-3 punti di forza chiari e 2-3 aree di miglioramento prioritarie.
    4.  Per ogni area di miglioramento, fornisci un esempio pratico.
    5.  Scrivi due versioni di una risposta ideale (una breve e una più dettagliata). Evidenzia le parole chiave o frasi strategiche con **asterischi**.
    ${isPro ? "6. COMPILA LA SEZIONE PRO: Se presente una cronologia, fornisci un 'evolutionary_feedback' commentando i progressi. Compila la 'detailedRubric' (punteggi 1-10). Se il compito è fare una domanda, valuta anche Utilità e Chiarezza." : ""}
    7.  Fornisci l'output ESCLUSIVAMENTE in formato JSON secondo lo schema specificato. Non includere testo al di fuori del JSON.`;

    const response = await getAi().models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
    });

    return safeJsonParse<AnalysisResult>(response.text);
}

export async function analyzeParaverbalResponse(
    transcript: string,
    scenario: string,
    task: string,
): Promise<VoiceAnalysisResult> {
    const ai = getAi();
    const modelToUse = 'gemini-2.5-pro'; // Paraverbal analysis is more complex

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            scores: {
                type: Type.ARRAY,
                description: "Punteggi da 1 a 10 per ogni criterio paraverbale. Devi fornirli TUTTI.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        criterion_id: { type: Type.STRING, enum: VOICE_RUBRIC_CRITERIA.map(c => c.id) },
                        score: { type: Type.NUMBER, description: "Punteggio da 1 a 10." }
                    },
                    required: ["criterion_id", "score"]
                }
            },
            strengths: { type: Type.ARRAY, description: "2-3 punti di forza paraverbali osservati.", items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, description: "Le 2-3 aree di miglioramento paraverbale più importanti.", items: { type: Type.STRING } },
            actions: { type: Type.ARRAY, description: "2-3 azioni pratiche che l'utente può fare per migliorare.", items: { type: Type.STRING } },
            micro_drill_60s: { type: Type.STRING, description: "Un esercizio specifico di 60 secondi che l'utente può fare subito." },
            suggested_delivery: {
                type: Type.OBJECT,
                properties: {
                    instructions: { type: Type.STRING, description: "Istruzioni su come leggere il testo annotato (es. 'Usa un ritmo più lento, fai una pausa dove indicato')." },
                    annotated_text: { type: Type.STRING, description: "La trascrizione dell'utente con annotazioni per pause (☐) ed enfasi (△ su una parola chiave)." },
                    ideal_script: { type: Type.STRING, description: "Una versione ideale del testo, riscritta per massima efficacia paraverbale (solo il testo, senza annotazioni)." }
                },
                required: ["instructions", "annotated_text", "ideal_script"]
            }
        },
        required: ["scores", "strengths", "improvements", "actions", "micro_drill_60s", "suggested_delivery"]
    };
    
    const prompt = `Sei un vocal coach esperto. Analizza la trascrizione di una risposta vocale, inferendo gli aspetti paraverbali (tono, ritmo, pause) dal testo e dal contesto.
    
    SCENARIO: ${scenario}
    COMPITO: ${task}
    TRASCRIZIONE UTENTE: "${transcript}"
    
    ISTRUZIONI:
    1.  Immagina come questa trascrizione sarebbe stata pronunciata per essere efficace.
    2.  Valuta la performance paraverbale su una scala da 1 a 10 per TUTTI i seguenti criteri: ${VOICE_RUBRIC_CRITERIA.map(c => c.label).join(', ')}.
    3.  Identifica i punti di forza e le aree di miglioramento.
    4.  Suggerisci azioni concrete e un micro-esercizio da 60 secondi.
    5.  Fornisci una 'risposta consigliata' che includa: istruzioni, il testo dell'utente annotato con simboli per pause (☐) ed enfasi (△), e una versione ideale del testo da leggere.
    6.  Fornisci l'output ESCLUSIVAMENTE in formato JSON secondo lo schema.`;

    const response = await getAi().models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
        },
    });

    return safeJsonParse<VoiceAnalysisResult>(response.text);
}


export async function generateCustomExercise(
    personalizationData: PersonalizationData,
): Promise<{ scenario: string, task: string }> {
    const ai = getAi();
    const modelToUse = 'gemini-2.5-flash';

    const prompt = `Crea uno scenario di allenamento per la comunicazione basato sul seguente profilo utente.
    
    PROFILO:
    - Professione: ${personalizationData.professione}
    - Livello Carriera: ${personalizationData.livelloCarriera}
    - Contesto Comunicativo Tipico: ${personalizationData.contestoComunicativo}
    - Sfida Principale: ${personalizationData.sfidaPrincipale}
    
    ISTRUZIONI:
    1. Scrivi uno 'scenario' realistico e specifico (2-3 frasi) che rifletta il profilo e la sfida dell'utente.
    2. Scrivi un 'task' chiaro e attuabile (1 frase) che l'utente deve completare.
    3. Restituisci l'output solo in formato JSON con le chiavi "scenario" e "task".`;

    const response = await getAi().models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  scenario: { type: Type.STRING },
                  task: { type: Type.STRING }
              },
              required: ["scenario", "task"]
          },
        },
    });
    
    return safeJsonParse<{ scenario: string, task: string }>(response.text);
}

export async function generateCommunicatorProfile(
    analysisResults: { exerciseId: string; analysis: AnalysisResult }[],
): Promise<CommunicatorProfile> {
    const ai = getAi();
    const modelToUse = 'gemini-2.5-pro';

    const formattedResults = analysisResults.map(r => `
      Esercizio ID: ${r.exerciseId}
      Punteggio: ${r.analysis.score}
      Punti di Forza: ${r.analysis.strengths.join(', ')}
      Aree di Miglioramento: ${r.analysis.areasForImprovement.map(a => a.suggestion).join(', ')}
    `).join('\n---\n');

    const prompt = `Sei uno psicologo del lavoro e coach di comunicazione strategica. Analizza i risultati di 3 esercizi di check-up di un utente per creare il suo profilo di comunicatore.
    
    RISULTATI DEGLI ESERCIZI:
    ${formattedResults}
    
    ISTRUZIONI:
    1. Sintetizza i risultati per identificare un pattern comportamentale.
    2. Assegna un "profileTitle" evocativo e professionale (es. "Il Mediatore Pragmatico", "L'Analista Cauto", "Il Leader Ispiratore").
    3. Scrivi una "profileDescription" di 2-3 frasi che descriva lo stile comunicativo generale dell'utente.
    4. Elenca 2-3 "strengths" (punti di forza) consolidati che emergono dai risultati.
    5. Elenca 2-3 "areasToImprove" (aree di miglioramento) che rappresentano le sfide principali per l'utente.
    6. L'output deve essere SOLO un oggetto JSON con le chiavi: "profileTitle", "profileDescription", "strengths", "areasToImprove".`;

    const response = await getAi().models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  profileTitle: { type: Type.STRING },
                  profileDescription: { type: Type.STRING },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["profileTitle", "profileDescription", "strengths", "areasToImprove"]
          },
        },
    });

    return safeJsonParse<CommunicatorProfile>(response.text);
}


export async function generateStrategicChatResponse(
  receivedMessage: string,
  objective: string,
  context: string,
  tone: 'Empatico' | 'Diretto' | 'Chiarificatore',
): Promise<string> {
    const ai = getAi();
    const modelToUse = 'gemini-2.5-flash';

    const toneInstruction = {
        'Empatico': 'Formula una risposta che sia primariamente empatica, validando le emozioni o la prospettiva dell\'altro prima di esporre il tuo punto di vista. L\'obiettivo è connettersi emotivamente.',
        'Diretto': 'Formula una risposta chiara, concisa e assertiva. Vai dritto al punto, esprimi i tuoi bisogni o la tua posizione in modo inequivocabile, mantenendo un tono professionale.',
        'Chiarificatore': 'Formula una risposta che inizi con una breve riformulazione per mostrare che hai capito, e che si concluda con una domanda dicotomica strategica (es. "Intendi dire X oppure Y?") per obbligare l\'altro a chiarire la sua posizione o intenzione.'
    };

    const prompt = `Sei un coach di Comunicazione Efficace Strategica (CES). Il tuo compito è aiutare un utente a formulare una risposta strategica a un messaggio ricevuto, seguendo un tono specifico.

    MESSAGGIO RICEVUTO DALL'UTENTE:
    "${receivedMessage}"
    
    OBIETTIVO DELL'UTENTE PER LA RISPOSTA:
    "${objective}"

    ${context ? `CONTESTO AGGIUNTIVO FORNITO DALL'UTENTE: "${context}"` : ''}

    TONO RICHIESTO: ${tone}
    
    ISTRUZIONI:
    1.  Analizza il messaggio, l'obiettivo e il contesto fornito.
    2.  Formula una risposta che segua ESATTAMENTE le direttive per il tono "${tone}": ${toneInstruction[tone]}.
    3.  Genera due versioni della risposta: una "Risposta Breve" e una "Risposta Elaborata".
    4.  Aggiungi una sezione "Spiegazione della Strategia" dove spieghi in 2-3 punti elenco perché la risposta è efficace. Usa il marcatore '*' per ogni punto elenco.
    5.  Evidenzia le frasi o parole chiave strategiche all'interno delle risposte e della spiegazione usando **asterischi**.
    6.  Restituisci l'output ESCLUSIVAMENTE come testo formattato in Markdown. Struttura la risposta come segue, SENZA la sezione "Avvertenza":
        - Titolo: "Risposta Breve"
        - Testo della risposta breve
        - Titolo: "Risposta Elaborata"
        - Testo della risposta elaborata
        - Titolo: "Spiegazione della Strategia"
        - Elenco puntato della spiegazione`;
    
    const response = await getAi().models.generateContent({
        model: modelToUse,
        contents: prompt,
    });
    
    return response.text;
}
