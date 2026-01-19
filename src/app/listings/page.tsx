import { redirect } from 'next/navigation';

export default async function ListingRedirect({ params }: { params: { id: string } }) {
  // Eski /listings/ID adresine gelen herkesi /ilan/ID adresine gönder
  redirect(`/ilan/${params.id}`);
}