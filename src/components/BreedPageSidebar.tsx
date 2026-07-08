'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "./ui/button";
import { Filter } from "lucide-react";
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
import { categories } from "@/lib/breeds";

// DATA DOSYASINI EKLİYORUZ (81 İL)
import { citiesData, cityNames } from '@/lib/turkiye-data';

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
  breeds,
  categorySlug
}: BreedPageSidebarProps) {
  
  const categoryInfo = categories.find(c => c.slug === categorySlug);
  const Icon = categoryInfo?.Icon;

  // --- YENİ EKLENEN STATE'LER (İl/İlçe Seçimi İçin) ---
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Eğer breedName veya breeds varsa (Detay sayfası veya kategori sayfası), özel listeyi göster
  if (breedName || (breeds && categorySlug)) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
           <div className="w-full p-4 flex items-center justify-between font-bold text-orange-600 bg-orange-50 border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] rounded-t-xl border-b-0 cursor-default">
             <div className="flex items-center gap-3">
               {Icon && <Icon className="w-6 h-6" />}
               <span>{categoryName}</span>
             </div>
             <span className="font-semibold px-2 py-0.5 rounded-full text-xs bg-orange-200 text-orange-700">
               {categoryCount}
             </span>
           </div>

           {breeds && categorySlug && (
             <div className="border-l border-r border-b border-gray-200 rounded-b-xl bg-white">
               <ul className="space-y-1 p-2 h-auto">
                 {breeds.map(breed => {
                   const isActive = breed.name === breedName;
                   // Köpek ve Kedi kategorilerinde bu path segmenti şehir filtresine ayrılmış
                   // (/kopek-ilanlari/[sehir], /kedi-ilanlari/[sehir]). Bu yüzden ırk linkini
                   // ayrı bir sayfaya değil, aynı sayfada ?cins= filtresine yönlendiriyoruz.
                   const isCityBasedCategory = categorySlug === 'kopek-ilanlari' || categorySlug === 'kedi-ilanlari';
                   const breedHref = isCityBasedCategory
                     ? `/${categorySlug}?cins=${encodeURIComponent(breed.name)}`
                     : `/${categorySlug}/${breed.slug}`;
                   return (
                   <li key={breed.id}>
                     <Link 
                       href={breedHref} 
                       className={cn(
                         "flex justify-between items-center text-sm p-3 rounded-lg border transition-all duration-300 ease-in-out group",
                         isActive 
                           ? "bg-orange-50 border-orange-500 text-orange-600 font-bold shadow-[0_0_15px_rgba(249,115,22,0.5)] scale-[1.01]"
                           : "text-muted-foreground border-transparent hover:border-orange-200 hover:shadow-orange-100 hover:shadow-md hover:-translate-y-px"
                       )}
                     >
                       <span className="truncate">{breed.name}</span>
                       <span className={cn("font-semibold px-2 py-0.5 rounded-full text-xs", isActive ? "bg-orange-200 text-orange-700" : "bg-secondary")}>
                         {breed.count}
                       </span>
                     </Link>
                   </li>
                   )
                 })}
               </ul>
             </div>
           )}
        </div>
      </div>
    )
  }

  // Fallback: Ana sayfa veya genel görünüm için filtreler
  return (
    <div className="w-full space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Filter className="mr-2 h-5 w-5" /> Filtrele
        </h3>
        <Accordion type="multiple" defaultValue={['category', 'location']} className="w-full">
          
          {/* KATEGORİ SEÇİMİ */}
          <AccordionItem value="category">
            <AccordionTrigger className="text-base font-semibold">Kategori</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Button variant="link" className="justify-start">Köpek ({categoryCount})</Button>
                <Button variant="link" className="justify-start">Kedi (12)</Button>
                <Button variant="link" className="justify-start">Kuş (8)</Button>
                <Button variant="link" className="justify-start">Akvaryum (5)</Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* --- GÜNCELLENEN KONUM SEÇİMİ (81 İL + İLÇE) --- */}
          <AccordionItem value="location">
            <AccordionTrigger className="text-base font-semibold">Konum</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {/* İL SEÇİMİ */}
                <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">İl</Label>
                    <Select 
                        value={selectedCity} 
                        onValueChange={(val) => {
                            setSelectedCity(val);
                            setSelectedDistrict(""); // İl değişince ilçe sıfırlanır
                        }}
                    >
                        <SelectTrigger>
                        <SelectValue placeholder="İl Seçiniz..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px]">
                        {cityNames.map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* İLÇE SEÇİMİ */}
                <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">İlçe</Label>
                    <Select 
                        value={selectedDistrict} 
                        onValueChange={setSelectedDistrict}
                        disabled={!selectedCity} // İl seçilmeden açılmaz
                    >
                        <SelectTrigger>
                        <SelectValue placeholder="İlçe Seçiniz..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px]">
                        {selectedCity && citiesData[selectedCity]?.map((district) => (
                            <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          {/* --- KONUM BİTİŞ --- */}

          <AccordionItem value="age">
            <AccordionTrigger className="text-base font-semibold">Yaş</AccordionTrigger>
            <AccordionContent>
              <div>
                <Label htmlFor="age-range">Yaş Aralığı</Label>
                {/* Placeholder for a slider */}
                <p className="text-sm text-muted-foreground">0 - 5 yaş</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}