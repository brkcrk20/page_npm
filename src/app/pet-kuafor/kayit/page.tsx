import type { Metadata } from 'next';

import { RegisterServiceForm } from '@/components/services/RegisterServiceForm';
import { getServiceConfigBySlug } from '@/lib/services-config';

// ÜRETİLMİŞ DOSYA — scripts/generate-service-pages.ts

const config = getServiceConfigBySlug('pet-kuafor')!;

export const metadata: Metadata = {
  title: `${config.registerCta} | PetSemti`,
  description: `${config.label} rehberine ücretsiz kayıt olun.`,
  // Kayıt formu arama sonuçlarında rehber sayfalarıyla rekabet etmemeli.
  robots: { index: false, follow: true },
};

export default function Page() {
  return <RegisterServiceForm config={config} />;
}
