'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "./UserManagement";
import { ListingManagement } from "./ListingManagement";
import { ServiceManagement } from "./ServiceManagement";
import { BreedManagement } from "./BreedManagement";
import { MenuManagement } from "./MenuManagement";
import { Users, PawPrint, Layers, Database, LayoutTemplate } from "lucide-react";

export function AdminShell() {

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Admin Paneli</h1>
        <p className="text-muted-foreground">Uygulama verilerini ve içeriğini yönetin.</p>
      </div>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users"><Users className="mr-2" />Kullanıcılar</TabsTrigger>
          <TabsTrigger value="listings"><PawPrint className="mr-2" />Hayvan İlanları</TabsTrigger>
          <TabsTrigger value="services"><Layers className="mr-2" />Hizmetler</TabsTrigger>
          <TabsTrigger value="data"><Database className="mr-2" />Veri Yönetimi</TabsTrigger>
          <TabsTrigger value="content"><LayoutTemplate className="mr-2" />İçerik Yönetimi</TabsTrigger>
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
        <TabsContent value="data" className="mt-6">
          <BreedManagement />
        </TabsContent>
        <TabsContent value="content" className="mt-6">
          <MenuManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
