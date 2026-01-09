'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Construction } from 'lucide-react';

export function MenuManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>İçerik ve Menü Yönetimi</CardTitle>
        <CardDescription>
          Sitenin menülerini yönetin ve sayfaların altına blog yazıları gibi içerikler ekleyin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
          <Construction className="w-16 h-16 mb-4" />
          <p className="font-bold text-lg">Bu Alan Yapım Aşamasında</p>
          <p className="text-sm">Menü ve içerik yönetimi özellikleri yakında burada olacak.</p>
        </div>
      </CardContent>
    </Card>
  );
}
