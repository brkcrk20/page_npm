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
  username: SchemaProperties<typeof entities.UserProfile>['username']['type'];
  email: SchemaProperties<typeof entities.UserProfile>['email']['type'];
  phoneNumber?: SchemaProperties<typeof entities.UserProfile>['phoneNumber']['type'];
  location?: SchemaProperties<typeof entities.UserProfile>['location']['type'];
  favoritePetIds?: string[];
};

export type Service = {
  id: string;
  name: SchemaProperties<typeof entities.Service>['name']['type'];
  type: SchemaProperties<typeof entities.Service>['type']['type'];
  description: SchemaProperties<typeof entities.Service>['description']['type'];
  address: SchemaProperties<typeof entities.Service>['address']['type'];
  phoneNumber: SchemaProperties<typeof entities.Service>['phoneNumber']['type'];
  websiteUrl?: SchemaProperties<typeof entities.Service>['websiteUrl']['type'];
  userId: SchemaProperties<typeof entities.Service>['userId']['type'];
};
