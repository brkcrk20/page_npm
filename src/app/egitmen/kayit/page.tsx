import type { Metadata } from 'next';

import { RegisterServiceForm } from '@/components/services/RegisterServiceForm';
import { getServiceConfigBySlug } from '@/lib/services-config';

// ÜRETİLMİŞ DOSYA — scripts/generate-service-pages.ts

const config = getServiceConfigBySlug('egitmen')!;

export const metadata: Metadata = {
  title: `${config.registerCta}`,
  description: `${config.label} rehberine ücretsiz kayıt olun.`,
  // Kayıt formu arama sonuçlarında rehber sayfalarıyla rekabet etmemeli.
  robots: { index: false, follow: true },
};

export default function Page() {
  return <RegisterServiceForm config={config} />;
}
