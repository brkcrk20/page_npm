'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 text-destructive p-4 rounded-full mb-4">
              <SearchX className="h-16 w-16" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold">Sayfa Bulunamadı</CardTitle>
          <CardDescription className="text-lg">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg">
            <Link href="/">Ana Sayfaya Dön</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
