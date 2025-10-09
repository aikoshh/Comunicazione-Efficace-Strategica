import type { AnalysisResult, VoiceAnalysisResult, CommunicatorProfile } from '../types';

const BASE = (import.meta as any).env?.VITE_AI_PROXY_URL || '';

async function callApi<T>(path: string, body: object): Promise<T> {
  const url = `${BASE}${path}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = json?.error || `Errore HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return json.data as T;
}

export const analyzeResponse = async (
  userResponse: string,
  scenario: string,
  task: string,
  isVerbalContext = false
): Promise<AnalysisResult> => {
  return callApi<AnalysisResult>('/analyze', {
    analysisType: 'text',
    payload: { userResponse, scenario, task, isVerbalContext },
  });
};

export const analyzeParaverbalResponse = async (
  transcript: string,
  scenario: string,
  task: string
): Promise<VoiceAnalysisResult> => {
  return callApi<VoiceAnalysisResult>('/analyze', {
    analysisType: 'paraverbal',
    payload: { transcript, scenario, task },
  });
};

export const generateCommunicatorProfile = async (
  analysisResults: { exerciseId: string; analysis: AnalysisResult }[]
): Promise<CommunicatorProfile> => {
  return callApi<CommunicatorProfile>('/analyze', {
    analysisType: 'profile',
    payload: { analysisResults },
  });
};
