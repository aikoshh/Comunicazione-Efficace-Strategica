# CES Coach – Patch per Vercel + Gemini

Questa patch rende l'app Vite/React compatibile con Vercel e sposta **tutte** le chiamate AI su funzioni serverless:
- `api/health.ts` → diagnostica env
- `api/analyze.ts` → proxy server-side verso Gemini (SDK @google/generative-ai)
- `services/analyzeService.ts` → client che chiama `/api/analyze`
- `vercel.json` → rewrites per SPA

## Passi per il deploy
1. Imposta su Vercel l'env: `GOOGLE_API_KEY`
2. **Root Directory**: usa la cartella che contiene `package.json` e `api/`
3. Redeploy
4. Test:
   - `/api/health` → `{ ok: true, env: true }`
   - Esegui un esercizio e verifica che `/api/analyze` risponda 200 nel tab Network

## Note
- Rimosso `@google/genai`, aggiunto `@google/generative-ai`
- Dynamic import ESM-safe per evitare crash CJS/ESM
