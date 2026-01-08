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

interface VetSearchFiltersProps {
  isHotelPage?: boolean;
}

export function VetSearchFilters({ isHotelPage = false }: VetSearchFiltersProps) {
  const vetServices = [
    { value: 'acil', label: '7/24 Acil' },
    { value: 'cerrahi', label: 'Cerrahi' },
    { value: 'asi', label: 'Aşı' },
    { value: 'muayene', label: 'Muayene' },
    { value: 'laboratuvar', label: 'Laboratuvar' },
  ];

  const hotelServices = [
    { value: 'gozetim', label: '7/24 Gözetim' },
    { value: 'mama', label: 'Özel Mama' },
    { value: 'klima', label: 'Klimalı Odalar' },
    { value: 'oyun-alani', label: 'Oyun Alanı' },
  ];

  const services = isHotelPage ? hotelServices : vetServices;
  const placeholder = isHotelPage ? "Otel adı veya anahtar kelime..." : "Klinik adı veya anahtar kelime...";
  const buttonText = isHotelPage ? "Otel Bul" : "Veteriner Bul";


  return (
    <div className="py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={placeholder} className="pl-9 h-9" />
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
            <SelectValue placeholder={isHotelPage ? "Tüm Olanaklar" : "Tüm Hizmetler"} />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.value} value={service.value}>{service.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button className="w-full h-9 text-base">
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
