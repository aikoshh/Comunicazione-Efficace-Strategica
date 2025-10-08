import type { AnalysisResult, VoiceAnalysisResult, CommunicatorProfile } from '../types';

// Helper function to get the base URL for the API
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for non-browser environments
  return 'http://localhost:3000';
}

// Centralized fetch wrapper for API calls
async function callApi<T>(endpoint: string, body: object): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await response.json();

    if (!response.ok) {
      // The server should return a JSON object with an 'error' key
      throw new Error(json.error || 'Errore sconosciuto dal server.');
    }

    // The server returns { data: ... } on success
    return json.data;
  } catch (error: any) {
    // Re-throw network errors or errors from the API response
    console.error(`API call to ${endpoint} failed:`, error);
    throw new Error(error.message || `Impossibile connettersi al servizio di analisi.`);
  }
}

/**
 * Analyzes a written user response.
 */
export const analyzeText = async (
  userResponse: string,
  scenario: string,
  task: string,
  isVerbalContext: boolean = false,
): Promise<AnalysisResult> => {
  return callApi<AnalysisResult>('/api/analyze', {
    analysisType: 'text',
    payload: { userResponse, scenario, task, isVerbalContext },
  });
};

/**
 * Analyzes a verbal user response (transcript).
 */
export const analyzeParaverbal = async (
  transcript: string,
  scenario: string,
  task: string
): Promise<VoiceAnalysisResult> => {
    return callApi<VoiceAnalysisResult>('/api/analyze', {
        analysisType: 'paraverbal',
        payload: { transcript, scenario, task },
    });
}

/**
 * Generates a communicator profile based on check-up results.
 */
export const generateCommunicatorProfile = async (
    analysisResults: { exerciseId: string; analysis: AnalysisResult }[]
): Promise<CommunicatorProfile> => {
    return callApi<CommunicatorProfile>('/api/analyze', {
        analysisType: 'profile',
        payload: { analysisResults },
    });
}
