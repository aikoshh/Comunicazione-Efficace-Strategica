// services/firebaseService.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from '../firebaseConfig';

let app;
let auth;
let db;

try {
  // Controlla che la configurazione non sia quella di default
  if (firebaseConfig.apiKey.startsWith('INCOLLA-QUI')) {
      throw new Error("La configurazione di Firebase non è stata inserita. Compila il file `firebaseConfig.ts`.");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Errore di inizializzazione Firebase:", error);
  // Rilancia l'errore per bloccare l'app e mostrare un messaggio chiaro
  throw error;
}

export { app, auth, db };
