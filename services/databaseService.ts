import type { Database, User, UserProgress, StorableEntitlements } from './types';

const DB_STORAGE_KEY = 'ces_coach_database.txt';

type Listener = () => void;

class DatabaseService {
    private db: Database;
    private listeners: Set<Listener> = new Set();

    constructor() {
        this.db = this.loadDatabase();
    }

    /**
     * Permette ai componenti di iscriversi per ricevere notifiche sui cambiamenti del database.
     * @param listener La funzione callback da eseguire quando i dati cambiano.
     * @returns Una funzione per annullare l'iscrizione.
     */
    public subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notifica tutti gli iscritti che i dati del database sono cambiati.
     */
    private notify(): void {
        this.listeners.forEach(listener => listener());
    }

    private loadDatabase(): Database {
        try {
            const dbString = localStorage.getItem(DB_STORAGE_KEY);
            if (dbString) {
                const parsedDb = JSON.parse(dbString);
                // Ensure all keys exist to prevent errors on older db versions
                return {
                    users: parsedDb.users || [],
                    userProgress: parsedDb.userProgress || {},
                    entitlements: parsedDb.entitlements || {},
                };
            }
        } catch (e) {
            console.error("Failed to load database from storage, starting fresh.", e);
        }
        // Return a default empty database structure if loading fails
        return {
            users: [],
            userProgress: {},
            entitlements: {},
        };
    }

    private saveDatabase(): void {
        try {
            localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.db));
            this.notify(); // Notifica tutti i componenti dell'avvenuto cambiamento
        } catch (e) {
            console.error("Failed to save database to storage", e);
        }
    }

    public exportDatabase(): string {
        return JSON.stringify(this.db, null, 2);
    }

    public importDatabase(jsonString: string): { users: number, progress: number, entitlements: number } {
        try {
            const newDb = JSON.parse(jsonString);

            if (typeof newDb !== 'object' || newDb === null) {
                throw new Error("Il file non contiene un oggetto JSON valido.");
            }
    
            const missingKeys: string[] = [];
            if (!('users' in newDb)) missingKeys.push('users');
            if (!('userProgress' in newDb)) missingKeys.push('userProgress');
            if (!('entitlements' in newDb)) missingKeys.push('entitlements');
    
            if (missingKeys.length > 0) {
                throw new Error(`Il file di database non è valido. Chiavi mancanti: ${missingKeys.join(', ')}.`);
            }
    
            if (!Array.isArray(newDb.users)) {
                throw new Error("La chiave 'users' nel database deve essere un array.");
            }
            if (typeof newDb.userProgress !== 'object' || Array.isArray(newDb.userProgress)) {
                 throw new Error("La chiave 'userProgress' nel database deve essere un oggetto.");
            }
            if (typeof newDb.entitlements !== 'object' || Array.isArray(newDb.entitlements)) {
                 throw new Error("La chiave 'entitlements' nel database deve essere un oggetto.");
            }

            this.db = newDb as Database;
            this.saveDatabase();
            
            return {
                users: this.db.users.length,
                progress: Object.keys(this.db.userProgress).length,
                entitlements: Object.keys(this.db.entitlements).length
            };
            
        } catch (e: any) {
            console.error("Errore durante l'importazione del database", e);
            if (e instanceof SyntaxError) {
                 throw new Error("Errore nel parsing del file di database. Assicurati che sia un file JSON valido.");
            }
            throw e;
        }
    }
    
    public deleteUser(email: string): boolean {
        const lowerEmail = email.toLowerCase();
        const userIndex = this.db.users.findIndex(u => u.email.toLowerCase() === lowerEmail);

        if (userIndex > -1) {
            // FIX: Get the user's original email *before* removing them from the list.
            const originalEmail = this.db.users[userIndex].email;

            // Remove user from the main list
            this.db.users.splice(userIndex, 1);
            
            // Remove associated data using the correct email
            if (this.db.userProgress && this.db.userProgress[originalEmail]) {
                delete this.db.userProgress[originalEmail];
            }
             if (this.db.entitlements && this.db.entitlements[originalEmail]) {
                delete this.db.entitlements[originalEmail];
            }
            
            // Save all changes
            this.saveDatabase();
            
            return true;
        }
        return false;
    }


    // --- Users ---
    public getAllUsers(): User[] {
        return this.db.users;
    }

    public saveAllUsers(users: User[]): void {
        this.db.users = users;
        this.saveDatabase();
    }

    // --- User Progress ---
    public getAllUserProgress(): Record<string, UserProgress> {
        return this.db.userProgress;
    }

    public saveAllUserProgress(progress: Record<string, UserProgress>): void {
        this.db.userProgress = progress;
        this.saveDatabase();
    }

    // --- Entitlements ---
    public getAllEntitlements(): Record<string, StorableEntitlements> {
        return this.db.entitlements;
    }
    
    public saveAllEntitlements(entitlements: Record<string, StorableEntitlements>): void {
        this.db.entitlements = entitlements;
        this.saveDatabase();
    }
}

export const databaseService = new DatabaseService();
