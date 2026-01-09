'use client';

import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { PetListing, UserProfile, Service } from '@/lib/types';


/**
 * Hook to fetch all pet listings from all users.
 * This is intended for admin use only and requires appropriate security rules.
 */
export function useAllPetListings() {
  const firestore = useFirestore();

  const listingsCollectionGroup = useMemo(() => {
    if (!firestore) return null;
    // collectionGroup query to get all documents from all 'petListings' subcollections
    return query(collection(firestore, 'petListings'));
  }, [firestore]);

  return useCollection<PetListing>(listingsCollectionGroup);
}

/**
 * Hook to fetch all user profiles.
 * This is intended for admin use only and requires appropriate security rules.
 */
export function useAllUsers() {
  const firestore = useFirestore();

  const usersCollection = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  return useCollection<UserProfile>(usersCollection);
}

/**
 * Hook to fetch all services from all users.
 * This is intended for admin use only and requires appropriate security rules.
 */
export function useAllServices() {
  const firestore = useFirestore();

  const servicesCollectionGroup = useMemo(() => {
    if (!firestore) return null;
    // collectionGroup query to get all documents from all 'services' subcollections
    return query(collection(firestore, 'services'));
  }, [firestore]);

  return useCollection<Service>(servicesCollectionGroup);
}
