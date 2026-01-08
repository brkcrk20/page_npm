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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const serviceCategories = [
  { icon: Heart, label: "Sahiplendirme", value: "adoption" },
  { icon: Stethoscope, label: "Veteriner", value: "vet" },
  { icon: Building, label: "Pet Oteli", value: "hotel" },
  { icon: Medal, label: "Eğitmen", value: "trainer" },
  { icon: Scissors, label: "Pet Kuaför", value: "groomer" },
  { icon: Car, label: "Pet Taksi", value: "taxi" },
  { icon: PersonStanding, label: "Gezdirici", value: "walker" },
  { icon: Mail, label: "Pati Asistanı", value: "assistant" },
];

export default function HomePage() {
  return (
    <div className="bg-secondary/50">
       <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto">
          <Tabs defaultValue="adoption" className="w-full pt-4">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 h-auto">
              {serviceCategories.map((service) => (
                 <TabsTrigger key={service.value} value={service.value} className="flex flex-col items-center justify-center text-center gap-2 h-auto py-2 px-1">
                    <service.icon className="w-5 h-5" />
                    <span className="text-xs font-medium hidden sm:block">{service.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <SearchFilters />
        </div>
      </div>
      <div className="container mx-auto py-4">
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
