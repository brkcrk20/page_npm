
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
    categorySlug?: string;
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
            <h2 className="font-bold">{categoryName} ({categoryCount})</h2>
            {breedName ? (
                <p className="text-primary font-semibold pl-2">{breedName} ({breedCount})</p>
            ) : (
                breeds && categorySlug && (
                    <ul className="space-y-1 mt-2 pl-2">
                        {breeds.slice(0, 10).map(breed => ( // Show top 10 breeds
                            <li key={breed.id}>
                                <Link href={`/${categorySlug}/${breed.slug}`} className="flex justify-between items-center text-sm text-muted-foreground hover:text-primary group">
                                   <span>{breed.name}</span>
                                   <div className="flex items-center gap-1">
                                        <span className="font-semibold">{breed.count}</span>
                                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1"/>
                                   </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )
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
       <Button className="w-full text-base" size="lg">
            <Filter className="mr-2 h-4 w-4" /> Filtrele
        </Button>
    </div>
  );
}
