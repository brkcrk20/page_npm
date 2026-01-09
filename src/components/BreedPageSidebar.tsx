
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "./ui/button";
import { Filter, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";
import Link from "next/link";
import type { BreedInfo } from "@/lib/breeds";
import { cn } from "@/lib/utils";

interface BreedPageSidebarProps {
    categoryName: string;
    categoryCount: number;
    breedName?: string;
    breedCount?: number;
    breeds?: BreedInfo[];
    categorySlug: string;
}

export function BreedPageSidebar({
    categoryName,
    categoryCount,
    breedName,
    breedCount,
    breeds,
    categorySlug
}: BreedPageSidebarProps) {
  return (
    <div className="w-full space-y-6">
        <div className="bg-secondary/50 p-4 rounded-lg">
            <Link href={`/${categorySlug}`} className="block font-bold hover:text-primary transition-colors text-lg mb-2">
                {categoryName} ({categoryCount})
            </Link>

            {breeds && categorySlug && (
                <ul className="space-y-1 mt-2 pl-2 max-h-96 overflow-y-auto">
                    {breeds.map(breed => (
                         <li key={breed.id}>
                            <Link 
                                href={`/${categorySlug}/${breed.slug}`} 
                                className={cn(
                                    "flex justify-between items-center text-sm p-2 rounded-md text-muted-foreground transition-all duration-300 ease-in-out group",
                                    "hover:bg-orange-50 hover:text-orange-600 hover:translate-x-1",
                                    "active:scale-95 active:ring-2 active:ring-orange-200",
                                    breed.name === breedName && "text-primary font-bold bg-secondary"
                                )}
                            >
                               <span>{breed.name}</span>
                               <div className="flex items-center gap-1">
                                    <span className="font-semibold">{breed.count}</span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1"/>
                               </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
        
        <div className="space-y-4">
             <div>
                <Label htmlFor="city-select">İl Seçiniz</Label>
                 <Select>
                    <SelectTrigger id="city-select">
                        <SelectValue placeholder="Şehir seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="istanbul">İstanbul</SelectItem>
                        <SelectItem value="ankara">Ankara</SelectItem>
                        <SelectItem value="izmir">İzmir</SelectItem>
                        <SelectItem value="bursa">Bursa</SelectItem>
                        <SelectItem value="adana">Adana</SelectItem>
                    </SelectContent>
                </Select>
             </div>
            <Button className="w-full text-base" size="lg">
                <Filter className="mr-2 h-4 w-4" /> Filtrele
            </Button>
        </div>

      <Accordion type="multiple" className="w-full border rounded-lg p-4">
        <AccordionItem value="age">
          <AccordionTrigger>Yaş</AccordionTrigger>
          <AccordionContent>
            İçerik yakında eklenecek.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="gender">
          <AccordionTrigger>Cinsiyet</AccordionTrigger>
          <AccordionContent>
            İçerik yakında eklenecek.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="status">
          <AccordionTrigger>Durum</AccordionTrigger>
          <AccordionContent>
            İçerik yakında eklenecek.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="vaccine">
          <AccordionTrigger>Aşı</AccordionTrigger>
          <AccordionContent>
            İçerik yakında eklenecek.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="internal_parasite">
          <AccordionTrigger>İç Parazit</AccordionTrigger>
          <AccordionContent>
            İçerik yakında eklenecek.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="external_parasite">
          <AccordionTrigger>Dış Parazit</AccordionTrigger>
          <AccordionContent>
            İçerik yakında eklenecek.
          </AccordionContent>
        </AccordionItem>
         <AccordionItem value="credit_card">
          <AccordionTrigger>Kredi Kartına Ödeme</AccordionTrigger>
          <AccordionContent>
            İçerik yakında eklenecek.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="shipping" className="border-b-0">
          <AccordionTrigger>Şehir Dışına Gönderim</AccordionTrigger>
          <AccordionContent>
            İçerik yakında eklenecek.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
