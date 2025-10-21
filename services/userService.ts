import type { User } from '../types';
import { databaseService } from './databaseService';

const DEFAULT_ADMIN_EMAIL = "aikos@libero.it";
const DEFAULT_ADMIN_PASSWORD = "aaa";

class UserManager {
    // Rimuoviamo lo stato interno 'users'. Lo leggeremo sempre dalla fonte (databaseService)
    
    constructor() {
        // La logica di caricamento e aggiornamento è ora gestita da databaseService
        // e dai componenti che si iscrivono ad esso.
        this.ensureAdminExistsOnFirstLoad();
    }

    private async hashPassword(password: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-2-56', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Questa funzione speciale viene eseguita solo una volta per assicurarsi che l'admin esista.
    private ensureAdminExistsOnFirstLoad(): void {
        const unsubscribe = databaseService.subscribe(async () => {
            // Una volta che il DB è caricato, esegui il controllo
            const users = databaseService.getAllUsers();
            if (!users.find(u => u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase())) {
                console.log('Default admin user not found. Creating one...');
                // Disiscriviti subito per evitare loop
                unsubscribe(); 
                await this.addUser(
                    DEFAULT_ADMIN_EMAIL,
                    DEFAULT_ADMIN_PASSWORD,
                    'Amministratore',
                    '',
                    true // isAdmin
                );
                console.log('Default admin user created.');
            } else {
                // L'admin esiste, possiamo disiscriverci
                unsubscribe();
            }
        });
    }

    // Le funzioni ora leggono direttamente da databaseService
    public getUser(email: string): User | undefined {
        const users = databaseService.getAllUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
    
    public listUsers(): User[] {
        const users = databaseService.getAllUsers();
        return [...users].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    public async addUser(email: string, password: string, firstName: string, lastName: string, isAdmin: boolean = false, daysTrial: number = 7): Promise<User> {
        const users = databaseService.getAllUsers();
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error(`L'utente ${email} esiste già.`);
        }
        
        const expiryDate = isAdmin ? null : new Date(Date.now() + daysTrial * 24 * 60 * 60 * 1000).toISOString();
        const passwordHash = await this.hashPassword(password);
        
        const newUser: User = {
            email: email.trim(),
            passwordHash,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            createdAt: new Date().toISOString(),
            expiryDate,
            isAdmin,
            enabled: true,
        };
        
        await databaseService.saveAllUsers([...users, newUser]);
        return newUser;
    }
    
    public async authenticate(email: string, password: string): Promise<{ user: User | null; expired: boolean }> {
        const user = this.getUser(email);
        if (!user) {
            return { user: null, expired: false };
        }

        const passwordHash = await this.hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            return { user: null, expired: false };
        }

        const now = new Date();
        const isExpired = user.expiryDate ? new Date(user.expiryDate) < now : false;

        if (!user.enabled || isExpired) {
            if (user.enabled && isExpired) {
                user.enabled = false;
                await this.updateUser(user.email, { enabled: false }); // Salva la modifica
            }
            if (user.isAdmin) {
                 return { user, expired: false };
            }
            return { user: null, expired: true };
        }

        return { user, expired: false };
    }

    public async deleteUser(email: string): Promise<boolean> {
        let users = databaseService.getAllUsers();
        const initialLength = users.length;
        users = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
        
        if (users.length < initialLength) {
            await databaseService.saveAllUsers(users);
            return true;
        }
        return false;
    }

    public async updateUser(email: string, updates: Partial<Pick<User, 'firstName' | 'lastName' | 'isAdmin' | 'enabled' | 'expiryDate'>> & { password?: string }): Promise<User | null> {
        const users = databaseService.getAllUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return null;

        if (updates.firstName) user.firstName = updates.firstName;
        if (updates.lastName) user.lastName = updates.lastName;
        if (typeof updates.isAdmin === 'boolean') user.isAdmin = updates.isAdmin;
        if (typeof updates.enabled === 'boolean') user.enabled = updates.enabled;
        if ('expiryDate' in updates) user.expiryDate = updates.expiryDate;
        if (updates.password) {
            user.passwordHash = await this.hashPassword(updates.password);
        }
        
        await databaseService.saveAllUsers(users);
        return user;
    }
    
    public async extendSubscription(email: string, additionalDays: number = 30): Promise<User | null> {
        const users = databaseService.getAllUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return null;
        if (user.isAdmin || !user.expiryDate) return user;

        const now = new Date();
        const expiry = new Date(user.expiryDate);
        const newExpiry = (expiry < now ? now : expiry);
        newExpiry.setDate(newExpiry.getDate() + additionalDays);
        
        user.expiryDate = newExpiry.toISOString();
        user.enabled = true; // Re-enable the user
        
        await databaseService.saveAllUsers(users);
        return user;
    }
}

export const userService = new UserManager();
