'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
import { Loader2, ShieldAlert, MoreHorizontal, Eye, Edit, Trash2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PetListing } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function ListingManagement() {
  const { data: listings, isLoading, error } = useAllPetListings();
  const [selectedListing, setSelectedListing] = useState<PetListing | null>(null);

  const handleAction = (action: string, listing: PetListing) => {
    if (action === 'View Details') {
      setSelectedListing(listing);
    } else {
      alert(`${action} action for listing ${listing.id} is not implemented yet.`);
    }
  };

  const handleCloseDialog = () => {
    setSelectedListing(null);
  };

  const getListingTypeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'adoption':
        return 'secondary';
      case 'sale':
        return 'default';
      default:
        return 'outline';
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>İlan Yönetimi</CardTitle>
          <CardDescription>Tüm hayvan ilanlarını görüntüleyin ve yönetin.</CardDescription>
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
                        <TableHead>İlan</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead>Cins</TableHead>
                        <TableHead>Yaş</TableHead>
                        <TableHead>Konum</TableHead>
                        <TableHead>İlan Tipi</TableHead>
                        <TableHead>Fiyat</TableHead>
                        <TableHead>Yıldızlı</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {listings?.map((listing) => (
                      <TableRow key={listing.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={listing.imageUrl} alt={listing.name} className="object-cover" />
                                <AvatarFallback>{listing.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className='flex flex-col'>
                                <span className='font-bold'>{listing.name}</span>
                                <span className="font-mono text-xs text-muted-foreground">{listing.id}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{listing.species}</Badge></TableCell>
                          <TableCell>{listing.breed}</TableCell>
                          <TableCell>{listing.age ?? 'N/A'}</TableCell>
                          <TableCell>{listing.location}</TableCell>
                          <TableCell><Badge variant={getListingTypeVariant(listing.listingType)}>{listing.listingType}</Badge></TableCell>
                          <TableCell>{listing.price ? `${listing.price} TL` : 'Ücretsiz'}</TableCell>
                          <TableCell>
                            {listing.isFeatured ? (
                              <Badge><Star className="mr-1 h-3 w-3" />Evet</Badge>
                            ) : (
                              <Badge variant="secondary">Hayır</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Menüyü aç</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleAction('View Details', listing)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  İlanı Görüntüle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('Edit', listing)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleAction('Delete', listing)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  İlanı Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                      </TableRow>
                      ))}
                  </TableBody>
              </Table>
          )}
          {!isLoading && listings?.length === 0 && (
            <p className="text-center text-muted-foreground py-10">Henüz ilan bulunmuyor.</p>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedListing} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedListing && (
            <>
              <DialogHeader>
                <DialogTitle>İlan Detayları: {selectedListing.name}</DialogTitle>
                <DialogDescription>
                    ID: <span className="font-mono">{selectedListing.id}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <Image src={selectedListing.imageUrl} alt={selectedListing.name} fill className="object-cover" />
                </div>
                <div className="text-sm space-y-2">
                    <h4 className="font-semibold mb-3 border-b pb-2">Temel Bilgiler</h4>
                     <p><strong>İsim:</strong> {selectedListing.name}</p>
                     <p><strong>Tür:</strong> <Badge variant="outline">{selectedListing.species}</Badge></p>
                     <p><strong>Cins:</strong> {selectedListing.breed}</p>
                     <p><strong>Yaş:</strong> {selectedListing.age ?? 'Belirtilmemiş'}</p>
                     <p><strong>Konum:</strong> {selectedListing.location}</p>
                </div>
                 <div className="text-sm space-y-2">
                    <h4 className="font-semibold mb-3 border-b pb-2 pt-2">İlan Bilgileri</h4>
                     <p><strong>İlan Tipi:</strong> <Badge variant={getListingTypeVariant(selectedListing.listingType)}>{selectedListing.listingType}</Badge></p>
                     <p><strong>Fiyat:</strong> {selectedListing.price ? `${selectedListing.price} TL` : 'Ücretsiz'}</p>
                      <p><strong>Yıldızlı İlan:</strong> {selectedListing.isFeatured ? 'Evet' : 'Hayır'}</p>
                     <p><strong>Açıklama:</strong> {selectedListing.description}</p>
                </div>
                 <div className="text-sm space-y-2">
                    <h4 className="font-semibold mb-3 border-b pb-2 pt-2">İlan Sahibi</h4>
                     <p><strong>Kullanıcı ID:</strong> <span className='font-mono'>{selectedListing.userId}</span></p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>Kapat</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
