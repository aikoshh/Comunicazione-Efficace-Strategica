// services/analyzeService.ts
export async function analyzeText(prompt: string, images?: Array<{ mimeType: string; data: string }>) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, images }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Propaga l’errore reale (così non vedi solo "Riprova più tardi")
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json.data;
}
