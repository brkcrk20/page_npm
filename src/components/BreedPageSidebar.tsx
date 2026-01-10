
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
    breeds,
    categorySlug
}: BreedPageSidebarProps) {
    // If breedName exists, we are on a breed detail page or category page, so we don't use the accordion.
    if (breedName || (breeds && categorySlug)) {
        return (
            <div className="w-full space-y-6">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                   <div className="w-full p-4 flex items-center justify-between font-bold text-orange-600 bg-orange-50 border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] rounded-t-xl border-b-0 cursor-default">
                       <span>{categoryName}</span>
                       <span className="font-semibold px-2 py-0.5 rounded-full text-xs bg-orange-200 text-orange-700">
                           {categoryCount}
                       </span>
                   </div>

                    {breeds && categorySlug && (
                        <ul className="space-y-1 p-4 bg-white rounded-b-xl border border-t-0 border-gray-200">
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
                    )}
                </div>
            </div>
        )
    }

  // Fallback to the Accordion for the main page
  return (
    <div className="w-full space-y-6">
       {/* This part is for the main page, which is now handled by page.tsx's CategoryFilter */}
    </div>
  );
}
