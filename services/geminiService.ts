import type { AnalysisResult, VoiceAnalysisResult, CommunicatorProfile } from '../types';

/**
 * Network-only Gemini service.
 * Instead of calling @google/genai from the browser (problematic on Vercel),
 * we POST to a server/proxy (e.g., Google Apps Script / Cloudflare Worker / Supabase Edge).
 *
 * How the BASE URL is resolved (first match wins):
 *  1) import.meta.env.VITE_PROXY_URL
 *  2) <meta name="ces-proxy-url" content="https://your-endpoint">
 *  3) hardcoded fallback (replace with your Apps Script URL)
 */
function resolveBase(): string {
  // 1) Vite environment variable
  const envVal = (import.meta as any)?.env?.VITE_PROXY_URL as string | undefined;
  if (envVal && String(envVal).trim()) return String(envVal).replace(/\/+$/, '');

  // 2) Meta tag in index.html
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="ces-proxy-url"]') as HTMLMetaElement | null;
    const metaVal = meta?.content;
    if (metaVal && metaVal.trim()) return metaVal.replace(/\/+$/, '');
  }

  // 3) Hardcoded fallback: put your Apps Script / Worker URL here
  return 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_APPS_SCRIPT_DEPLOYMENT_ID/exec';
}

const BASE = resolveBase();

async function postJSON<T>(body: any): Promise<T> {
  const resp = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const raw = await resp.text();
  let json: any = {};
  try { json = JSON.parse(raw); } catch { json = {}; }

  console.log('[geminiService] POST', BASE, { body }, { status: resp.status, json });

  if (!resp.ok) {
    const msg = json?.error || `Errore HTTP ${resp.status}`;
    throw new Error(msg);
  }

  // Some proxies may return { data: ... }
  const data = (json && json.data !== undefined) ? json.data : json;
  return data as T;
}

export const analyzeResponse = async (
  userResponse: string,
  scenario: string,
  task: string,
  isVerbalContext = false
): Promise<AnalysisResult> => {
  return postJSON<AnalysisResult>({
    analysisType: 'text',
    payload: { userResponse, scenario, task, isVerbalContext },
  });
};

export const analyzeParaverbalResponse = async (
  transcript: string,
  scenario: string,
  task: string
): Promise<VoiceAnalysisResult> => {
  return postJSON<VoiceAnalysisResult>({
    analysisType: 'paraverbal',
    payload: { transcript, scenario, task },
  });
};

export const generateCommunicatorProfile = async (
  analysisResults: { exerciseId: string; analysis: AnalysisResult }[]
): Promise<CommunicatorProfile> => {
  return postJSON<CommunicatorProfile>({
    analysisType: 'profile',
    payload: { analysisResults },
  });
};
