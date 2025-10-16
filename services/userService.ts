import type { User } from '../types';
import { databaseService } from './databaseService';

const DEFAULT_ADMIN_EMAIL = "aikos@libero.it";
const DEFAULT_ADMIN_PASSWORD = "aaa";

class UserManager {
    private users: User[] = [];

    constructor() {
        this.loadUsers();
        this.ensureAdminExists();
    }

    private async hashPassword(password: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    private loadUsers(): void {
        this.users = databaseService.getAllUsers();
    }

    private saveUsers(): void {
        databaseService.saveAllUsers(this.users);
    }

    private async ensureAdminExists(): Promise<void> {
        const admin = this.getUser(DEFAULT_ADMIN_EMAIL);
        if (!admin) {
            await this.addUser(
                DEFAULT_ADMIN_EMAIL,
                DEFAULT_ADMIN_PASSWORD,
                'Amministratore',
                '',
                true // isAdmin
            );
            console.log('Default admin user created.');
        }
    }

    public getUser(email: string): User | undefined {
        return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
    
    public listUsers(): User[] {
        return [...this.users].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    public async addUser(email: string, password: string, firstName: string, lastName: string, isAdmin: boolean = false, daysTrial: number = 7): Promise<User> {
        if (this.getUser(email)) {
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
        
        this.users.push(newUser);
        this.saveUsers();
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
                // Disable expired user upon authentication attempt
                user.enabled = false;
                this.saveUsers();
            }
            // As per python script logic, admin can login even if expired/disabled
            if (user.isAdmin) {
                 return { user, expired: false };
            }
            return { user: null, expired: true };
        }

        return { user, expired: false };
    }

    public deleteUser(email: string): boolean {
        const userIndex = this.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (userIndex > -1) {
            this.users.splice(userIndex, 1);
            this.saveUsers();
            return true;
        }
        return false;
    }

    public async updateUser(email: string, updates: Partial<Pick<User, 'firstName' | 'lastName' | 'isAdmin' | 'enabled' | 'expiryDate'>> & { password?: string }): Promise<User | null> {
        const user = this.getUser(email);
        if (!user) return null;

        if (updates.firstName) user.firstName = updates.firstName;
        if (updates.lastName) user.lastName = updates.lastName;
        if (typeof updates.isAdmin === 'boolean') user.isAdmin = updates.isAdmin;
        if (typeof updates.enabled === 'boolean') user.enabled = updates.enabled;
        if ('expiryDate' in updates) user.expiryDate = updates.expiryDate;
        if (updates.password) {
            user.passwordHash = await this.hashPassword(updates.password);
        }
        
        this.saveUsers();
        return user;
    }
    
    public extendSubscription(email: string, additionalDays: number = 30): User | null {
        const user = this.getUser(email);
        if (!user) return null;
        if (user.isAdmin || !user.expiryDate) return user;

        const now = new Date();
        const expiry = new Date(user.expiryDate);
        const newExpiry = (expiry < now ? now : expiry);
        newExpiry.setDate(newExpiry.getDate() + additionalDays);
        
        user.expiryDate = newExpiry.toISOString();
        user.enabled = true; // Re-enable the user
        
        this.saveUsers();
        return user;
    }
}

export const userService = new UserManager();
