import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs', maxDuration: 60 };

function json(res: VercelResponse, status: number, body: any) {
  return res.status(status).json(body);
}
function readBody(req: VercelRequest) {
  const ct = (req.headers['content-type'] || '').toString();
  if (ct.includes('application/json') && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) { try { return JSON.parse(req.body); } catch {} }
  return {};
}

const buildTextPrompt = (payload: any) => {
  const { userResponse, scenario, task, isVerbalContext } = payload;
  const verbalContext = isVerbalContext
    ? "La risposta è stata fornita verbalmente. Considera concisione e chiarezza adatte al parlato."
    : "La risposta è stata scritta. Analizzala per chiarezza, tono e struttura.";
  return {
    prompt:
      `**Scenario:** ${scenario}\n` +
      `**Compito:** ${task}\n` +
      `**Risposta Utente:** "${userResponse}"\n` +
      `**Contesto:** ${verbalContext}\n` +
      `Analizza e restituisci SOLO un JSON valido (nessun testo fuori JSON).`,
    systemInstruction:
      `Sei un coach CES. Valuta su Chiarezza, Tono/Empatia, Orientamento alla Soluzione, Assertività, Struttura. ` +
      `Rispondi SOLO con JSON valido.`,
  };
};

const buildParaverbalPrompt = (payload: any) => {
  const { transcript, scenario, task } = payload;
  return {
    prompt:
      `Valuta la traccia vocale trascritta.\n` +
      `**Scenario:** ${scenario}\n` +
      `**Compito:** ${task}\n` +
      `**Trascrizione:** "${transcript}"\n` +
      `Istruzioni: valuta ritmo, velocità, volume, tono, intonazione, articolazione, enfasi, pause, disfluenze; ` +
      `indica 3 punti di forza, 3 aree di miglioramento, 3 azioni pratiche, 1 micro-drill; ` +
      `fornisci "consegna annotata" (☐ pause, △ enfasi) e "ideal_script" per TTS. ` +
      `Rispondi SOLO con JSON valido.`,
    systemInstruction:
      `Sei CES Coach Engine (Voce Strategica). Rispondi SOLO con JSON valido.`,
  };
};

const buildProfilePrompt = (payload: any) => {
  const { analysisResults } = payload;
  const formatted = (analysisResults || []).map((r: any) =>
    `---\nEsercizio ID: ${r.exerciseId}\nPunteggio: ${r?.analysis?.score}\n` +
    `Forze: ${(r?.analysis?.strengths || []).join(', ')}\n` +
    `Aree: ${(r?.analysis?.areasForImprovement || []).map((a: any) => a?.suggestion).join(', ')}\n---`
  ).join('\n');
  return {
    prompt:
      `Ho completato un check-up. Ecco i risultati:\n\n${formatted}\n\n` +
      `Genera il "Profilo del Comunicatore" come JSON: ` +
      `{ "profileTitle": string, "profileDescription": string, "strengths": string[], "areasToImprove": string[] }. ` +
      `Rispondi SOLO con JSON valido.`,
    systemInstruction:
      `Sei un profiler di comunicazione. Sintetizza in modo chiaro e incoraggiante. Solo JSON.`,
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method Not Allowed' });

  try {
    const body = readBody(req);
    const { analysisType, payload } = body || {};
    if (!analysisType || !payload) return json(res, 400, { error: 'analysisType/payload mancanti' });

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return json(res, 500, { error: 'Missing GOOGLE_API_KEY on the server.' });

    let promptData: { prompt: string; systemInstruction: string };
    if (analysisType === 'text') promptData = buildTextPrompt(payload);
    else if (analysisType === 'paraverbal') promptData = buildParaverbalPrompt(payload);
    else if (analysisType === 'profile') promptData = buildProfilePrompt(payload);
    else return json(res, 400, { error: 'Invalid analysisType' });

    // ESM-safe dynamic import
    let GoogleGenerativeAI: any;
    try {
      ({ GoogleGenerativeAI } = await import('@google/generative-ai'));
    } catch (e: any) {
      console.error('IMPORT_ERROR @google/generative-ai:', e?.message || e);
      return json(res, 500, { error: 'Import failed: @google/generative-ai non disponibile. Installa la dipendenza nella root usata da Vercel.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: promptData.systemInstruction });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptData.prompt }]}],
    });

    const text = result?.response?.text?.();
    if (!text) return json(res, 502, { error: 'L’API non ha restituito testo.' });

    let data: any;
    try { data = JSON.parse(text.trim()); }
    catch (e) {
      console.error('JSON Parsing Error. Raw response:', text);
      return json(res, 500, { error: 'Formato risposta AI non valido (atteso JSON).' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return json(res, 200, { data });
  } catch (err: any) {
    console.error('ANALYZE_CRASH:', err?.stack || err);
    return json(res, 500, { error: err?.message || 'Errore interno.' });
  }
}