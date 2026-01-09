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
import { useAllPetListings } from "@/firebase/firestore/admin-hooks";
import { Loader2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ListingManagement() {
  const { data: listings, isLoading, error } = useAllPetListings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>İlan Yönetimi</CardTitle>
        <CardDescription>Tüm hayvan ilanlarını görüntüleyin.</CardDescription>
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
                    <TableHead>İsim</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Cins</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead>İlan Tipi</TableHead>
                    <TableHead>Sahip ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {listings?.map((listing) => (
                    <TableRow key={listing.id}>
                        <TableCell className="font-mono text-xs">{listing.id}</TableCell>
                        <TableCell>{listing.name}</TableCell>
                        <TableCell><Badge variant="outline">{listing.species}</Badge></TableCell>
                        <TableCell>{listing.breed}</TableCell>
                        <TableCell>{listing.location}</TableCell>
                        <TableCell><Badge>{listing.listingType}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{listing.userId}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
         {!isLoading && listings?.length === 0 && (
          <p className="text-center text-muted-foreground">Henüz ilan bulunmuyor.</p>
        )}
      </CardContent>
    </Card>
  )
}
