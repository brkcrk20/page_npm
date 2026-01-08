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
  pageType: 'vet' | 'hotel' | 'trainer';
}

export function VetSearchFilters({ pageType }: VetSearchFiltersProps) {
  const pageConfig = {
    vet: {
      placeholder: "Klinik adı veya anahtar kelime...",
      servicesPlaceholder: "Tüm Hizmetler",
      buttonText: "Veteriner Bul",
      services: [
        { value: 'acil', label: '7/24 Acil' },
        { value: 'cerrahi', label: 'Cerrahi' },
        { value: 'asi', label: 'Aşı' },
        { value: 'muayene', label: 'Muayene' },
        { value: 'laboratuvar', label: 'Laboratuvar' },
      ],
    },
    hotel: {
      placeholder: "Otel adı veya anahtar kelime...",
      servicesPlaceholder: "Tüm Olanaklar",
      buttonText: "Otel Bul",
      services: [
        { value: 'gozetim', label: '7/24 Gözetim' },
        { value: 'mama', label: 'Özel Mama' },
        { value: 'klima', label: 'Klimalı Odalar' },
        { value: 'oyun-alani', label: 'Oyun Alanı' },
      ],
    },
    trainer: {
      placeholder: "Eğitmen adı veya uzmanlık alanı...",
      servicesPlaceholder: "Tüm Eğitimler",
      buttonText: "Eğitmen Bul",
      services: [
        { value: 'itaat', label: 'Temel İtaat' },
        { value: 'davranis', label: 'Davranış Düzeltme' },
        { value: 'grup', label: 'Grup Dersleri' },
        { value: 'koruma', label: 'Koruma Eğitimi' },
      ],
    }
  };

  const { placeholder, servicesPlaceholder, buttonText, services } = pageConfig[pageType];


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
            <SelectValue placeholder={servicesPlaceholder} />
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
