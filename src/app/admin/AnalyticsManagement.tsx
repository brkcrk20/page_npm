'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, PawPrint, Layers, Signal } from "lucide-react";
import { useAllUsers, useAllPetListings, useAllServices } from "@/firebase/firestore/admin-hooks";

export function AnalyticsManagement() {
    const { data: users, isLoading: usersLoading } = useAllUsers();
    const { data: listings, isLoading: listingsLoading } = useAllPetListings();
    const { data: services, isLoading: servicesLoading } = useAllServices();

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Toplam Kullanıcı
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {usersLoading ? '...' : users?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Kayıtlı tüm kullanıcıların sayısı
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Toplam İlan
                </CardTitle>
                <PawPrint className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {listingsLoading ? '...' : listings?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Tüm evcil hayvan ilanları
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Hizmet</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {servicesLoading ? '...' : services?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                Tüm hizmet ve servis sağlayıcılar
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Aktif Kullanıcı
                </CardTitle>
                <Signal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">N/A</div>
                <p className="text-xs text-muted-foreground">
                (Realtime DB Gerekli)
                </p>
            </CardContent>
            </Card>
        </div>
    </div>
  );
}
