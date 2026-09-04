import { permanentRedirect } from 'next/navigation';

/**
 * Eş arayan ilanı verme.
 *
 * İlan şemasında `es_arayan` zaten bir ilan tipi; ayrı bir akış tutmanın
 * anlamı yok, tüm ilanlar tek formdan geçiyor.
 */
export default function NewMatingListingPage() {
  permanentRedirect('/ilan-ver/es-arayan');
}
