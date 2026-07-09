import * as React from "react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

/**
 * Divider — `Separator` primitifi üzerine kurulu, opsiyonel ortalanmış
 * etiket ("veya" gibi) desteği ekleyen tasarım sistemi bileşeni.
 * Etiketsiz kullanım için doğrudan `Separator` kullanmaya devam edebilirsiniz;
 * ikisi birbirini değiştirmez, Divider yalnızca ek bir kullanım deseni sunar.
 */
export interface DividerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode
  orientation?: "horizontal" | "vertical"
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, label, orientation = "horizontal", ...props }, ref) => {
    if (!label || orientation === "vertical") {
      return (
        <Separator
          orientation={orientation}
          className={className}
          {...(props as React.ComponentProps<typeof Separator>)}
        />
      )
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-ds-3", className)}
        {...props}
      >
        <Separator className="shrink" />
        <span className="text-ds-caption uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Separator className="shrink" />
      </div>
    )
  }
)
Divider.displayName = "Divider"

export { Divider }
