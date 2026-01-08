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
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="bg-secondary/50">
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
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {pets.slice(0, 8).map((pet) => (
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
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {pets.slice(2, 6).map((pet) => (
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
