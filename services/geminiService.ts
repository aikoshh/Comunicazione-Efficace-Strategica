import type { AnalysisResult, VoiceAnalysisResult, CommunicatorProfile } from '../types';

const RAW_BASE = (import.meta as any)?.env?.VITE_AI_PROXY_URL || '';
// normalizza BASE: senza slash finale
const BASE = String(RAW_BASE).replace(/\/+$/, '');

async function callApi<T>(path: string, body: object): Promise<T> {
  // assicura che il path inizi con "/"
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE}${p}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  // prova a leggere JSON; se fallisce crea un oggetto vuoto
  const raw = await resp.text();
  let json: any = {};
  try { json = JSON.parse(raw); } catch { json = {}; }

  // debug leggero (utile adesso per capire cosa arriva)
  console.log('[geminiService] POST', url, { body }, { status: resp.status, json });

  if (!resp.ok) {
    const msg = json?.error || `Errore HTTP ${resp.status}`;
    throw new Error(msg);
  }

  // Alcuni backend tornano direttamente l’oggetto, altri { data: ... }.
  const data = (json && json.data !== undefined) ? json.data : json;

  return data as T;
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
