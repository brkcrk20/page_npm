import * as React from "react"

import { cn } from "@/lib/utils"
import { Spinner, type SpinnerProps } from "@/components/ui/spinner"

/**
 * Loading — bir bölüm veya sayfanın veri beklerken gösterdiği standart
 * durum bileşeni. `Spinner` üzerine kurulu; ek olarak ortalama düzeni ve
 * opsiyonel açıklama metni sağlar.
 *
 * Not: Bu bileşen mevcut sayfalara otomatik enjekte edilmemiştir. Var olan
 * `Loader2` kullanımları (ör. ServiceManagement.tsx) bilinçli olarak
 * değiştirilmemiştir; bu, ileride kullanılabilecek standart bir altyapı
 * parçasıdır.
 */
export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spinner altında gösterilecek opsiyonel metin. */
  text?: string
  /** Spinner boyutu, bkz. SpinnerProps. */
  size?: SpinnerProps["size"]
  /** Tam ekran/section yüksekliğini kaplasın mı (min-h-[40vh]). */
  fullHeight?: boolean
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, text, size = "lg", fullHeight = false, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 py-ds-8 text-center",
        fullHeight && "min-h-[40vh]",
        className
      )}
      {...props}
    >
      <Spinner size={size} tone="primary" />
      {text && <p className="text-ds-body-sm text-muted-foreground">{text}</p>}
    </div>
  )
)
Loading.displayName = "Loading"

export { Loading }
