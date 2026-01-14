'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

export function SearchFilters() {
  return (
    <div className="py-2 w-full max-w-full">
      {/* gap-3 yerine mobilde gap-2 yaptık, sıkışmayı önlemek için */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 md:gap-3 items-end w-full">
        
        <div className="relative lg:col-span-2 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Ne arıyorsun? (Irk, isim...)" className="pl-9 h-9 w-full" />
        </div>

        <Select>
          {/* w-full ekledik: Kutu genişliği %100 olsun */}
          <SelectTrigger className="h-9 w-full">
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
           {/* w-full ekledik */}
          <SelectTrigger className="h-9 w-full">
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
           {/* w-full ekledik */}
          <SelectTrigger className="h-9 w-full">
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