'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'; // İkonu değiştirdik

export function SearchFilters() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-2 w-full max-w-full">
      
      {/* MOBİL BUTON - TASARIM GÜNCELLENDİ */}
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(!isOpen)} 
        className={`
          w-full flex items-center justify-between mb-3 md:hidden h-12 
          rounded-xl border-2 shadow-sm transition-all duration-200
          ${isOpen 
            ? 'bg-primary text-white border-primary' // Açıkken: Turuncu zemin, beyaz yazı
            : 'bg-white text-primary border-primary/20 hover:border-primary hover:bg-orange-50' // Kapalıyken: Beyaz zemin, turuncu yazı
          }
        `}
      >
        <span className="flex items-center gap-2 font-semibold text-base">
          {/* Hem büyüteç hem filtre ikonu kullanabiliriz, buraya filtre ikonu koydum */}
          <SlidersHorizontal className="w-5 h-5" />
          İlan Ara & Filtrele
        </span>
        
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </Button>

      {/* ARAMA FORMU */}
      <div className={`${isOpen ? 'grid' : 'hidden'} md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 md:gap-3 items-end w-full animate-in slide-in-from-top-2 duration-200`}>
        
        <div className="relative lg:col-span-2 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Ne arıyorsun? (Irk, isim...)" className="pl-9 h-9 w-full bg-white border-gray-200" />
        </div>

        <Select>
          <SelectTrigger className="h-9 w-full bg-white border-gray-200">
            <SelectValue placeholder="Tüm Türler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dog">Köpek</SelectItem>
            <SelectItem value="cat">Kedi</SelectItem>
            <SelectItem value="bird">Kuş</SelectItem>
            <SelectItem value="other">Diğer</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="h-9 w-full bg-white border-gray-200">
            <SelectValue placeholder="Tüm Cinsler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="golden-retriever">Golden Retriever</SelectItem>
            <SelectItem value="scottish-fold">Scottish Fold</SelectItem>
            <SelectItem value="tekir">Tekir</SelectItem>
            <SelectItem value="fransiz-bulldog">Fransız Bulldog</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger className="h-9 w-full bg-white border-gray-200">
            <SelectValue placeholder="Tüm Şehirler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="istanbul">İstanbul</SelectItem>
            <SelectItem value="ankara">Ankara</SelectItem>
            <SelectItem value="izmir">İzmir</SelectItem>
            <SelectItem value="bursa">Bursa</SelectItem>
          </SelectContent>
        </Select>

        <Button className="w-full h-9 text-base bg-primary hover:bg-primary/90 text-white shadow-sm">
          Bul
        </Button>
      </div>
    </div>
  );
}