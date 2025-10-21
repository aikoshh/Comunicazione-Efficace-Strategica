// services/monetizationService.ts
import type { Entitlements } from '../types';

/**
 * Checks if the user has PRO access based on their entitlements.
 * For this app, having any product ID in the set means PRO access.
 */
export const hasProAccess = (entitlements: Entitlements | null): boolean => {
  if (!entitlements) {
    return false;
  }
  // PRO access is granted if the user has purchased any product.
  return entitlements.productIDs.size > 0;
};
