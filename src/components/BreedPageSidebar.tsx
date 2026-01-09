
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
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <Link 
              href={`/${categorySlug}`} 
              className="block font-bold text-lg mb-4 text-center p-3 rounded-lg bg-secondary hover:bg-orange-50 hover:text-orange-600 transition-all duration-200"
            >
                {categoryName} ({categoryCount})
            </Link>

            {breeds && categorySlug && (
                <ul className="space-y-2 mt-2">
                    {breeds.map(breed => {
                        const isActive = breed.name === breedName;
                        return (
                         <li key={breed.id}>
                            <Link 
                                href={`/${categorySlug}/${breed.slug}`} 
                                className={cn(
                                    "flex justify-between items-center text-sm p-3 rounded-lg border transition-all duration-300 ease-in-out group",
                                    "hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-1",
                                    isActive 
                                        ? "bg-orange-50 text-orange-600 font-bold border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                                        : "text-muted-foreground border-transparent"
                                )}
                            >
                               <span className="truncate">{breed.name}</span>
                               <div className="flex items-center gap-2">
                                    <span className={cn("font-semibold px-2 py-0.5 rounded-full text-xs", isActive ? "bg-orange-200 text-orange-700" : "bg-secondary")}>
                                      {breed.count}
                                    </span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5"/>
                               </div>
                            </Link>
                        </li>
                        )
                    })}
                </ul>
            )}
        </div>
        
        <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm">
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

      <Accordion type="multiple" className="w-full bg-white rounded-lg p-4 shadow-sm">
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
