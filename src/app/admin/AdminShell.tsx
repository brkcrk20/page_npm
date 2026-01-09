'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "./UserManagement";
import { ListingManagement } from "./ListingManagement";
import { ServiceManagement } from "./ServiceManagement";
import { Users, PawPrint, Layers } from "lucide-react";

export function AdminShell() {

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Admin Paneli</h1>
        <p className="text-muted-foreground">Uygulama verilerini yönetin ve izleyin.</p>
      </div>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users"><Users className="mr-2" />Kullanıcılar</TabsTrigger>
          <TabsTrigger value="listings"><PawPrint className="mr-2" />Hayvan İlanları</TabsTrigger>
          <TabsTrigger value="services"><Layers className="mr-2" />Hizmetler</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
        <TabsContent value="listings" className="mt-6">
          <ListingManagement />
        </TabsContent>
        <TabsContent value="services" className="mt-6">
          <ServiceManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
