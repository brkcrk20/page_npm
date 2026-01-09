'use client';

import { doc, DocumentData } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc, UseDocResult } from '@/firebase/firestore/use-doc';
import type { UserProfile } from '@/lib/types';

/**
 * React hook to fetch a specific user's profile from Firestore in real-time.
 * It gracefully handles cases where the userId is not available.
 *
 * @param {string | null | undefined} userId - The UID of the user whose profile is to be fetched.
 * @returns {UseDocResult<UserProfile>} An object containing the user profile data, loading state, and error.
 */
export function useUserProfile(userId: string | null | undefined): UseDocResult<UserProfile> {
  const firestore = useFirestore();

  // Memoize the document reference to prevent re-creating it on every render,
  // which would cause an infinite loop in the `useDoc` hook.
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !userId) {
      // If there's no Firestore instance or no userId, return null.
      // The `useDoc` hook will know not to start a subscription.
      return null;
    }
    // Create and return the document reference.
    return doc(firestore, 'users', userId) as DocumentData;
  }, [firestore, userId]);

  // Use the generic `useDoc` hook to subscribe to the document.
  // The type parameter `<UserProfile>` ensures that the returned data is correctly typed.
  return useDoc<UserProfile>(userProfileRef);
}
