/**
 * Uygulama tipleri.
 *
 * Eskiden bu dosya docs/backend.json (Firebase Studio şema dosyası) üzerinden
 * tip türetiyordu. Firebase kaldırıldığı için tipler artık doğrudan
 * veritabanından üretiliyor: src/lib/supabase/database.types.ts
 * (npm run db:types ile yeniden üretilir).
 */

import type { Database } from '@/lib/supabase/database.types';

export type PetListing = Database['public']['Tables']['listings']['Row'];
export type UserProfile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Breed = Database['public']['Tables']['breeds']['Row'];
export type City = Database['public']['Tables']['cities']['Row'];
export type District = Database['public']['Tables']['districts']['Row'];
export type ListingPhoto = Database['public']['Tables']['listing_photos']['Row'];

export type ListingKind = Database['public']['Enums']['listing_kind'];
export type ListingStatus = Database['public']['Enums']['listing_status'];
export type PetGender = Database['public']['Enums']['pet_gender'];
