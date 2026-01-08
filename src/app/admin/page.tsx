'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export default function AdminPage() {
  
  const handlePasswordlessSignIn = () => {
    // This is a placeholder for now.
    // In a real scenario, you would implement a secure passwordless flow.
    alert("Admin girişi başarılı! (Bu bir yer tutucudur)");
  };

  return (
    <div className="container mx-auto py-12 flex items-center justify-center min-h-[calc(100vh-18rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <LayoutDashboard className="w-8 h-8" />
            </div>
          <CardTitle className="text-3xl font-headline">Admin Paneli</CardTitle>
          <CardDescription>Uygulama yönetimine hoş geldiniz.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Bu bölümden ilanları, kullanıcıları ve diğer ayarları yönetebilirsiniz.
          </p>
          <Button onClick={handlePasswordlessSignIn} className="w-full">
            Şifresiz Giriş Yap
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
