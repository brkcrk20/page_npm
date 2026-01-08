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

export function VetSearchFilters() {
  return (
    <div className="py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Klinik adı veya anahtar kelime..." className="pl-9 h-9" />
        </div>

        <Select>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tüm Şehirler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="istanbul">İstanbul</SelectItem>
            <SelectItem value="ankara">Ankara</SelectItem>
            <SelectItem value="izmir">İzmir</SelectItem>
            <SelectItem value="bursa">Bursa</SelectItem>
            <SelectItem value="antalya">Antalya</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tüm Hizmetler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="acil">7/24 Acil</SelectItem>
            <SelectItem value="cerrahi">Cerrahi</SelectItem>
            <SelectItem value="asi">Aşı</SelectItem>
            <SelectItem value="muayene">Muayene</SelectItem>
            <SelectItem value="laboratuvar">Laboratuvar</SelectItem>
          </SelectContent>
        </Select>

        <Button className="w-full h-9 text-base">
          Veteriner Bul
        </Button>
      </div>
    </div>
  );
}
