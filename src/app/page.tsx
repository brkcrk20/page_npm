import { PetCard } from "@/components/PetCard";
import { pets } from "@/lib/data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dog,
  Cat,
  Bird,
  Fish,
  Heart,
  Stethoscope,
  Building,
  Medal,
  Scissors,
  Car,
  PersonStanding,
  Mail,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/components/SearchFilters";

const serviceCategories = [
  { icon: Heart, label: "Sahiplendirme", color: "text-red-500" },
  { icon: Stethoscope, label: "Veteriner", color: "text-blue-500" },
  { icon: Building, label: "Pet Oteli", color: "text-yellow-500" },
  { icon: Medal, label: "Eğitmen", color: "text-green-500" },
  { icon: Scissors, label: "Pet Kuaför", color: "text-purple-500" },
  { icon: Car, label: "Pet Taksi", color: "text-indigo-500" },
  { icon: PersonStanding, label: "Gezdirici", color: "text-cyan-500" },
  { icon: Mail, label: "Pati Asistanı", color: "text-pink-500" },
];

export default function HomePage() {
  return (
    <div className="bg-secondary/50">
       <SearchFilters />
      <div className="container mx-auto py-4">
        <div className="bg-white rounded-lg shadow-sm mb-8">
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 p-4">
                {serviceCategories.map((service) => (
                  <div key={service.label} className="flex flex-col items-center justify-center text-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 ${service.color}`}>
                      <service.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{service.label}</span>
                  </div>
                ))}
              </div>
            </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <Accordion type="multiple" defaultValue={["dogs", "cats"]}>
                <AccordionItem value="dogs">
                  <AccordionTrigger className="font-bold">
                    <div className="flex items-center gap-2">
                      <Dog className="text-orange-500" /> Köpekler
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pl-4">
                      <li><Link href="#" className="text-muted-foreground hover:text-primary">Fransız Bulldog</Link></li>
                      <li><Link href="#" className="text-muted-foreground hover:text-primary">Golden Retriever</Link></li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="cats">
                  <AccordionTrigger className="font-bold">
                    <div className="flex items-center gap-2">
                      <Cat className="text-red-400" /> Kediler
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                     <ul className="space-y-2 pl-4">
                      <li><Link href="#" className="text-muted-foreground hover:text-primary">Scottish Fold</Link></li>
                      <li><Link href="#" className="text-muted-foreground hover:text-primary">Tekir</Link></li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="birds">
                  <AccordionTrigger className="font-bold">
                    <div className="flex items-center gap-2">
                      <Bird className="text-sky-400" /> Kuşlar
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                     <ul className="space-y-2 pl-4">
                      <li><Link href="#" className="text-muted-foreground hover:text-primary">Muhabbet Kuşu</Link></li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="fish">
                  <AccordionTrigger className="font-bold">
                    <div className="flex items-center gap-2">
                      <Fish className="text-blue-400" /> Balıklar
                    </div>
                  </AccordionTrigger>
                   <AccordionContent>
                     <ul className="space-y-2 pl-4">
                      <li><Link href="#" className="text-muted-foreground hover:text-primary">Japon Balığı</Link></li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </aside>
          <main className="col-span-3">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Yıldızlı İlanlar</h2>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/listings">
                    Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                {pets.slice(0, 5).map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
             <div className="mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                 <PetCard key={pets[6].id} pet={pets[6]} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
