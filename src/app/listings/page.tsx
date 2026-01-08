import { PetCard } from "@/components/PetCard";
import { SearchFilters } from "@/components/SearchFilters";
import { pets } from "@/lib/data";

export default function ListingsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold font-headline mb-8">İlanları Gözat</h1>
      
      <SearchFilters />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </div>
  );
}
