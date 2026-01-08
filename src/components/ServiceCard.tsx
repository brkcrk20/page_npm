import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ServiceCardProps {
  icon: ReactNode;
  title: string;
  className?: string;
}

export function ServiceCard({ icon, title, className }: ServiceCardProps) {
  return (
    <Card className={cn("text-center p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-2 hover:bg-card", className)}>
      <div className="text-primary w-12 h-12 [&>svg]:w-full [&>svg]:h-full">
        {icon}
      </div>
      <h3 className="font-bold font-headline text-lg">{title}</h3>
    </Card>
  );
}