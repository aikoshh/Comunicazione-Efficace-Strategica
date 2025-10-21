// firebaseConfig.ts
// 1. Vai su https://console.firebase.google.com/ e crea un nuovo progetto (è gratuito).
// 2. Nel tuo progetto, vai su "Impostazioni progetto" (icona a forma di ingranaggio).
// 3. Nella tab "Generali", in fondo, clicca su "Aggiungi app" e seleziona l'icona web </>.
// 4. Registra l'app (puoi usare un nome come "ces-coach-web").
// 5. Firebase ti fornirà un oggetto `firebaseConfig`. Copia i valori e incollali qui sotto.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// === INCOLLA QUI LA TUA CONFIGURAZIONE FIREBASE ===
const firebaseConfig = {
  apiKey: "INCOLLA-QUI-apiKey",
  authDomain: "INCOLLA-QUI-authDomain",
  projectId: "INCOLLA-QUI-projectId",
  storageBucket: "INCOLLA-QUI-storageBucket",
  messagingSenderId: "INCOLLA-QUI-messagingSenderId",
  appId: "INCOLLA-QUI-appId"
};
// =================================================

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Esporta l'istanza di Firestore
export const db = getFirestore(app);
