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
import { Card, CardContent } from './ui/card';

export function SearchFilters() {
  return (
    <Card className="mb-8">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Anahtar kelime (örn. uslu, oyuncu)" className="pl-9"/>
          </div>

          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Türe Göre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dog">Köpek</SelectItem>
              <SelectItem value="cat">Kedi</SelectItem>
              <SelectItem value="bird">Kuş</SelectItem>
              <SelectItem value="other">Diğer</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Konum (örn. Istanbul)" />
          
          <Button className="w-full">
            <Search className="mr-2 h-4 w-4" /> Filtrele
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
