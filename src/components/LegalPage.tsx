import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * Bilgilendirme ve sözleşme sayfalarının ortak kabuğu.
 *
 * Dört sayfa da aynı yapıda: başlık, güncelleme tarihi, uzun metin ve
 * iletişim kutusu. Ayrı ayrı yazmak, birinde yapılan düzeltmenin
 * diğerlerine geçmemesi demekti.
 */
export function LegalPage({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string;
  updatedAt: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-secondary/30">
      <div className="mx-auto w-full max-w-3xl px-5 py-8 md:py-12">
        <nav aria-label="Kırıntı navigasyonu" className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            Ana Sayfa
          </Link>
          <span aria-hidden className="mx-1">›</span>
          <span className="text-foreground">{title}</span>
        </nav>

        <article className="rounded-xl border bg-white p-6 md:p-8">
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">Son güncelleme: {updatedAt}</p>
          {intro && <p className="mt-4 text-muted-foreground">{intro}</p>}

          <div className="prose-legal mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}

/** Numaralı başlık — sözleşme metinlerinde maddeye atıf yapılabilsin diye. */
export function Clause({ no, title, children }: { no: string; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-foreground">
        {no}. {title}
      </h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
