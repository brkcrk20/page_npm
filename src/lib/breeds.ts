
import { pets } from './data';
import type { Pet } from './data';
import type { ReactNode } from 'react';
import { Dog, Cat, Bird, Fish, PawPrint } from 'lucide-react';

export type Breed = {
  id: string;
  name: string;
};

// ----------------- RAW BREED DATA -----------------

const allDogBreedsData: Breed[] = [
  { id: 'd0', name: 'Toy Poodle' },
  { id: 'd1', name: 'Maltipoo' },
  { id: 'd2', name: 'Pomeranian Boo' },
  { id: 'd3', name: 'Maltese Terrier' },
  { id: 'd4', name: 'Border Collie' },
  { id: 'd5', name: 'Cane Corso' },
  { id: 'd6', name: 'Doberman' },
  { id: 'd7', name: 'Golden Retriever' },
  { id: 'd8', name: 'Çin Aslanı' },
  { id: 'd9', name: 'Sibirya Kurdu (Husky)' },
  { id: 'd10', name: 'Chihuahua' },
  { id: 'd11', name: 'Labrador Retriever' },
  { id: 'd12', name: 'Alman Kurdu' },
  { id: 'd13', name: 'Cavalier King Charles' },
  { id: 'd14', name: 'Akita Inu' },
  { id: 'd15', name: 'Dakhund - Sosis Köpek' },
  { id: 'd16', name: 'Rottweiler' },
  { id: 'd17', name: 'Labradoodle' },
  { id: 'd18', name: 'Yorkshire Terrier' },
  { id: 'd19', name: 'Belçika Kurdu' },
  { id: 'd20', name: 'French Bulldog' },
  { id: 'd21', name: 'Morkie' },
  { id: 'd22', name: 'Pug' },
  { id: 'd23', name: 'Beagle' },
  { id: 'd24', name: 'Pekinez' },
  { id: 'd25', name: 'Samoyed' },
  { id: 'd26', name: 'Amerikan Cocker' },
  { id: 'd27', name: 'Shih Tzu' },
  { id: 'd28', name: 'Bernese Dağ Köpeği' },
  { id: 'd29', name: 'Jack Russell Terrier' },
  { id: 'd30', name: 'Goldendoodle' },
  { id: 'd31', name: 'İngiliz Bulldog' },
  { id: 'd32', name: 'İngiliz Cocker' },
  { id: 'd33', name: 'corgi' },
  { id: 'd34', name: 'Pincher' },
  { id: 'd35', name: 'Shiba Köpek' },
  { id: 'd36', name: 'Cockapoo' },
  { id: 'd37', name: 'Alabay (Alabai)' },
  { id: 'd38', name: 'Kangal' },
  { id: 'd39', name: 'bernedoodle' },
  { id: 'd40', name: 'Bişon Çuha Köpeği' },
  { id: 'd41', name: 'Wolfdog' },
  { id: 'd42', name: 'Cavapoo' },
  { id: 'd43', name: 'Schnauzer' },
  { id: 'd44', name: 'American Bully' },
  { id: 'd45', name: 'Avustralya Çoban Köpeği' },
  { id: 'd46', name: 'Saint Bernard' },
  { id: 'd47', name: 'Spitz' },
  { id: 'd48', name: 'Dalmaçyalı' },
  { id: 'd49', name: 'Danua (Great Dane)' },
  { id: 'd50', name: 'İngiliz Staffordshire' },
  { id: 'd51', name: 'Akbaş' },
  { id: 'd52', name: 'Alaska Kurdu' },
  { id: 'd53', name: 'Dogo Argentino' },
  { id: 'd54', name: 'Fransız Mastiff' },
  { id: 'd55', name: 'Havanese' },
  { id: 'd56', name: 'Kafkas Çoban Köpeği' },
  { id: 'd57', name: 'Lagotto Romagnolo' },
  { id: 'd58', name: 'Newfoundland Köpek' },
  { id: 'd59', name: 'Pitbull' },
  { id: 'd60', name: 'Süs Köpeği' },
  { id: 'd61', name: 'Tibet Mastifi' }
];

const allCatBreedsData: Breed[] = [
  { id: 'c0', name: 'British Shorthair' },
  { id: 'c1', name: 'Scottish Fold' },
  { id: 'c2', name: 'Tekir' },
  { id: 'c3', name: 'British Longhair' },
  { id: 'c4', name: 'Maine Coon' },
  { id: 'c5', name: 'Sfenks Kedisi' },
  { id: 'c6', name: 'İran Kedisi' },
  { id: 'c7', name: 'Scottish Straight' },
  { id: 'c8', name: 'Scottish Fold Longhair' },
  { id: 'c9', name: 'Ankara Kedisi' },
  { id: 'c10', name: 'Chinchilla' },
  { id: 'c11', name: 'Exotic Shorthair' },
  { id: 'c12', name: 'Munchkin Kedisi' },
  { id: 'c13', name: 'Ragdoll Kedisi' },
  { id: 'c14', name: 'Sarman Kedi' },
  { id: 'c15', name: 'Siyam' },
  { id: 'c16', name: 'Van Kedisi' }
];

const allBirdBreedsData: Breed[] = [
    { id: 'b0', name: "Muhabbet Kuşu" },
    { id: 'b1', name: "Sultan Papağanı" },
    { id: 'b2', name: "Papağan" },
    { id: 'b3', name: "Kanarya" },
    { id: 'b4', name: "Hint Bülbülü" },
    { id: 'b5', name: "Cennet Papağanı" },
    { id: 'b6', name: "Forpus Papağanı" }
];

const allAquariumBreedsData: Breed[] = [
    { id: 'a0', name: "Japon Balığı" },
    { id: 'a1', name: "Lepistes" },
    { id: 'a2', name: "Beta" },
    { id: 'a3', name: "Melek Balığı" },
    { id: 'a4', name: "Ciklet" },
    { id: 'a5', name: "Vatoz" },
    { id: 'a6', name: "Neon Tetra" },
    { id: 'a7', name: "Discus" },
    { id: 'a8', name: "Moli" },
    { id: 'a9', name: "Kılıçkuyruk" },
    { id: 'a10', name: "Karides" }
];

const allOtherBreedsData: Breed[] = [
    { id: 'o0', name: "Hamster" },
    { id: 'o1', name: "Tavşan" },
    { id: 'o2', name: "Guineapig" },
    { id: 'o3', name: "Kaplumbağa" },
    { id: 'o4', name: "Iguana" }
];

// Re-export for legacy usage if needed, but prefer processed data
export const allDogBreeds: Breed[] = allDogBreedsData;
export const allCatBreeds: Breed[] = allCatBreedsData;
export const allBirdBreeds: Breed[] = allBirdBreedsData;
export const allAquariumBreeds: Breed[] = allAquariumBreedsData;
export const allOtherBreeds: Breed[] = allOtherBreedsData;

export const allBreeds = [
    ...allDogBreedsData,
    ...allCatBreedsData,
    ...allBirdBreedsData,
    ...allAquariumBreedsData,
    ...allOtherBreedsData
];

// ----------------- PROCESSED CATEGORY DATA -----------------

export type BreedInfo = {
  id: string;
  name: string;
  count: number;
};

export type CategoryInfo = {
  type: 'Dog' | 'Cat' | 'Bird' | 'Aquarium' | 'Other';
  breeds: BreedInfo[];
  Icon: React.ElementType;
  color: string;
  title: string;
  slug: string;
};

// 1. Get counts of breeds that are in the pet listings
const countsByType = pets.reduce((acc, pet) => {
    const { type, breed } = pet;
    if (!acc[type]) acc[type] = {};
    if (!acc[type][breed]) acc[type][breed] = 0;
    acc[type][breed]++;
    return acc;
}, {} as Record<Pet['type'], Record<string, number>>);

// 2. Function to merge static breed list with dynamic counts
const processBreeds = (
  allBreeds: Breed[], 
  breedCounts: Record<string, number> | undefined
): BreedInfo[] => {
  const breedInfo = allBreeds.map(breed => ({
    id: breed.id,
    name: breed.name,
    count: breedCounts?.[breed.name] || 0,
  }));
  // Sort by count descending, then alphabetically using a specific locale
  return breedInfo.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name, 'tr');
  });
};

// 3. Create the final, pre-processed categories array
export const categories: CategoryInfo[] = [
  {
    type: 'Dog',
    title: 'Köpek İlanları',
    slug: 'kopek-ilanlari',
    Icon: Dog,
    color: 'text-orange-500',
    breeds: processBreeds(allDogBreedsData, countsByType.Dog),
  },
  {
    type: 'Cat',
    title: 'Kedi İlanları',
    slug: 'kedi-ilanlari',
    Icon: Cat,
    color: 'text-red-400',
    breeds: processBreeds(allCatBreedsData, countsByType.Cat),
  },
  {
    type: 'Bird',
    title: 'Kuş İlanları',
    slug: 'kus-ilanlari',
    Icon: Bird,
    color: 'text-sky-400',
    breeds: processBreeds(allBirdBreedsData, countsByType.Bird),
  },
  {
    type: 'Aquarium',
    title: 'Akvaryum İlanları',
    slug: 'akvaryum-ilanlari',
    Icon: Fish,
    color: 'text-blue-400',
    breeds: processBreeds(allAquariumBreedsData, countsByType.Aquarium),
  },
   {
    type: 'Other',
    title: 'Diğer İlanlar',
    slug: 'diger-ilanlar',
    Icon: PawPrint,
    color: 'text-emerald-500',
    breeds: processBreeds(allOtherBreedsData, countsByType.Other),
  },
];
