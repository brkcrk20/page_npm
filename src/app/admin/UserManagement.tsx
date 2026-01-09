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
      alert(`${action} action for user ${user.id} is not implemented yet. This requires server-side logic (e.g., Firebase Functions).`);
    }
  };
  
  const handleCloseDialog = () => {
    setSelectedUser(null);
  };

  const getStatusVariant = (status?: UserProfile['userStatus']) => {
    switch (status) {
      case 'premium':
        return 'default';
      case 'onayli':
        return 'secondary';
      case 'yasakli':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleAddUserSubmit = async (values: AddUserFormValues) => {
    form.clearErrors();
    try {
      // Create user in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Save profile to Firestore
      const userProfile: Omit<UserProfile, 'favoritePetIds'> = {
        id: user.uid,
        username: values.username,
        email: values.email,
        userStatus: 'standart',
      };
      
      const userDocRef = doc(firestore, "users", user.uid);
      
      setDoc(userDocRef, userProfile).catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: userProfile
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
                    <TableHead>Statü</TableHead>
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
                      <TableCell>
                        <Badge variant={getStatusVariant(user.userStatus)}>
                          {user.userStatus || 'standart'}
                        </Badge>
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
                <DialogDescription>
                    <span className="font-mono">{selectedUser.id}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="text-sm">
                  <h4 className="font-semibold mb-3 border-b pb-2">Kişisel Bilgiler</h4>
                  <div className="space-y-2">
                    <div><strong>Statü:</strong> <Badge variant={getStatusVariant(selectedUser.userStatus)}>{selectedUser.userStatus || 'standart'}</Badge></div>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Kullanıcı Adı:</strong> {selectedUser.username}</p>
                    <p><strong>Telefon:</strong> {selectedUser.phoneNumber || 'Belirtilmemiş'}</p>
                    <p><strong>Konum:</strong> {selectedUser.location || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                {selectedUser.companyType && (
                    <div className="text-sm">
                        <h4 className="font-semibold mb-3 border-b pb-2 pt-4">Kurumsal Bilgiler</h4>
                        <div className="space-y-2">
                             <p><strong>Şirket Tipi:</strong> {selectedUser.companyType}</p>
                             <p><strong>Firma Ünvanı:</strong> {selectedUser.companyTitle}</p>
                             <p><strong>TC Kimlik No:</strong> {selectedUser.tcNo}</p>
                             <p><strong>Vergi Dairesi:</strong> {selectedUser.taxOffice}</p>
                             <p><strong>Vergi Numarası:</strong> {selectedUser.taxNo}</p>
                             <p><strong>Firma Adresi:</strong> {selectedUser.companyAddress}</p>
                        </div>
                    </div>
                )}
                
                <div className="text-sm">
                   <h4 className="font-semibold mb-3 border-b pb-2 pt-4">İlişkili Veriler</h4>
                    <div className="space-y-2">
                       <div className="flex items-center">
                         <strong className="w-32">Favori İlanlar:</strong>
                         {selectedUser.favoritePetIds && selectedUser.favoritePetIds.length > 0 ? (
                          <span className="flex flex-wrap gap-1">
                            {selectedUser.favoritePetIds.map(id => <Badge key={id} variant="secondary" className="font-mono">{id}</Badge>)}
                          </span>
                        ) : 'Favori ilanı yok'}
                       </div>
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
