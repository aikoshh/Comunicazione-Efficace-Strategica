import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, ImprovementArea, VoiceAnalysisResult, VoiceScore, CommunicatorProfile, Entitlements, DetailedRubricScore, Language } from '../types';
import { hasProAccess } from './monetizationService';
import { translations } from '../locales/translations';

const getAnalysisSchema = (lang: Language) => {
    const t = (key: keyof typeof translations.it) => translations[lang][key] || translations.it[key];
    const proCriteria = t('proAnalysisCriteria');

    return {
        type: Type.OBJECT,
        properties: {
            score: {
                type: Type.NUMBER,
                description: t('geminiSchemaScoreDesc') as string
            },
            strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: t('geminiSchemaStrengthsDesc') as string
            },
            areasForImprovement: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        suggestion: {
                            type: Type.STRING,
                            description: t('geminiSchemaSuggestionDesc') as string
                        },
                        example: {
                            type: Type.STRING,
                            description: t('geminiSchemaExampleDesc') as string
                        }
                    },
                    required: ["suggestion", "example"]
                },
                description: t('geminiSchemaAreasForImprovementDesc') as string
            },
            suggestedResponse: {
                type: Type.OBJECT,
                properties: {
                    short: {
                        type: Type.STRING,
                        description: t('geminiSchemaShortResponseDesc') as string
                    },
                    long: {
                        type: Type.STRING,
                        description: t('geminiSchemaLongResponseDesc') as string
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
                        criterion: { type: Type.STRING, enum: proCriteria as string[] },
                        score: { type: Type.NUMBER },
                        justification: { type: Type.STRING }
                    },
                    required: ["criterion", "score", "justification"]
                },
                description: t('geminiSchemaDetailedRubricDesc') as string
            },
            utilityScore: {
                type: Type.NUMBER,
                nullable: true,
                description: t('geminiSchemaUtilityScoreDesc') as string
            },
            clarityScore: {
                type: Type.NUMBER,
                nullable: true,
                description: t('geminiSchemaClarityScoreDesc') as string
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
    const t = (key: keyof typeof translations.it) => translations[lang][key] || translations.it[key];

    const isPro = hasProAccess(entitlements);
    const isQuestionTask = task.toLowerCase().includes(t('taskVerbQuestion') as string);

    let proInstructions = '';
    if (isPro) {
        proInstructions += t('geminiProInstructionRubric');
        if (isQuestionTask) {
            proInstructions += t('geminiProInstructionMetrics');
        }
    }

    const verbalContext = isVerbal ? t('geminiVerbalContext') : t('geminiWrittenContext');
    const systemInstruction = t('geminiSystemInstruction');
    
    let objectivePrompt = '';
    if (customObjective && customObjective.trim() !== '') {
        objectivePrompt = (t('geminiObjectivePrompt') as string).replace('{customObjective}', customObjective);
    }

    const prompt = `
      **${t('scenarioLabel')}:** ${scenario}
      
      **${t('taskLabel')}:** ${task}
      ${objectivePrompt}

      **${t('userResponseLabel')}:** "${userResponse}"

      **${t('analysisContextLabel')}:** ${verbalContext}
      
      ${proInstructions}

      ${t('geminiFinalPrompt')}
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction as string,
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
        throw new Error(t('errorInvalidAnalysisFormat') as string);
    }

    return result;

  } catch (error: any) {
    console.error("Error analyzing response with Gemini:", error);
    const t = (key: keyof typeof translations.it) => translations[lang][key] || translations.it[key];
    if (error.message.includes('API key') || error.message.includes('API_KEY')) {
         throw new Error(t('errorInvalidApiKey') as string);
    }
    throw new Error(t('errorAnalysisService') as string);
  }
};


const getParaverbalAnalysisSchema = (lang: Language) => {
    const t = (key: keyof typeof translations.it) => translations[lang][key] || translations.it[key];
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
                description: t('geminiParaverbalSchemaScoresDesc') as string
            },
            strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: t('geminiParaverbalSchemaStrengthsDesc') as string
            },
            improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: t('geminiParaverbalSchemaImprovementsDesc') as string
            },
            actions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: t('geminiParaverbalSchemaActionsDesc') as string
            },
            micro_drill_60s: {
                type: Type.STRING,
                description: t('geminiParaverbalSchemaMicroDrillDesc') as string
            },
            suggested_delivery: {
                type: Type.OBJECT,
                properties: {
                    instructions: { type: Type.STRING },
                    annotated_text: { type: Type.STRING, description: t('geminiParaverbalSchemaAnnotatedTextDesc') as string },
                    ideal_script: { type: Type.STRING, description: t('geminiParaverbalSchemaIdealScriptDesc') as string }
                },
                required: ["instructions", "annotated_text", "ideal_script"]
            }
        },
        required: ["scores", "strengths", "improvements", "actions", "micro_drill_60s", "suggested_delivery"]
    }
};

export const analyzeParaverbalResponse = async (
  transcript: string,
  scenario: string,
  task: string,
  lang: Language
): Promise<VoiceAnalysisResult> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const t = (key: keyof typeof translations.it) => translations[lang][key] || translations.it[key];

        const systemInstruction = t('geminiParaverbalSystemInstruction');
        const prompt = (t('geminiParaverbalPrompt') as string)
            .replace('{scenario}', scenario)
            .replace('{task}', task)
            .replace('{transcript}', transcript);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction as string,
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
            throw new Error(t('errorInvalidParaverbalAnalysisFormat') as string);
        }

        return result;

    } catch (error: any) {
        console.error("Error analyzing paraverbal response with Gemini:", error);
        const t = (key: keyof typeof translations.it) => translations[lang][key] || translations.it[key];
        if (error.message.includes('API key') || error.message.includes('API_KEY')) {
             throw new Error(t('errorInvalidApiKey') as string);
        }
        throw new Error(t('errorVoiceAnalysisService') as string);
    }
};


const getCommunicatorProfileSchema = (lang: Language) => {
    const t = (key: keyof typeof translations.it) => translations[lang][key] || translations.it[key];
    return {
        type: Type.OBJECT,
        properties: {
            profileTitle: {
                type: Type.STRING,
                description: t('geminiProfileSchemaTitleDesc') as string
            },
            profileDescription: {
                type: Type.STRING,
                description: t('geminiProfileSchemaDescriptionDesc') as string
            },
            strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: t('geminiProfileSchemaStrengthsDesc') as string
            },
            areasToImprove: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: t('geminiProfileSchemaAreasToImproveDesc') as string
            }
        },
        required: ["profileTitle", "profileDescription", "strengths", "areasToImprove"]
    }
};


export const generateCommunicatorProfile = async (
    analysisResults: { exerciseId: string; analysis: AnalysisResult }[],
    lang: Language
): Promise<CommunicatorProfile> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const t = (key: keyof typeof translations.it) => translations[lang][key] || translations.it[key];
        const systemInstruction = t('geminiProfileSystemInstruction');

        const formattedResults = analysisResults.map(r => `
            ---
            ${t('exerciseIdLabel')}: ${r.exerciseId}
            ${t('scoreLabel')}: ${r.analysis.score}
            ${t('strengthsDetectedLabel')}:
            - ${r.analysis.strengths.join('\n- ')}
            ${t('areasForImprovementDetectedLabel')}:
            - ${r.analysis.areasForImprovement.map(a => a.suggestion).join('\n- ')}
            ---
        `).join('\n');

        const prompt = (t('geminiProfilePrompt') as string).replace('{formattedResults}', formattedResults);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction as string,
                temperature: 0.8,
                responseMimeType: "application/json",
                responseSchema: getCommunicatorProfileSchema(lang),
            },
        });

        const rawText = response.text;
        const result: CommunicatorProfile = JSON.parse(rawText.trim());
        
        if (!result.profileTitle || !Array.isArray(result.strengths) || result.strengths.length === 0) {
             throw new Error(t('errorInvalidProfileFormat') as string);
        }

        return result;

    } catch (error: any) {
        console.error("Error generating communicator profile:", error);
        const t = (key: keyof typeof translations.it) => translations[lang][key] || translations.it[key];
        if (error.message.includes('API key') || error.message.includes('API_KEY')) {
             throw new Error(t('errorInvalidApiKey') as string);
        }
        throw new Error(t('errorProfileGeneration') as string);
    }
};