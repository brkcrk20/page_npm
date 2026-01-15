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
import { Loader2, ShieldAlert, MoreHorizontal, UserPlus, Trash2, Ban, UserCog, Star, FileText } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useState } from "react";
import type { UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const addUserSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi girin.' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır.' }),
  username: z.string().min(2, { message: 'Kullanıcı adı en az 2 karakter olmalıdır.' }),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

export function UserManagement() {
  const { data: users, isLoading, error } = useAllUsers();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { email: '', password: '', username: '' },
  });

  const handleAction = (action: string, user: UserProfile) => {
    if (action === 'View Details') {
      setSelectedUser(user);
    } else {
      toast({
        title: "Bilgi",
        description: `${action} işlemi henüz aktif değil. Firebase Functions gerektirir.`,
      });
    }
  };
  
  const handleCloseDialog = () => {
    setSelectedUser(null);
  };

  const getStatusVariant = (status?: UserProfile['userStatus']) => {
    switch (status) {
      case 'premium': return 'default';
      case 'onayli': return 'secondary';
      case 'yasakli': return 'destructive';
      default: return 'outline';
    }
  };

  const handleAddUserSubmit = async (values: AddUserFormValues) => {
    form.clearErrors();
    try {
      // 1. Firebase Auth üzerinde kullanıcıyı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Firestore için profil objesini hazırla
      // DÜZELTME: 'name' ve 'favoritePetIds' alanlarını ekleyerek tip hatasını giderdik
      const newUserProfile: UserProfile = {
        id: user.uid,
        name: values.username, // Formdaki username'i 'name' olarak da atıyoruz
        username: values.username,
        email: values.email,
        userStatus: 'standart',
        favoritePetIds: [], // Boş bir dizi olarak başlatıyoruz
      };
      
      const userDocRef = doc(firestore, "users", user.uid);
      
      // 3. Firestore'a kaydet
      await setDoc(userDocRef, newUserProfile).catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: newUserProfile
          })
        );
      });

      toast({
        title: "Kullanıcı Oluşturuldu",
        description: `${values.email} başarıyla eklendi.`,
      });
      setIsAddUserDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Add user error:", error);
      let description = "Kullanıcı oluşturulurken bir hata oluştu.";
      if (error.code === 'auth/email-already-in-use') {
        form.setError('email', { message: 'Bu e-posta adresi zaten kullanılıyor.' });
        description = "Bu e-posta adresi zaten kullanılıyor.";
      }
      toast({
        variant: "destructive",
        title: "İşlem Başarısız",
        description: description,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Kullanıcı Yönetimi</CardTitle>
              <CardDescription>Tüm kayıtlı kullanıcıları görüntüleyin.</CardDescription>
          </div>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Yeni Kullanıcı Ekle
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                    <DialogDescription>
                        Yeni bir kullanıcı oluşturmak için formu doldurun.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddUserSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-posta</FormLabel>
                                    <FormControl>
                                        <Input placeholder="kullanici@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Şifre</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kullanıcı Adı</FormLabel>
                                    <FormControl>
                                        <Input placeholder="kullanici123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsAddUserDialogOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Kullanıcı Oluştur
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
          </Dialog>
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
                    <TableHead>Kullanıcı ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>İsim / Kullanıcı Adı</TableHead>
                    <TableHead>Statü</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name || user.username || "İsimsiz"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(user.userStatus)}>
                          {user.userStatus || 'standart'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleAction('View Details', user)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Detaylar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('Make Premium', user)}>
                              <Star className="mr-2 h-4 w-4" />
                              Premium Yap
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleAction('Ban', user)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Yasakla
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Detaylar Dialogu */}
      <Dialog open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Kullanıcı Detayları</DialogTitle>
                <DialogDescription className="font-mono text-xs">{selectedUser.id}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p><strong>İsim:</strong> {selectedUser.name || 'Belirtilmemiş'}</p>
                  <p><strong>Kullanıcı Adı:</strong> {selectedUser.username}</p>
                  <p><strong>E-posta:</strong> {selectedUser.email}</p>
                  <p><strong>Durum:</strong> <Badge variant={getStatusVariant(selectedUser.userStatus)}>{selectedUser.userStatus || 'standart'}</Badge></p>
                  <p><strong>Konum:</strong> {selectedUser.location || 'Belirtilmemiş'}</p>
                  <p><strong>Telefon:</strong> {selectedUser.phoneNumber || 'Belirtilmemiş'}</p>
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