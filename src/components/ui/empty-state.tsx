import * as React from "react"
import { Inbox, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * EmptyState — liste/koleksiyon boş olduğunda gösterilecek standart durum
 * bileşeni ("Henüz ilan yok", "Sonuç bulunamadı" vb. ekranlar için).
 *
 * Var olan sayfalardaki (ör. ServiceManagement.tsx içindeki
 * "Henüz hizmet bulunmuyor.") metinler bilinçli olarak değiştirilmedi;
 * bu, ileride kullanılabilecek standart bir altyapı parçasıdır.
 */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { className, icon: Icon = Inbox, title, description, action, ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-ds-6 py-ds-12 text-center",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-ds-body font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-ds-body-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
