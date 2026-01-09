'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allDogBreeds, allCatBreeds, allBirdBreeds, allAquariumBreeds, allOtherBreeds } from "@/lib/breeds";
import { Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BreedCategory = 'Dog' | 'Cat' | 'Bird' | 'Aquarium' | 'Other';

const breedData: Record<BreedCategory, string[]> = {
  Dog: allDogBreeds,
  Cat: allCatBreeds,
  Bird: allBirdBreeds,
  Aquarium: allAquariumBreeds,
  Other: allOtherBreeds,
};

export function BreedManagement() {
  const [breeds, setBreeds] = useState(breedData);
  const [newBreed, setNewBreed] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BreedCategory>('Dog');
  const { toast } = useToast();

  const handleAddBreed = () => {
    if (!newBreed.trim()) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Cins adı boş olamaz.' });
      return;
    }
    if (breeds[selectedCategory].includes(newBreed)) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Bu cins zaten mevcut.' });
        return;
    }

    // This is a client-side only update. For a real app, this should
    // trigger a server action to update the source file or a database.
    const updatedBreeds = {
      ...breeds,
      [selectedCategory]: [...breeds[selectedCategory], newBreed].sort((a, b) => a.localeCompare(b, 'tr')),
    };
    setBreeds(updatedBreeds);
    setNewBreed('');
    toast({ title: 'Başarılı', description: `"${newBreed}" cinsi "${selectedCategory}" kategorisine eklendi.` });
    console.log(`(Simulated) Added breed: ${newBreed} to ${selectedCategory}. Update 'src/lib/breeds.ts' to make it permanent.`);
  };

  const handleDeleteBreed = (category: BreedCategory, breedToDelete: string) => {
     // This is a client-side only update.
    const updatedBreeds = {
        ...breeds,
        [category]: breeds[category].filter(b => b !== breedToDelete),
    };
    setBreeds(updatedBreeds);
    toast({ title: 'Başarılı', description: `"${breedToDelete}" cinsi silindi.` });
    console.log(`(Simulated) Deleted breed: ${breedToDelete} from ${category}. Update 'src/lib/breeds.ts' to make it permanent.`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cins Yönetimi</CardTitle>
        <CardDescription>Sitede gösterilen hayvan cinslerini ekleyin veya silin. Değişikliklerin kalıcı olması için `src/lib/breeds.ts` dosyasını güncellemeniz gerektiğini unutmayın.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-2 p-4 border rounded-lg">
            <div className="flex-grow grid grid-cols-2 gap-2">
                 <Select onValueChange={(value) => setSelectedCategory(value as BreedCategory)} defaultValue={selectedCategory}>
                    <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Dog">Köpek</SelectItem>
                        <SelectItem value="Cat">Kedi</SelectItem>
                        <SelectItem value="Bird">Kuş</SelectItem>
                        <SelectItem value="Aquarium">Akvaryum</SelectItem>
                        <SelectItem value="Other">Diğer</SelectItem>
                    </SelectContent>
                </Select>
                <Input
                    placeholder="Yeni cins adı..."
                    value={newBreed}
                    onChange={(e) => setNewBreed(e.target.value)}
                />
            </div>
            <Button onClick={handleAddBreed}><PlusCircle className="mr-2"/> Cins Ekle</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Object.keys(breeds) as BreedCategory[]).map((category) => (
            <div key={category} className="border p-4 rounded-md">
              <h3 className="font-bold mb-3 text-lg">{category} Cinsleri</h3>
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {breeds[category].map((breed) => (
                  <li key={breed} className="flex items-center justify-between text-sm bg-secondary p-2 rounded-md">
                    <span>{breed}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteBreed(category, breed)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
