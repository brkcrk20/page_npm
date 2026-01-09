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
import { Loader2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function UserManagement() {
  const { data: users, isLoading, error } = useAllUsers();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kullanıcı Yönetimi</CardTitle>
        <CardDescription>Tüm kayıtlı kullanıcıları görüntüleyin.</CardDescription>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.location || "Belirtilmemiş"}</TableCell>
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
