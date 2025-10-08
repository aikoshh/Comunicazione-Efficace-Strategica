import type { AnalysisResult, VoiceAnalysisResult, CommunicatorProfile } from '../types';

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'http://localhost:3000';
}

async function callApi<T>(endpoint: string, body: object): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch {
    throw new Error(`Invalid JSON from API: ${text?.slice(0, 200) || '<empty>'}`);
  }
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json.data as T;
}

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

export const analyzeParaverbal = async (
  transcript: string,
  scenario: string,
  task: string
): Promise<VoiceAnalysisResult> => {
  return callApi<VoiceAnalysisResult>('/api/analyze', {
    analysisType: 'paraverbal',
    payload: { transcript, scenario, task },
  });
};

export const generateCommunicatorProfile = async (
  analysisResults: { exerciseId: string; analysis: AnalysisResult }[]
): Promise<CommunicatorProfile> => {
  return callApi<CommunicatorProfile>('/api/analyze', {
    analysisType: 'profile',
    payload: { analysisResults },
  });
};
