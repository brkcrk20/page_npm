
export type Breed = {
  id: string;
  name: string;
  slug: string;
};

export const allDogBreeds: Breed[] = [
  { id: 'd0', name: 'Toy Poodle', slug: 'toy-poodle' },
  { id: 'd1', name: 'Maltipoo', slug: 'maltipoo' },
  { id: 'd2', name: 'Pomeranian Boo', slug: 'pomeranian-boo' },
  { id: 'd3', name: 'Maltese Terrier', slug: 'maltese-terrier' },
  { id: 'd4', name: 'Border Collie', slug: 'border-collie' },
  { id: 'd5', name: 'Cane Corso', slug: 'cane-corso' },
  { id: 'd6', name: 'Doberman', slug: 'doberman' },
  { id: 'd7', name: 'Golden Retriever', slug: 'golden-retriever' },
  { id: 'd8', name: 'Çin Aslanı', slug: 'cin-aslani' },
  { id: 'd9', name: 'Sibirya Kurdu (Husky)', slug: 'sibirya-kurdu-husky' },
  { id: 'd10', name: 'Chihuahua', slug: 'chihuahua' },
  { id: 'd11', name: 'Labrador Retriever', slug: 'labrador-retriever' },
  { id: 'd12', name: 'Alman Kurdu', slug: 'alman-kurdu' },
  { id: 'd13', name: 'Cavalier King Charles', slug: 'cavalier-king-charles' },
  { id: 'd14', name: 'Akita Inu', slug: 'akita-inu' },
  { id: 'd15', name: 'Dakhund - Sosis Köpek', slug: 'dakhund-sosis-kopek' },
  { id: 'd16', name: 'Rottweiler', slug: 'rottweiler' },
  { id: 'd17', name: 'Labradoodle', slug: 'labradoodle' },
  { id: 'd18', name: 'Yorkshire Terrier', slug: 'yorkshire-terrier' },
  { id: 'd19', name: 'Belçika Kurdu', slug: 'belcika-kurdu' },
  { id: 'd20', name: 'French Bulldog', slug: 'french-bulldog' },
  { id: 'd21', name: 'Morkie', slug: 'morkie' },
  { id: 'd22', name: 'Pug', slug: 'pug' },
  { id: 'd23', name: 'Beagle', slug: 'beagle' },
  { id: 'd24', name: 'Pekinez', slug: 'pekinez' },
  { id: 'd25', name: 'Samoyed', slug: 'samoyed' },
  { id: 'd26', name: 'Amerikan Cocker', slug: 'amerikan-cocker' },
  { id: 'd27', name: 'Shih Tzu', slug: 'shih-tzu' },
  { id: 'd28', name: 'Bernese Dağ Köpeği', slug: 'bernese-dag-kopegi' },
  { id: 'd29', name: 'Jack Russell Terrier', slug: 'jack-russell-terrier' },
  { id: 'd30', name: 'Goldendoodle', slug: 'goldendoodle' },
  { id: 'd31', name: 'İngiliz Bulldog', slug: 'ingiliz-bulldog' },
  { id: 'd32', name: 'İngiliz Cocker', slug: 'ingiliz-cocker' },
  { id: 'd33', name: 'corgi', slug: 'corgi' },
  { id: 'd34', name: 'Pincher', slug: 'pincher' },
  { id: 'd35', name: 'Shiba Köpek', slug: 'shiba-kopek' },
  { id: 'd36', name: 'Cockapoo', slug: 'cockapoo' },
  { id: 'd37', name: 'Alabay (Alabai)', slug: 'alabay-alabai' },
  { id: 'd38', name: 'Kangal', slug: 'kangal' },
  { id: 'd39', name: 'bernedoodle', slug: 'bernedoodle' },
  { id: 'd40', name: 'Bişon Çuha Köpeği', slug: 'bison-cuha-kopegi' },
  { id: 'd41', name: 'Wolfdog', slug: 'wolfdog' },
  { id: 'd42', name: 'Cavapoo', slug: 'cavapoo' },
  { id: 'd43', name: 'Schnauzer', slug: 'schnauzer' },
  { id: 'd44', name: 'American Bully', slug: 'american-bully' },
  { id: 'd45', name: 'Avustralya Çoban Köpeği', slug: 'avustralya-coban-kopegi' },
  { id: 'd46', name: 'Saint Bernard', slug: 'saint-bernard' },
  { id: 'd47', name: 'Spitz', slug: 'spitz' },
  { id: 'd48', name: 'Dalmaçyalı', slug: 'dalmacyali' },
  { id: 'd49', name: 'Danua (Great Dane)', slug: 'danua-great-dane' },
  { id: 'd50', name: 'İngiliz Staffordshire', slug: 'ingiliz-staffordshire' },
  { id: 'd51', name: 'Akbaş', slug: 'akbas' },
  { id: 'd52', name: 'Alaska Kurdu', slug: 'alaska-kurdu' },
  { id: 'd53', name: 'Dogo Argentino', slug: 'dogo-argentino' },
  { id: 'd54', name: 'Fransız Mastiff', slug: 'fransiz-mastiff' },
  { id: 'd55', name: 'Havanese', slug: 'havanese' },
  { id: 'd56', name: 'Kafkas Çoban Köpeği', slug: 'kafkas-coban-kopegi' },
  { id: 'd57', name: 'Lagotto Romagnolo', slug: 'lagotto-romagnolo' },
  { id: 'd58', name: 'Newfoundland Köpek', slug: 'newfoundland-kopek' },
  { id: 'd59', name: 'Pitbull', slug: 'pitbull' },
  { id: 'd60', name: 'Süs Köpeği', slug: 'sus-kopegi' },
  { id: 'd61', name: 'Tibet Mastifi', slug: 'tibet-mastifi' }
];

export const allCatBreeds: Breed[] = [
  { id: 'c0', name: 'British Shorthair', slug: 'british-shorthair' },
  { id: 'c1', name: 'Scottish Fold', slug: 'scottish-fold' },
  { id: 'c2', name: 'Tekir', slug: 'tekir' },
  { id: 'c3', name: 'British Longhair', slug: 'british-longhair' },
  { id: 'c4', name: 'Maine Coon', slug: 'maine-coon' },
  { id: 'c5', name: 'Sfenks Kedisi', slug: 'sfenks-kedisi' },
  { id: 'c6', name: 'İran Kedisi', slug: 'iran-kedisi' },
  { id: 'c7', name: 'Scottish Straight', slug: 'scottish-straight' },
  { id: 'c8', name: 'Scottish Fold Longhair', slug: 'scottish-fold-longhair' },
  { id: 'c9', name: 'Ankara Kedisi', slug: 'ankara-kedisi' },
  { id: 'c10', name: 'Chinchilla', slug: 'chinchilla' },
  { id: 'c11', name: 'Exotic Shorthair', slug: 'exotic-shorthair' },
  { id: 'c12', name: 'Munchkin Kedisi', slug: 'munchkin-kedisi' },
  { id: 'c13', name: 'Ragdoll Kedisi', slug: 'ragdoll-kedisi' },
  { id: 'c14', name: 'Sarman Kedi', slug: 'sarman-kedi' },
  { id: 'c15', name: 'Siyam', slug: 'siyam' },
  { id: 'c16', name: 'Van Kedisi', slug: 'van-kedisi' }
];

export const allBirdBreeds: Breed[] = [
    { id: 'b0', name: "Muhabbet Kuşu", slug: 'muhabbet-kusu' },
    { id: 'b1', name: "Sultan Papağanı", slug: 'sultan-papagani' },
    { id: 'b2', name: "Papağan", slug: 'papagan' },
    { id: 'b3', name: "Kanarya", slug: 'kanarya' },
    { id: 'b4', name: "Hint Bülbülü", slug: 'hint-bulbulu' },
    { id: 'b5', name: "Cennet Papağanı", slug: 'cennet-papagani' },
    { id: 'b6', name: "Forpus Papağanı", slug: 'forpus-papagani' }
];

export const allAquariumBreeds: Breed[] = [
    { id: 'a0', name: "Japon Balığı", slug: 'japon-baligi' },
    { id: 'a1', name: "Lepistes", slug: 'lepistes' },
    { id: 'a2', name: "Beta", slug: 'beta' },
    { id: 'a3', name: "Melek Balığı", slug: 'melek-baligi' },
    { id: 'a4', name: "Ciklet", slug: 'ciklet' },
    { id: 'a5', name: "Vatoz", slug: 'vatoz' },
    { id: 'a6', name: "Neon Tetra", slug: 'neon-tetra' },
    { id: 'a7', name: "Discus", slug: 'discus' },
    { id: 'a8', name: "Moli", slug: 'moli' },
    { id: 'a9', name: "Kılıçkuyruk", slug: 'kilickuyruk' },
    { id: 'a10', name: "Karides", slug: 'karides' }
];

export const allOtherBreeds: Breed[] = [
    { id: 'o0', name: "Hamster", slug: 'hamster' },
    { id: 'o1', name: "Tavşan", slug: 'tavsan' },
    { id: 'o2', name: "Guineapig", slug: 'guineapig' },
    { id: 'o3', name: "Kaplumbağa", slug: 'kaplumbaga' },
    { id: 'o4', name: "Iguana", slug: 'iguana' }
];

export const allBreeds = [
    ...allDogBreeds,
    ...allCatBreeds,
    ...allBirdBreeds,
    ...allAquariumBreeds,
    ...allOtherBreeds
];
