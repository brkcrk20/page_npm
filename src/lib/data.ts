export type Pet = {
  id: string;
  name: string;
  type: 'Dog' | 'Cat' | 'Bird' | 'Other';
  breed: string;
  age: string;
  location: string;
  image: string; // Corresponds to an ID in placeholder-images.json
  featured: boolean;
  listingType: 'Adoption' | 'Sale';
  badge?: 'Bireysel' | 'Ruhsatlı';
};

export type Service = {
  id:string;
  name: string;
  type: 'Veterinarian' | 'Pet Hotel' | 'Trainer' | 'Groomer' | 'Pet Taxi' | 'Petshop';
  location: string;
  contact: string;
};

export const pets: Pet[] = [
  {
    id: '1',
    name: 'Pamuk',
    type: 'Cat',
    breed: 'Scottish Fold',
    age: '1.5 years',
    location: 'İstanbul',
    image: 'pet-2', // assuming pet-2 is a scottish fold
    featured: true,
    listingType: 'Adoption',
    badge: 'Bireysel',
  },
  {
    id: '2',
    name: 'Max',
    type: 'Dog',
    breed: 'Golden Retriever',
    age: '2 years',
    location: 'Bursa',
    image: 'pet-1',
    featured: true,
    listingType: 'Sale',
    badge: 'Ruhsatlı',
  },
  {
    id: '3',
    name: 'Luna',
    type: 'Cat',
    breed: 'Tekir',
    age: '1 year',
    location: 'Ankara',
    image: 'pet-7', // assuming pet-7 is a tekir
    featured: true,
    listingType: 'Adoption',
    badge: 'Bireysel',
  },
  {
    id: '4',
    name: 'Baron',
    type: 'Dog',
    breed: 'Fransız Bulldog',
    age: '3 years',
    location: 'İzmir',
    image: 'pet-3',
    featured: true,
    listingType: 'Sale',
    badge: 'Ruhsatlı',
  },
  {
    id: '5',
    name: 'Limon',
    type: 'Bird',
    breed: 'Muhabbet Kuşu',
    age: '6 months',
    location: 'Ankara',
    image: 'pet-6',
    featured: true,
    listingType: 'Adoption',
    badge: 'Bireysel',
  },
  {
    id: '6',
    name: 'Nemo',
    type: 'Other',
    breed: 'Japon Balığı',
    age: '1 year',
    location: 'Antalya',
    image: 'pet-9',
    featured: false,
    listingType: 'Adoption',
    badge: 'Bireysel',
  },
  {
    id: '7',
    name: 'Rocky',
    type: 'Dog',
    breed: 'German Shepherd',
    age: '4 years',
    location: 'Antalya, TR',
    image: 'pet-5',
    featured: false,
    listingType: 'Adoption',
  },
  {
    id: '8',
    name: 'Paşa',
    type: 'Dog',
    breed: 'Sivas Kangalı',
    age: '5 years',
    location: 'Sivas, TR',
    image: 'pet-8',
    featured: false,
    listingType: 'Adoption',
  },
];

export const featuredPets = pets.filter((pet) => pet.featured);

export const services: Service[] = [
  {
    id: '1',
    name: 'PatiKlinik Veteriner',
    type: 'Veterinarian',
    location: 'Kadıköy, Istanbul',
    contact: '0216 123 45 67',
  },
  {
    id: '2',
    name: 'Dost Otel',
    type: 'Pet Hotel',
    location: 'Çankaya, Ankara',
    contact: '0312 987 65 43',
  },
  {
    id: '3',
    name: 'Akademi Pet Eğitim',
    type: 'Trainer',
    location: 'Bornova, Izmir',
    contact: '0232 555 12 34',
  },
  {
    id: '4',
    name: 'StilPati Kuaför',
    type: 'Groomer',
    location: 'Nilüfer, Bursa',
    contact: '0224 444 55 66',
  },
  {
    id: '5',
    name: 'PatiTaksi Express',
    type: 'Pet Taxi',
    location: 'Muratpaşa, Antalya',
    contact: '0242 777 88 99',
  },
   {
    id: '9',
    name: 'MamaDostum Petshop',
    type: 'Petshop',
    location: 'Beşiktaş, Istanbul',
    contact: '0212 111 22 33',
  },
  {
    id: '6',
    name: 'VetAnkara 7/24',
    type: 'Veterinarian',
    location: 'Yenimahalle, Ankara',
    contact: '0312 234 56 78',
  },
  {
    id: '7',
    name: 'Konforlu Patiler Oteli',
    type: 'Pet Hotel',
    location: 'Beşiktaş, Istanbul',
    contact: '0212 345 67 89',
  },
  {
    id: '8',
    name: 'İzmir Pet Stil',
    type: 'Groomer',
    location: 'Karşıyaka, Izmir',
    contact: '0232 987 65 43',
  },
];
