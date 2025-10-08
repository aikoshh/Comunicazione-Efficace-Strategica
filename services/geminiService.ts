import type { AnalysisResult, VoiceAnalysisResult, CommunicatorProfile } from '../types';

const API_ENDPOINT = '/api/gemini';

async function callApi(analysisType: string, payload: any): Promise<any> {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ analysisType, payload }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Si è verificato un errore sconosciuto.');
        }

        return result.data;
    } catch (error: any) {
        console.error(`Errore nella chiamata API per ${analysisType}:`, error);
        // Re-throw the error with a user-friendly message
        if (error.message.includes('API_KEY')) {
             throw new Error("API_KEY non valida o mancante. Controlla la configurazione del tuo ambiente.");
        }
        throw new Error(error.message || "Impossibile comunicare con il servizio di analisi. Riprova più tardi.");
    }
}

export const analyzeResponse = async (
  userResponse: string,
  scenario: string,
  task: string,
  isVerbal: boolean,
): Promise<AnalysisResult> => {
  return callApi('analyzeResponse', { userResponse, scenario, task, isVerbal });
};

export const analyzeParaverbalResponse = async (
  transcript: string,
  scenario: string,
  task: string
): Promise<VoiceAnalysisResult> => {
    return callApi('analyzeParaverbalResponse', { transcript, scenario, task });
};

export const generateCommunicatorProfile = async (
    analysisResults: { exerciseId: string; analysis: AnalysisResult }[]
): Promise<CommunicatorProfile> => {
    return callApi('generateCommunicatorProfile', { analysisResults });
};
