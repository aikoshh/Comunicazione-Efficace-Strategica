import type { AnalysisResult, VoiceAnalysisResult, CommunicatorProfile } from '../types';

// BASE = endpoint completo se presente; altrimenti fallback a '/analyze'
const RAW_BASE = (import.meta as any)?.env?.VITE_AI_PROXY_URL;
const BASE = (RAW_BASE && String(RAW_BASE).trim() !== '')
  ? String(RAW_BASE).replace(/\/+$/, '') // toglie eventuale slash finale
  : '/analyze'; // fallback sicuro

function joinUrl(base: string, path: string) {
  const p = path?.startsWith('/') ? path : `/${path || ''}`;
  // se base finisce già con /analyze e path è /analyze, evita doppio
  if (base.endsWith('/analyze') && p === '/analyze') return base;
  // se il path è "/" intendiamo "chiama l'endpoint base"
  if (p === '/') return base;
  return `${base}${p}`;
}

async function callApi<T>(path: string, body: object): Promise<T> {
  const url = joinUrl(BASE, path);

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const raw = await resp.text();
  let json: any = {};
  try { json = JSON.parse(raw); } catch { json = {}; }

  console.log('[geminiService] POST', url, { body }, { status: resp.status, json });

  if (!resp.ok) {
    const msg = json?.error || `Errore HTTP ${resp.status}`;
    throw new Error(msg);
  }
  const data = (json && json.data !== undefined) ? json.data : json;
  return data as T;
}

// 👇 cambia i path da '/analyze' a '/'
export const analyzeResponse = async (
  userResponse: string,
  scenario: string,
  task: string,
  isVerbalContext = false
): Promise<AnalysisResult> => {
  return callApi<AnalysisResult>('/', {
    analysisType: 'text',
    payload: { userResponse, scenario, task, isVerbalContext },
  });
};

export const analyzeParaverbalResponse = async (
  transcript: string,
  scenario: string,
  task: string
): Promise<VoiceAnalysisResult> => {
  return callApi<VoiceAnalysisResult>('/', {
    analysisType: 'paraverbal',
    payload: { transcript, scenario, task },
  });
};

export const generateCommunicatorProfile = async (
  analysisResults: { exerciseId: string; analysis: AnalysisResult }[]
): Promise<CommunicatorProfile> => {
  return callApi<CommunicatorProfile>('/', {
    analysisType: 'profile',
    payload: { analysisResults },
  });
};



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
