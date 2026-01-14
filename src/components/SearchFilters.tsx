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
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export function SearchFilters() {
  // Başlangıçta kapalı olsun (false)
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-2 w-full max-w-full">
      
      {/* MOBİL İÇİN AÇMA/KAPAMA BUTONU */}
      {/* md:hidden dedik, yani bilgisayarda bu buton görünmeyecek */}
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between mb-2 md:hidden h-10 bg-white"
      >
        <span className="flex items-center gap-2 text-gray-600">
          <Search className="w-4 h-4" />
          İlan Ara & Filtrele
        </span>
        {/* Açık/Kapalı durumuna göre ok yönü değişir */}
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {/* ARAMA FORMU */}
      {/* Mobilde: isOpen true ise 'grid', false ise 'hidden' (gizli) */}
      {/* Masaüstünde (md): Her zaman 'grid' (görünür) */}
      <div className={`${isOpen ? 'grid' : 'hidden'} md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 md:gap-3 items-end w-full animate-in slide-in-from-top-2 duration-200`}>
        
        <div className="relative lg:col-span-2 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Ne arıyorsun? (Irk, isim...)" className="pl-9 h-9 w-full bg-white" />
        </div>

        <Select>
          <SelectTrigger className="h-9 w-full bg-white">
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
          <SelectTrigger className="h-9 w-full bg-white">
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
          <SelectTrigger className="h-9 w-full bg-white">
            <SelectValue placeholder="Tüm Şehirler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="istanbul">İstanbul</SelectItem>
            <SelectItem value="ankara">Ankara</SelectItem>
            <SelectItem value="izmir">İzmir</SelectItem>
            <SelectItem value="bursa">Bursa</SelectItem>
          </SelectContent>
        </Select>

        <Button className="w-full h-9 text-base">
          Bul
        </Button>
      </div>
    </div>
  );
}