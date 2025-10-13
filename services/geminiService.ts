import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, ImprovementArea, VoiceAnalysisResult, VoiceScore, CommunicatorProfile, Entitlements, DetailedRubricScore, Language } from '../types';
import { hasProAccess } from './monetizationService';
import { getContent } from '../locales/content';

const getAnalysisSchema = (lang: Language) => {
    const content = getContent(lang);
    const criteriaEnum = lang === 'it' 
        ? ['Chiarezza', 'Tono ed Empatia', 'Orientamento alla Soluzione', 'Assertività', 'Struttura']
        : ['Clarity', 'Tone and Empathy', 'Solution-Orientation', 'Assertiveness', 'Structure'];

    return {
        type: Type.OBJECT,
        properties: {
            score: {
                type: Type.NUMBER,
                description: content.GEMINI.scoreDescription
            },
            strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: content.GEMINI.strengthsDescription
            },
            areasForImprovement: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        suggestion: {
                            type: Type.STRING,
                            description: content.GEMINI.improvementSuggestionDescription
                        },
                        example: {
                            type: Type.STRING,
                            description: content.GEMINI.improvementExampleDescription
                        }
                    },
                    required: ["suggestion", "example"]
                },
                description: content.GEMINI.areasForImprovementDescription
            },
            suggestedResponse: {
                type: Type.OBJECT,
                properties: {
                    short: {
                        type: Type.STRING,
                        description: content.GEMINI.suggestedResponseShortDescription
                    },
                    long: {
                        type: Type.STRING,
                        description: content.GEMINI.suggestedResponseLongDescription
                    }
                },
                required: ["short", "long"]
            },
            detailedRubric: {
                type: Type.ARRAY,
                nullable: true,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        criterion: { type: Type.STRING, enum: criteriaEnum },
                        score: { type: Type.NUMBER },
                        justification: { type: Type.STRING }
                    },
                     required: ["criterion", "score", "justification"]
                },
                description: content.GEMINI.detailedRubricDescription
            },
            utilityScore: {
                type: Type.NUMBER,
                nullable: true,
                description: content.GEMINI.utilityScoreDescription
            },
            clarityScore: {
                type: Type.NUMBER,
                nullable: true,
                description: content.GEMINI.clarityScoreDescription
            }
        },
        required: ["score", "strengths", "areasForImprovement", "suggestedResponse"]
    };
};

export const analyzeResponse = async (
  userResponse: string,
  scenario: string,
  task: string,
  entitlements: Entitlements | null,
  isVerbal: boolean,
  lang: Language,
  customObjective?: string,
): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const content = getContent(lang);
    
    const isPro = hasProAccess(entitlements);
    const isQuestionTask = task.toLowerCase().includes(lang === 'it' ? 'domand' : 'question');

    let proInstructions = '';
    if (isPro) {
        proInstructions += content.GEMINI.proActiveInstructions.detailedEvaluation;
        if (isQuestionTask) {
            proInstructions += content.GEMINI.proActiveInstructions.questionMetrics;
        }
    }

    const verbalContext = isVerbal 
        ? content.GEMINI.verbalContext.isVerbal
        : content.GEMINI.verbalContext.isWritten;

    const systemInstruction = content.GEMINI.systemInstructionWritten;
    
    let objectivePrompt = '';
    if (customObjective && customObjective.trim() !== '') {
        objectivePrompt = content.GEMINI.userObjectivePrompt(customObjective);
    }

    const prompt = `
      **${content.GEMINI.promptLabels.scenario}:** ${scenario}
      
      **${content.GEMINI.promptLabels.task}:** ${task}
      ${objectivePrompt}

      **${content.GEMINI.promptLabels.userResponse}:** "${userResponse}"

      **${content.GEMINI.promptLabels.analysisContext}:** ${verbalContext}
      
      ${proInstructions}

      ${content.GEMINI.finalInstruction}
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
        responseSchema: getAnalysisSchema(lang),
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
        throw new Error("Invalid analysis format received from API.");
    }

    return result;

  } catch (error: any) {
    console.error("Error during response analysis with Gemini:", error);
    if (error.message.includes('API key') || error.message.includes('API_KEY')) {
         throw new Error(lang === 'it' ? "La chiave API fornita nel codice non è valida o è scaduta. Controlla il file geminiService.ts." : "The API key provided in the code is invalid or has expired. Check the geminiService.ts file.");
    }
    throw new Error(lang === 'it' ? "Impossibile ottenere l'analisi dal servizio. Riprova più tardi." : "Could not get analysis from the service. Please try again later.");
  }
};

const getParaverbalAnalysisSchema = (lang: Language) => {
    const content = getContent(lang);
    return {
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
                description: content.GEMINI.paraverbalSchema.scores
            },
            strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: content.GEMINI.paraverbalSchema.strengths
            },
            improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: content.GEMINI.paraverbalSchema.improvements
            },
            actions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: content.GEMINI.paraverbalSchema.actions
            },
            micro_drill_60s: {
                type: Type.STRING,
                description: content.GEMINI.paraverbalSchema.micro_drill_60s
            },
            suggested_delivery: {
                type: Type.OBJECT,
                properties: {
                    instructions: { type: Type.STRING },
                    annotated_text: { type: Type.STRING, description: content.GEMINI.paraverbalSchema.annotated_text },
                    ideal_script: { type: Type.STRING, description: content.GEMINI.paraverbalSchema.ideal_script }
                },
                required: ["instructions", "annotated_text", "ideal_script"]
            }
        },
        required: ["scores", "strengths", "improvements", "actions", "micro_drill_60s", "suggested_delivery"]
    };
};


export const analyzeParaverbalResponse = async (
  transcript: string,
  scenario: string,
  task: string,
  lang: Language
): Promise<VoiceAnalysisResult> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const content = getContent(lang);
        const systemInstruction = content.GEMINI.systemInstructionVerbal;

        const prompt = content.GEMINI.paraverbalPrompt(scenario, task, transcript);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
                topP: 0.95,
                topK: 64,
                responseMimeType: "application/json",
                responseSchema: getParaverbalAnalysisSchema(lang),
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
            throw new Error("Invalid paraverbal analysis format received from API.");
        }

        return result;

    } catch (error: any) {
        console.error("Error during paraverbal analysis with Gemini:", error);
        if (error.message.includes('API key') || error.message.includes('API_KEY')) {
             throw new Error(lang === 'it' ? "La chiave API fornita nel codice non è valida o è scaduta. Controlla il file geminiService.ts." : "The API key provided in the code is invalid or has expired. Check the geminiService.ts file.");
        }
        throw new Error(lang === 'it' ? "Impossibile ottenere l'analisi vocale dal servizio. Riprova più tardi." : "Could not get voice analysis from the service. Please try again later.");
    }
};

const getCommunicatorProfileSchema = (lang: Language) => {
    const content = getContent(lang);
    return {
        type: Type.OBJECT,
        properties: {
            profileTitle: {
                type: Type.STRING,
                description: content.GEMINI.profileSchema.profileTitle
            },
            profileDescription: {
                type: Type.STRING,
                description: content.GEMINI.profileSchema.profileDescription
            },
            strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: content.GEMINI.profileSchema.strengths
            },
            areasToImprove: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: content.GEMINI.profileSchema.areasToImprove
            }
        },
        required: ["profileTitle", "profileDescription", "strengths", "areasToImprove"]
    };
};

export const generateCommunicatorProfile = async (
    analysisResults: { exerciseId: string; analysis: AnalysisResult }[],
    lang: Language
): Promise<CommunicatorProfile> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const content = getContent(lang);
        const systemInstruction = content.GEMINI.profileSystemInstruction;

        const formattedResults = analysisResults.map(r => `
            ---
            Exercise ID: ${r.exerciseId}
            Score: ${r.analysis.score}
            Detected Strengths:
            - ${r.analysis.strengths.join('\n- ')}
            Detected Areas for Improvement:
            - ${r.analysis.areasForImprovement.map(a => a.suggestion).join('\n- ')}
            ---
        `).join('\n');

        const prompt = content.GEMINI.profilePrompt(formattedResults);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
                responseMimeType: "application/json",
                responseSchema: getCommunicatorProfileSchema(lang),
            },
        });

        const rawText = response.text;
        const result: CommunicatorProfile = JSON.parse(rawText.trim());
        
        if (!result.profileTitle || !Array.isArray(result.strengths) || result.strengths.length === 0) {
             throw new Error("Invalid communicator profile format.");
        }

        return result;

    } catch (error: any) {
        console.error("Error generating communicator profile:", error);
        if (error.message.includes('API key') || error.message.includes('API_KEY')) {
             throw new Error(lang === 'it' ? "La chiave API fornita nel codice non è valida o è scaduta. Controlla il file geminiService.ts." : "The API key provided in the code is invalid or has expired. Check the geminiService.ts file.");
        }
        throw new Error(lang === 'it' ? "Impossibile generare il profilo comunicatore." : "Could not generate communicator profile.");
    }
};