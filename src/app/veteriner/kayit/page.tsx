import type { Metadata } from 'next';

import { RegisterClinicForm } from './RegisterClinicForm';

export const metadata: Metadata = {
  title: 'Veteriner Kliniğinizi Ekleyin | PetSemti',
  description:
    'Veteriner kliniğinizi PetSemti rehberine ücretsiz ekleyin. Çalışma saatlerinizi, hizmetlerinizi ve iletişim bilgilerinizi yayınlayın.',
  // Kayıt formu arama sonuçlarında rehber sayfalarıyla rekabet etmemeli.
  robots: { index: false, follow: true },
};

export default function RegisterClinicPage() {
  return <RegisterClinicForm />;
}
