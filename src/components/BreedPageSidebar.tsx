
'use client';

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
import type { BreedInfo, CategoryInfo } from "@/lib/breeds";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/breeds";

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

    // If breedName or breeds are passed, we are on a breed detail page or category page, so we don't use the accordion.
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
                                    return (
                                    <li key={breed.id}>
                                        <Link 
                                            href={`/${categorySlug}/${breed.slug}`} 
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

  // Fallback to the Accordion for the main page
  return (
    <div className="w-full space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Filter className="mr-2 h-5 w-5" /> Filtrele
        </h3>
        <Accordion type="multiple" defaultValue={['category']} className="w-full">
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
          <AccordionItem value="location">
            <AccordionTrigger className="text-base font-semibold">Konum</AccordionTrigger>
            <AccordionContent>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Şehir seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="istanbul">İstanbul</SelectItem>
                  <SelectItem value="ankara">Ankara</SelectItem>
                  <SelectItem value="izmir">İzmir</SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
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
