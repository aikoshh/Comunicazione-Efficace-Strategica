// services/analyzeService.ts
import type { AnalysisResult, VoiceAnalysisResult, CommunicatorProfile } from '../types';

// 👇 Usa il tuo Worker, NON /api su Vercel
const API_BASE = "https://ces-ai-proxy.cescoach.workers.dev";

async function callApi<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json.data as T;
}

export const analyzeText = async (
  userResponse: string,
  scenario: string,
  task: string,
  isVerbalContext: boolean = false,
): Promise<AnalysisResult> => {
  return callApi<AnalysisResult>('/analyze', {
    analysisType: 'text',
    payload: { userResponse, scenario, task, isVerbalContext },
  });
};

export const analyzeParaverbal = async (
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
