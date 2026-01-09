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
import { useAllUsers } from "@/firebase/firestore/admin-hooks";
import { Loader2, ShieldAlert, MoreHorizontal, UserPlus, Trash2, Ban, UserCog, Star, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import React, { useState } from "react";
import type { UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function UserManagement() {
  const { data: users, isLoading, error } = useAllUsers();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const handleAction = (action: string, user: UserProfile) => {
    if (action === 'View Details') {
      setSelectedUser(user);
    } else {
      alert(`${action} action for user ${user.id} is not implemented yet. This requires server-side logic (e.g., Firebase Functions).`);
    }
  };
  
  const handleCloseDialog = () => {
    setSelectedUser(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Kullanıcı Yönetimi</CardTitle>
              <CardDescription>Tüm kayıtlı kullanıcıları görüntüleyin.</CardDescription>
          </div>
          <Button onClick={() => alert('Yeni kullanıcı ekleme özelliği henüz eklenmedi.')}>
              <UserPlus className="mr-2 h-4 w-4" />
              Yeni Kullanıcı Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}
          {error && (
              <div className="text-center text-red-500 flex flex-col items-center gap-4">
                  <ShieldAlert className="w-16 h-16" />
                  <p className="font-bold">Veri Çekilemedi</p>
                  <p className="text-xs text-muted-foreground">
                      Admin yetkileri için Firestore kuralları ayarlanmamış olabilir. <br />
                      <code>`rules_version = '2'; service cloud.firestore {'{'} match /databases/{'{'}database{'}'}/documents {'{'}`</code>
                  </p>
              </div>
          )}
          {!isLoading && !error && (
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Kullanıcı Adı</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.location || "Belirtilmemiş"}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleAction('View Details', user)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Kullanıcı Bilgileri
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleAction('Make Premium', user)}>
                              <Star className="mr-2 h-4 w-4" />
                              Premium Yap
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => handleAction('Change Role', user)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              Rolünü Değiştir
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleAction('Ban', user)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Kullanıcıyı Yasakla
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleAction('Delete', user)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Kullanıcıyı Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
          {!isLoading && users?.length === 0 && (
            <p className="text-center text-muted-foreground">Henüz kayıtlı kullanıcı bulunmuyor.</p>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Kullanıcı Detayları: {selectedUser.username}</DialogTitle>
                <DialogDescription>Kullanıcı ID: <span className="font-mono">{selectedUser.id}</span></DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right font-bold">Email</span>
                  <span className="col-span-3">{selectedUser.email}</span>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right font-bold">Kullanıcı Adı</span>
                  <span className="col-span-3">{selectedUser.username}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right font-bold">Telefon</span>
                  <span className="col-span-3">{selectedUser.phoneNumber || 'Belirtilmemiş'}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right font-bold">Konum</span>
                  <span className="col-span-3">{selectedUser.location || 'Belirtilmemiş'}</span>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <span className="text-right font-bold pt-1">Favori İlanlar</span>
                  <div className="col-span-3">
                    {selectedUser.favoritePetIds && selectedUser.favoritePetIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedUser.favoritePetIds.map(id => <Badge key={id} variant="secondary" className="font-mono">{id}</Badge>)}
                      </div>
                    ) : 'Favori ilanı yok'}
                  </div>
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
