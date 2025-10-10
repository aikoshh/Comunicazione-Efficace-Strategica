<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1fP6LkNjuAICHlBvkA8YGTY5Ou5rXhYWm

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`



## 🔌 Proxy esterno (consigliato): Google Apps Script

Per evitare problemi di API su Vercel, il frontend NON chiama direttamente Gemini/AI Studio.
Invece invia una richiesta POST a un proxy (es. Google Apps Script) che custodisce la tua API Key
e inoltra la richiesta al modello.

### 1) Crea la Web App su Google Apps Script
1. Vai su https://script.google.com → **Nuovo progetto**.
2. Incolla questo codice:

```js
const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    // Adatta qui sotto l'endpoint al modello che usi in AI Studio
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY;

    const resp = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(body) }]}]
      }),
      muteHttpExceptions: true,
    });

    return ContentService.createTextOutput(resp.getContentText())
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. **Project Settings → Script properties** → aggiungi `GEMINI_API_KEY` con la tua chiave.
4. **Deploy → New deployment → Web app** → accesso: **Anyone with the link**.
5. Copia l’URL finale (termina con `/exec`).

### 2) Configura l’endpoint nel frontend
Hai tre modi (in ordine di priorità):

- **A. Variabile Vite**: su Vercel → Project → Settings → Environment Variables  
  `VITE_PROXY_URL = https://script.google.com/macros/s/…/exec` → Redeploy

- **B. Meta tag**: in `index.html` c’è:  
  `<meta name="ces-proxy-url" content="">`  
  Inserisci l’URL nel campo `content` (e fai il deploy).

- **C. Fallback hardcoded**: in `services/geminiService.ts` c'è una costante fallback  
  `return 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_APPS_SCRIPT_DEPLOYMENT_ID/exec'`  
  Sostituisci `REPLACE_WITH_YOUR_APPS_SCRIPT_DEPLOYMENT_ID` e deploya.

> Il service invia oggetti del tipo `{ analysisType, payload }`. Adegua la logica lato Apps Script per usare questi campi e costruire la request per il modello come desideri.

### 3) Debug rapido
- Apri DevTools → Console: vedrai `[geminiService] POST …` con status/JSON.
- Se `VITE_PROXY_URL` non è definita, controlla che il redeploy sia stato fatto.
- Se il meta è vuoto, aggiungi il content e redeploya.
- Se ricevi 405/404, assicurati che l’URL del proxy sia quello `/exec` della Web App.
