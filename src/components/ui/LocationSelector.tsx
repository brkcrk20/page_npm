'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { citiesData, cityNames } from '@/lib/turkiye-data';

interface LocationSelectorProps {
  onLocationChange: (city: string, district: string) => void;
  defaultCity?: string;
  defaultDistrict?: string;
  className?: string;
}

export function LocationSelector({ onLocationChange, defaultCity = "", defaultDistrict = "", className }: LocationSelectorProps) {
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict);

  // Dışarıdan gelen varsayılan değerler değişirse (örn: veritabanından veri gelince) state'i güncelle
  useEffect(() => {
    if(defaultCity) setSelectedCity(defaultCity);
    if(defaultDistrict) setSelectedDistrict(defaultDistrict);
  }, [defaultCity, defaultDistrict]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedDistrict(""); // İl değişince ilçeyi sıfırla
    onLocationChange(city, ""); // Ana sayfaya haber ver
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    onLocationChange(selectedCity, district); // Ana sayfaya haber ver
  };

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {/* İL SEÇİMİ */}
      <Select value={selectedCity} onValueChange={handleCityChange}>
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="İl Seçiniz" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {cityNames.map((city) => (
            <SelectItem key={city} value={city}>{city}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* İLÇE SEÇİMİ */}
      <Select 
        value={selectedDistrict} 
        onValueChange={handleDistrictChange}
        disabled={!selectedCity} // İl seçilmeden açılmaz
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="İlçe Seçiniz" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {selectedCity && citiesData[selectedCity]?.map((district) => (
            <SelectItem key={district} value={district}>{district}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}