import type { AnalysisResult, VoiceAnalysisResult, CommunicatorProfile } from '../types';

async function callAnalyzeApi(analysisType: string, payload: any) {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analysisType, payload }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('API Error:', result);
      throw new Error(result.error || `Il server ha risposto con lo stato ${response.status}`);
    }
    
    return result.data;
  } catch (error) {
      console.error(`Failed to fetch from /api/analyze for type ${analysisType}`, error);
      throw error; // Re-throw to be caught by the calling function
  }
}

export const analyzeResponse = async (
  userResponse: string,
  scenario: string,
  task: string,
  isVerbal: boolean,
): Promise<AnalysisResult> => {
  try {
    const payload = { userResponse, scenario, task, isVerbalContext: isVerbal };
    return await callAnalyzeApi('text', payload);
  } catch (error: any) {
    if (error.message.includes('API_KEY')) {
         throw new Error("API_KEY non valida o mancante. Controlla la configurazione del tuo ambiente.");
    }
    throw new Error(error.message || "Impossibile ottenere l'analisi dal servizio. Riprova più tardi.");
  }
};

export const analyzeParaverbalResponse = async (
  transcript: string,
  scenario: string,
  task: string
): Promise<VoiceAnalysisResult> => {
    try {
        const payload = { transcript, scenario, task };
        return await callAnalyzeApi('paraverbal', payload);
    } catch (error: any) {
        if (error.message.includes('API_KEY')) {
             throw new Error("API_KEY non valida o mancante. Controlla la configurazione del tuo ambiente.");
        }
        throw new Error(error.message || "Impossibile ottenere l'analisi vocale dal servizio. Riprova più tardi.");
    }
};

export const generateCommunicatorProfile = async (
    analysisResults: { exerciseId: string; analysis: AnalysisResult }[]
): Promise<CommunicatorProfile> => {
    try {
        const payload = { analysisResults };
        return await callAnalyzeApi('profile', payload);
    } catch (error: any) {
        if (error.message.includes('API_KEY')) {
             throw new Error("API_KEY non valida o mancante.");
        }
        throw new Error(error.message || "Impossibile generare il profilo comunicatore.");
    }
};
