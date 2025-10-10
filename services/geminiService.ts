import type { AnalysisResult, VoiceAnalysisResult, CommunicatorProfile } from '../types';

// NON dipendere dalle env: fallback sicuro su /api
const RAW_BASE = (import.meta as any)?.env?.VITE_AI_PROXY_URL;
const BASE = (RAW_BASE && String(RAW_BASE).trim() !== '')
  ? String(RAW_BASE).replace(/\/+$/, '') // se esiste, usala (senza slash finale)
  : '/api'; // fallback: usa sempre /api

async function callApi<T>(path: string, body: object): Promise<T> {
  // path sempre con slash iniziale
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE}${p}`; // es: '/api' + '/analyze' = '/api/analyze'

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
