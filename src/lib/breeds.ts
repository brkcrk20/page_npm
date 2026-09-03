
import type { ReactNode } from 'react';
import { Dog, Cat, Bird, Fish, PawPrint } from 'lucide-react';

const slugify = (text: string) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

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
  slug: string;
  /** Gerçek sayım veritabanından gelir; burada her zaman 0. */
  count: number;
};

export type CategoryInfo = {
  type: 'Dog' | 'Cat' | 'Bird' | 'Aquarium' | 'Other' | 'Pigeon';
  breeds: BreedInfo[];
  Icon: React.ElementType;
  color: string;
  title: string;
  slug: string;
};

const allPigeonBreedsData: Breed[] = [
  { id: 'p0', name: 'Taklacı Güvercin' },
  { id: 'p1', name: 'Adana Taklacısı' },
  { id: 'p2', name: 'Mardin Taklacısı' },
  { id: 'p3', name: 'Urfa Taklacısı' },
  { id: 'p4', name: 'Antep Taklacısı' },
  { id: 'p5', name: 'Posta Güvercini' },
  { id: 'p6', name: 'Yarış Güvercini' },
  { id: 'p7', name: 'Dolapçı Güvercin' },
  { id: 'p8', name: 'Miralay Güvercin' },
  { id: 'p9', name: 'Şebab Güvercin' },
  { id: 'p10', name: 'Bango Güvercin' },
  { id: 'p11', name: 'Kelebek Güvercin' },
  { id: 'p12', name: 'Makaracı Güvercin' },
  { id: 'p13', name: 'Oynar Güvercin' },
  { id: 'p14', name: 'Şam Güvercini' },
  { id: 'p15', name: 'Halep Güvercini' },
  { id: 'p16', name: 'Hünkari Güvercin' },
  { id: 'p17', name: 'Kuşkuş Güvercin' },
  { id: 'p18', name: 'Tekir Güvercin' },
  { id: 'p19', name: 'Süs Güvercini' },
  { id: 'p20', name: 'Pofuduk Güvercin' },
  { id: 'p21', name: 'Kuyruklu (Tavus) Güvercin' },
  { id: 'p22', name: 'Guatrlı Güvercin' },
  { id: 'p23', name: 'Karma / Melez Güvercin' },
];

// Cins listesi ve sıralaması.
//
// İlan sayıları burada hesaplanmıyor: sayımlar veritabanındaki
// breed_listing_counts view'ından geliyor (bkz. queries/catalog.ts).
// Bu dosya yalnızca kanonik cins listesini tutuyor ve statik yedek olarak
// kullanılıyor (static-catalog.ts).
const processBreeds = (allBreeds: Breed[]): BreedInfo[] =>
  allBreeds
    .map((breed) => ({
      id: breed.id,
      name: breed.name,
      slug: slugify(breed.name),
      count: 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

// 3. Create the final, pre-processed categories array
export const categories: CategoryInfo[] = [
  {
    type: 'Dog',
    title: 'Köpek İlanları',
    slug: 'kopek-ilanlari',
    Icon: Dog,
    color: 'text-orange-500',
    breeds: processBreeds(allDogBreedsData),
  },
  {
    type: 'Cat',
    title: 'Kedi İlanları',
    slug: 'kedi-ilanlari',
    Icon: Cat,
    color: 'text-red-400',
    breeds: processBreeds(allCatBreedsData),
  },
  {
    type: 'Bird',
    title: 'Kuş İlanları',
    slug: 'kus-ilanlari',
    Icon: Bird,
    color: 'text-sky-400',
    breeds: processBreeds(allBirdBreedsData),
  },
  {
    type: 'Aquarium',
    title: 'Akvaryum İlanları',
    slug: 'akvaryum-ilanlari',
    Icon: Fish,
    color: 'text-blue-400',
    breeds: processBreeds(allAquariumBreedsData),
  },
  {
    type: 'Pigeon',
    title: 'Güvercin İlanları',
    slug: 'guvercin-ilanlari',
    Icon: Bird,
    color: 'text-slate-500',
    breeds: processBreeds(allPigeonBreedsData),
  },
   {
    type: 'Other',
    title: 'Diğer İlanlar',
    slug: 'diger-ilanlar',
    Icon: PawPrint,
    color: 'text-emerald-500',
    breeds: processBreeds(allOtherBreedsData),
  },
];
