import { PetCard } from "@/components/PetCard";
import { pets } from "@/lib/data";

export default function ListingsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold font-headline mb-8">İlanları Gözat</h1>
      
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </div>
  );
}
