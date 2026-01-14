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
import { Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

export function SearchFilters() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-2 w-full max-w-full">
      
      {/* MOBİL FİLTRE BUTONU 
         - rounded-full veya rounded-2xl: Daha modern, yumuşak köşeler.
         - shadow-md: Butona derinlik katar.
         - border-transparent: Çizgi kirliliğini kaldırır.
      */}
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`
          w-full flex items-center justify-between mb-2 md:hidden h-12 
          rounded-2xl transition-all duration-300 shadow-sm border
          ${isOpen 
            ? 'bg-primary text-primary-foreground border-primary' // Açık: Turuncu zemin, Beyaz yazı
            : 'bg-white text-gray-700 border-gray-100 hover:border-primary/30 hover:bg-orange-50' // Kapalı: Beyaz zemin, Gri yazı
          }
        `}
      >
        <span className="flex items-center gap-2.5 font-semibold text-base">
          {/* İkon rengini duruma göre ayarladık */}
          <div className={`p-1.5 rounded-full ${isOpen ? 'bg-white/20' : 'bg-orange-100 text-primary'}`}>
             <SlidersHorizontal className="w-4 h-4" />
          </div>
          İlan Ara & Filtrele
        </span>
        
        {/* Ok işareti */}
        {isOpen 
          ? <ChevronUp className="w-5 h-5 opacity-80" /> 
          : <ChevronDown className="w-5 h-5 text-gray-400" />
        }
      </Button>

      {/* ARAMA FORMU KUTUSU */}
      <div className={`
        ${isOpen ? 'grid' : 'hidden'} 
        md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end w-full 
        animate-in slide-in-from-top-4 fade-in duration-300 ease-out
      `}>
        
        <div className="relative lg:col-span-2 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Ne arıyorsun? (Irk, isim...)" 
            className="pl-9 h-11 w-full bg-white border-gray-200 rounded-xl focus:border-primary focus:ring-primary/20" 
          />
        </div>

        <Select>
          <SelectTrigger className="h-11 w-full bg-white border-gray-200 rounded-xl focus:ring-primary/20">
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
          <SelectTrigger className="h-11 w-full bg-white border-gray-200 rounded-xl focus:ring-primary/20">
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
          <SelectTrigger className="h-11 w-full bg-white border-gray-200 rounded-xl focus:ring-primary/20">
            <SelectValue placeholder="Tüm Şehirler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="istanbul">İstanbul</SelectItem>
            <SelectItem value="ankara">Ankara</SelectItem>
            <SelectItem value="izmir">İzmir</SelectItem>
            <SelectItem value="bursa">Bursa</SelectItem>
          </SelectContent>
        </Select>

        {/* BUL BUTONU - Filtre butonuyla uyumlu olsun */}
        <Button className="w-full h-11 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md transition-transform active:scale-95">
          Bul
        </Button>
      </div>
    </div>
  );
}