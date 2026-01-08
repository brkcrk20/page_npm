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
  ArrowRight,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/components/SearchFilters";
import { cn } from "@/lib/utils";

const serviceCategories = [
  { icon: Heart, label: "Sahiplendirme", href: "/listings?category=adoption" },
  { icon: Stethoscope, label: "Veteriner", href: "/services?category=vet" },
  { icon: Building, label: "Pet Oteli", href: "/services?category=hotel" },
  { icon: Medal, label: "Eğitmen", href: "/services?category=trainer" },
  { icon: Scissors, label: "Pet Kuaför", href: "/services?category=groomer" },
  { icon: ShoppingCart, label: "Petshop", href: "/services?category=petshop" },
  { icon: Car, label: "Pet Taksi", href: "/services?category=taxi" },
  { icon: PersonStanding, label: "Gezdirici", href: "/services?category=walker" },
];

export default function HomePage() {
  const activeCategory = 'adoption'; // This could be dynamic based on query params in a real scenario

  return (
    <div className="bg-secondary/50">
       <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto">
           <div className="w-full pt-4">
            <div className="grid w-full grid-cols-4 md:grid-cols-8 h-auto p-1 bg-muted rounded-md text-muted-foreground">
              {serviceCategories.map((service) => (
                 <Link 
                    href={service.href} 
                    key={service.label} 
                    className={cn(
                      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-col gap-1 h-auto text-center hover:text-primary",
                      activeCategory === service.href.split('=')[1] 
                        ? 'bg-background text-primary shadow-sm [box-shadow:0_0_8px_hsl(var(--primary))]' 
                        : ''
                    )}
                  >
                    <service.icon className="w-5 h-5 transition-colors" />
                    <span className="text-xs font-medium hidden sm:block">{service.label}</span>
                </Link>
              ))}
            </div>
          </div>
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
          <main className="col-span-3 space-y-12">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Yıldızlı İlanlar</h2>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/listings">
                    Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {pets.slice(0, 6).map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
             <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Son Yüklenen İlanlar</h2>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/listings">
                    Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {pets.slice(2, 8).map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
