import type { Entitlements, Product, User, StorableEntitlements } from '../types';
import { databaseService } from './databaseService';

// Simulate a delay to mimic network latency for user feedback
const simulateNetworkDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

const defaultEntitlements: Entitlements = {
    productIDs: new Set(),
    teamSeats: 0,
    teamActive: false,
};

// --- Public API for the service ---

export const getUserEntitlements = (user: User | null): Entitlements => {
    if (!user) return { ...defaultEntitlements, productIDs: new Set() };

    const allEntitlements = databaseService.getAllEntitlements();
    const userEntitlements = allEntitlements[user.email];

    if (userEntitlements) {
        return { ...defaultEntitlements, ...userEntitlements, productIDs: new Set(userEntitlements.productIDs || []) };
    }

    return { ...defaultEntitlements, productIDs: new Set() };
};

export const purchaseProduct = async (user: User | null, product: Product): Promise<Entitlements> => {
    await simulateNetworkDelay(1500);
    if (!user) throw new Error("Utente non autenticato. Impossibile completare l'acquisto.");
    
    const currentEntitlements = getUserEntitlements(user);
    const newProductIDs = new Set(currentEntitlements.productIDs);
    newProductIDs.add(product.id);

    const updatedEntitlements: Entitlements = {
        ...currentEntitlements,
        productIDs: newProductIDs,
        teamActive: product.type === 'subscription',
    };
    
    const allEntitlements = databaseService.getAllEntitlements();
    const storable: StorableEntitlements = {
        ...updatedEntitlements,
        productIDs: Array.from(updatedEntitlements.productIDs),
    };
    allEntitlements[user.email] = storable;
    await databaseService.saveAllEntitlements(allEntitlements);

    return updatedEntitlements;
};

export const restorePurchases = async (user: User | null): Promise<Entitlements> => {
    await simulateNetworkDelay(1000);
    if (!user) throw new Error("Utente non autenticato. Impossibile ripristinare gli acquisti.");

    return getUserEntitlements(user);
};

export const hasEntitlement = (entitlements: Entitlements | null, productId: string): boolean => {
    if (!entitlements) return false;
    return entitlements.productIDs.has(productId);
};

export const hasProAccess = (entitlements: Entitlements | null): boolean => {
    if (!entitlements) return false;
    return entitlements.productIDs.has('ces.pro.monthly');
};
