import type { Entitlements, Product, UserProfile, StorableEntitlements } from '../types';
import { databaseService } from './firebase';

// Simulate a delay to mimic network latency
const simulateNetworkDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

const defaultEntitlements: Entitlements = {
    productIDs: new Set(),
    teamSeats: 0,
    teamActive: false,
};

// --- Public API for the service ---

/**
 * Retrieves user entitlements from the central database.
 * If none are found, initializes with default values.
 */
export const getUserEntitlements = async (user: UserProfile | null): Promise<Entitlements> => {
    await simulateNetworkDelay(200);
    if (!user) return { ...defaultEntitlements, productIDs: new Set() };

    const userEntitlements = await databaseService.getUserEntitlements(user.uid);

    if (userEntitlements) {
        // Convert array of IDs back to a Set
        return { ...defaultEntitlements, ...userEntitlements, productIDs: new Set(userEntitlements.productIDs || []) };
    }

    return { ...defaultEntitlements, productIDs: new Set() };
};

/**
 * Simulates restoring purchases.
 */
export const restorePurchases = async (user: UserProfile | null): Promise<Entitlements> => {
    await simulateNetworkDelay(1000);
    if (!user) throw new Error("Utente non autenticato. Impossibile ripristinare gli acquisti.");

    console.log(`Simulating restoring purchases for ${user.email}`);
    // Since we are using the central DB, "restoring" is the same as getting.
    return getUserEntitlements(user);
};

/**
 * Checks if the user has a specific entitlement.
 */
export const hasEntitlement = (entitlements: Entitlements | null, productId: string): boolean => {
    if (!entitlements) return false;
    return entitlements.productIDs.has(productId);
};

/**
 * Checks if the user has access to any PRO features.
 */
export const hasProAccess = (entitlements: Entitlements | null): boolean => {
    if (!entitlements) return false;
    return entitlements.productIDs.has('ces.pro.monthly');
};