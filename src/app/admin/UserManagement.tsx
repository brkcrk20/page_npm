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
import { Loader2, ShieldAlert, MoreHorizontal, UserPlus, Trash2, Ban, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserManagement() {
  const { data: users, isLoading, error } = useAllUsers();

  const handleAction = (action: string, userId: string) => {
    alert(`${action} action for user ${userId} is not implemented yet. This requires server-side logic (e.g., Firebase Functions).`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Kullanıcı Yönetimi</CardTitle>
            <CardDescription>Tüm kayıtlı kullanıcıları görüntüleyin.</CardDescription>
        </div>
        <Button onClick={() => handleAction('Add User', '')}>
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
                          <DropdownMenuItem onClick={() => handleAction('Approve', user.id)}>
                            Kullanıcıyı Onayla
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={() => handleAction('Change Role', user.id)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Rolünü Değiştir
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleAction('Ban', user.id)}>
                            <Ban className="mr-2 h-4 w-4" />
                            Kullanıcıyı Yasakla
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleAction('Delete', user.id)}>
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
  )
}
