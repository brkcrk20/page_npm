export type Pet = {
  id: string;
  name: string;
  type: 'Dog' | 'Cat' | 'Bird' | 'Aquarium' | 'Other';
  breed: string;
  age: string;
  location: string;
  image: string; // Corresponds to an ID in placeholder-images.json
  featured: boolean;
  listingType: 'Adoption' | 'Sale';
  badge?: 'Bireysel' | 'Ruhsatlı' | 'Guvenli Uye' | 'Doping';
};

export type Service = {
  id:string;
  name: string;
  type: 'Veterinarian' | 'Pet Hotel' | 'Trainer' | 'Groomer' | 'Pet Taxi' | 'Petshop' | 'Walker';
  location: string;
  contact: string;
};

// ---------------------------------------------------------------------------
// SAHTE VERİ KALDIRILDI
//
// Bu dosya eskiden demo amaçlı statik ilan ve hizmet kayıtları tutuyordu ve
// bunlar ana sayfada gerçek ilanlarla aynı listede gösteriliyordu. Canlı bir
// ilan sitesinde bu hem kullanıcıyı yanıltır hem de arama motorlarına gerçek
// olmayan içerik verir.
//
// Artık tüm ilanlar Supabase'deki public.listings tablosundan geliyor
// (bkz. supabase/migrations/0004_listings.sql). Tipler ve boş diziler,
// bu dosyayı import eden sayfalar Supabase'e taşınana kadar duruyor —
// böylece hiçbir sayfa kırılmıyor, sadece boş liste gösteriyor.
//
// TODO: Aşağıdaki sayfalar Supabase sorgularına taşınınca bu dosya silinecek:
//   kus-ilanlari, akvaryum-ilanlari, diger-ilanlar, es-arayanlar
//   veteriner, pet-oteli, pet_kuafor, pet_taksi, petshop, gezdirici, egitmen
// ---------------------------------------------------------------------------

export const pets: Pet[] = [];

export const featuredPets = pets.filter((pet) => pet.featured);

export const services: Service[] = [];
