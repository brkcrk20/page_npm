import * as React from "react"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Spinner — Design System içindeki tekil dönen yükleme ikonu.
 * Tek başına küçük alanlarda (buton içi, satır içi durum göstergesi vb.)
 * kullanılmak üzere tasarlandı. Tam sayfa / bölüm yüklemeleri için
 * `Loading` bileşenini kullanın.
 */
const spinnerVariants = cva("animate-spin text-muted-foreground", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
    tone: {
      default: "text-muted-foreground",
      primary: "text-primary",
      current: "text-current",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
  },
})

export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, tone, label = "Yükleniyor", ...props }, ref) => (
    <Loader2
      ref={ref}
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size, tone, className }))}
      {...props}
    />
  )
)
Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants }
