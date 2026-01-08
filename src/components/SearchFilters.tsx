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
    <div className="bg-white py-3 shadow-sm border-b">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Ne arıyorsun? (Irk, isim...)" className="pl-9 h-10" />
          </div>

          <Select>
            <SelectTrigger className="h-10">
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
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Tüm Şehirler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="istanbul">İstanbul</SelectItem>
              <SelectItem value="ankara">Ankara</SelectItem>
              <SelectItem value="izmir">İzmir</SelectItem>
              <SelectItem value="bursa">Bursa</SelectItem>
            </SelectContent>
          </Select>

          <Button className="w-full h-10 text-base">
            Bul
          </Button>
        </div>
      </div>
    </div>
  );
}
