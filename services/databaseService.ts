import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, FirestoreError } from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';
import type { User, UserProgress, StorableEntitlements, Database } from '../types';

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Usiamo un singolo documento per mantenere una struttura simile a prima
const DB_DOC_REF = doc(db, 'ces-coach', 'main-database');

class DatabaseService {
    private dbState: Database = { users: [], userProgress: {}, entitlements: {} };
    private subscribers: (() => void)[] = [];
    private isInitialized = false;
    private unsubscribeFromFirestore: (() => void) | null = null;

    constructor() {
        this.listenForRealtimeUpdates();
    }

    private listenForRealtimeUpdates() {
        // Disiscriviti da eventuali listener precedenti per evitare duplicati
        if (this.unsubscribeFromFirestore) {
            this.unsubscribeFromFirestore();
        }

        this.unsubscribeFromFirestore = onSnapshot(DB_DOC_REF, (docSnap) => {
            if (docSnap.exists()) {
                // Esegui una validazione di base della struttura dati
                const data = docSnap.data();
                if (data && typeof data === 'object' && 'users' in data && 'userProgress' in data && 'entitlements' in data) {
                    this.dbState = data as Database;
                } else {
                    console.warn("Firestore document has an invalid structure. Resetting to default.");
                    this.dbState = { users: [], userProgress: {}, entitlements: {} };
                }
            } else {
                console.log("No database found in Firestore. A new one will be created on first save.");
                this.dbState = { users: [], userProgress: {}, entitlements: {} };
            }
            this.isInitialized = true;
            this.notify();
        }, (error: FirestoreError) => {
            console.error("Error listening to database updates:", error.message);
            // Se c'è un errore (es. permessi), usiamo uno stato vuoto e notifichiamo l'app.
            this.dbState = { users: [], userProgress: {}, entitlements: {} };
            this.isInitialized = true;
            this.notify();
        });
    }

    public subscribe(callback: () => void): () => void {
        this.subscribers.push(callback);
        if(this.isInitialized) {
            // Se il DB è già stato caricato, notifica subito il nuovo subscriber
            callback();
        }
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    private notify(): void {
        this.subscribers.forEach(callback => callback());
    }

    private async saveDatabase(): Promise<void> {
        try {
            // Il salvataggio sovrascrive l'intero documento
            await setDoc(DB_DOC_REF, this.dbState);
            // La notifica avverrà automaticamente grazie a onSnapshot
        } catch (error) {
            console.error('Error saving database to Firestore:', error);
            throw new Error("Impossibile salvare i dati nel database cloud. Controlla la configurazione di Firebase e i permessi.");
        }
    }

    public exportDatabase(): string {
        return JSON.stringify(this.dbState, null, 2);
    }

    public async importDatabase(jsonString: string): Promise<{ users: number; progress: number; entitlements: number }> {
        try {
            const importedDb: Database = JSON.parse(jsonString);
            if (!importedDb || typeof importedDb.users === 'undefined' || typeof importedDb.userProgress === 'undefined' || typeof importedDb.entitlements === 'undefined') {
                throw new Error("Il file JSON non ha una struttura valida.");
            }
            
            this.dbState = importedDb;
            await this.saveDatabase();

            return {
                users: this.dbState.users.length,
                progress: Object.keys(this.dbState.userProgress).length,
                entitlements: Object.keys(this.dbState.entitlements).length,
            };
        } catch (e: any) {
            console.error("Failed to import database:", e);
            throw new Error(`Errore durante l'importazione: ${e.message}`);
        }
    }

    public getAllUsers(): User[] {
        return JSON.parse(JSON.stringify(this.dbState.users));
    }

    public async saveAllUsers(users: User[]): Promise<void> {
        this.dbState.users = users;
        await this.saveDatabase();
    }

    public getAllProgress(): Record<string, UserProgress> {
        return JSON.parse(JSON.stringify(this.dbState.userProgress));
    }

    public async saveAllProgress(progress: Record<string, UserProgress>): Promise<void> {
        this.dbState.userProgress = progress;
        await this.saveDatabase();
    }

    public getAllEntitlements(): Record<string, StorableEntitlements> {
        return JSON.parse(JSON.stringify(this.dbState.entitlements));
    }
    
    public async saveAllEntitlements(entitlements: Record<string, StorableEntitlements>): Promise<void> {
        this.dbState.entitlements = entitlements;
        await this.saveDatabase();
    }
}

export const databaseService = new DatabaseService();
