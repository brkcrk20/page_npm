// This file defines the core data types based on the backend.json schema.

import type { entities } from '@/docs/backend.json';

// Utility type to extract property types from the JSON schema
type SchemaProperties<T extends { properties: any }> = T['properties'];

// Generate TypeScript types from the JSON schema in backend.json
export type PetListing = {
  id: string;
  species: SchemaProperties<typeof entities.PetListing>['species']['type'];
  breed: SchemaProperties<typeof entities.PetListing>['breed']['type'];
  name: SchemaProperties<typeof entities.PetListing>['name']['type'];
  description: SchemaProperties<typeof entities.PetListing>['description']['type'];
  age?: SchemaProperties<typeof entities.PetListing>['age']['type'];
  location: SchemaProperties<typeof entities.PetListing>['location']['type'];
  imageUrl: SchemaProperties<typeof entities.PetListing>['imageUrl']['type'];
  listingType: SchemaProperties<typeof entities.PetListing>['listingType']['type'];
  price?: SchemaProperties<typeof entities.PetListing>['price']['type'];
  userId: SchemaProperties<typeof entities.PetListing>['userId']['type'];
  isFeatured?: SchemaProperties<typeof entities.PetListing>['isFeatured']['type'];
};

export type UserProfile = {
  id: string;
  name: string;
  username: SchemaProperties<typeof entities.UserProfile>['username']['type'];
  email: SchemaProperties<typeof entities.UserProfile>['email']['type'];
  phoneNumber?: SchemaProperties<typeof entities.UserProfile>['phoneNumber']['type'];
  location?: SchemaProperties<typeof entities.UserProfile>['location']['type'];
  favoritePetIds?: string[];
  companyType?: SchemaProperties<typeof entities.UserProfile>['companyType']['enum'][number];
  companyTitle?: SchemaProperties<typeof entities.UserProfile>['companyTitle']['type'];
  taxNo?: SchemaProperties<typeof entities.UserProfile>['taxNo']['type'];
  taxOffice?: SchemaProperties<typeof entities.UserProfile>['taxOffice']['type'];
  companyAddress?: SchemaProperties<typeof entities.UserProfile>['companyAddress']['type'];
  tcNo?: SchemaProperties<typeof entities.UserProfile>['tcNo']['type'];
  userStatus?: SchemaProperties<typeof entities.UserProfile>['userStatus']['enum'][number];
  credit?: SchemaProperties<typeof entities.UserProfile>['credit']['type'];
};

// NOT: `Service` tipi buradan kaldırıldı ve src/types/firestore.ts içindeki
// yeni Firestore modeline taşındı (bkz. import { Service } from '@/types/firestore').
// name/description/address/phoneNumber/websiteUrl?/userId alanları birebir
// aynı kaldı; `type` alanı artık ServiceType enum'ı ile tipleniyor (değerler
// aynı string'lere karşılık geliyor). Bu tip yalnızca @/firebase/firestore/admin-hooks.tsx
// içinde generic parametre olarak kullanıldığından (runtime doğrulaması yok)
// taşıma hiçbir component davranışını değiştirmez.
