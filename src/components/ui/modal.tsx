"use client"

import * as React from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * Modal — `Dialog` primitiflerinin üzerine kurulmuş, sık kullanılan
 * "başlık + içerik + footer" düzenini tek prop setiyle sunan yüksek
 * seviyeli bileşen. Var olan `Dialog` bileşenine hiçbir değişiklik
 * yapılmadı; Modal onu compose eder.
 *
 * Özel/karmaşık düzenler için doğrudan `Dialog*` primitiflerini kullanmaya
 * devam edebilirsiniz — ikisi birbiriyle tamamen uyumludur.
 *
 * Örnek:
 * ```tsx
 * <Modal
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Emin misiniz?"
 *   description="Bu işlem geri alınamaz."
 *   footer={<Button onClick={onConfirm}>Onayla</Button>}
 * >
 *   <p>İçerik...</p>
 * </Modal>
 * ```
 */
export interface ModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

export { Modal, DialogClose as ModalClose }
