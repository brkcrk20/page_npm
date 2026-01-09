'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAllServices } from "@/firebase/firestore/admin-hooks";
import { Loader2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ServiceManagement() {
  const { data: services, isLoading, error } = useAllServices();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hizmet Yönetimi</CardTitle>
        <CardDescription>Tüm hizmet sağlayıcılarını görüntüleyin.</CardDescription>
      </CardHeader>
      <CardContent>
         {isLoading && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}
         {error && (
            <div className="text-center text-red-500 flex flex-col items-center gap-4">
                <ShieldAlert className="w-16 h-16" />
                <p className="font-bold">Veri Çekilemedi</p>
                <p className="text-xs text-muted-foreground">
                    Admin yetkileri için Firestore kuralları ayarlanmamış olabilir.
                </p>
            </div>
        )}
        {!isLoading && !error && (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Firma Adı</TableHead>
                    <TableHead>Türü</TableHead>
                    <TableHead>Adres</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Sahip ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services?.map((service) => (
                    <TableRow key={service.id}>
                        <TableCell className="font-mono text-xs">{service.id}</TableCell>
                        <TableCell>{service.name}</TableCell>
                        <TableCell><Badge variant="secondary">{service.type}</Badge></TableCell>
                        <TableCell>{service.address}</TableCell>
                        <TableCell>{service.phoneNumber}</TableCell>
                        <TableCell className="font-mono text-xs">{service.userId}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
         {!isLoading && services?.length === 0 && (
          <p className="text-center text-muted-foreground">Henüz hizmet bulunmuyor.</p>
        )}
      </CardContent>
    </Card>
  )
}
