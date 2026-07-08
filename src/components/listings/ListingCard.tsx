import Link from 'next/link';
import Image from 'next/image';

interface ListingProps {
  id: string;
  baslik?: string;
  title?: string;
  fiyat?: number;
  price?: number;
  sehir?: string;
  city?: string;
  ilce?: string;
  district?: string;
  fotoUrl?: string[];
  imageUrls?: string[];
  kategori?: string;
  category?: string;
  yas?: string;
  age?: string;
}

export default function ListingCard({ data }: { data: ListingProps }) {
  const baslik = data.baslik || data.title || 'Başlıksız İlan';
  const fiyat = data.fiyat !== undefined ? data.fiyat : (data.price !== undefined ? data.price : 0);
  const sehir = data.sehir || data.city || 'Belirtilmemiş';
  const ilce = data.ilce || data.district || '';
  const fotoUrl = data.fotoUrl || data.imageUrls || [];
  const kategori = data.kategori || data.category || 'sahiplendirme';
  const yas = data.yas || data.age || 'Belirtilmemiş';
  
  const lokasyon = ilce ? `${sehir} / ${ilce}` : sehir;

  return (
    <Link href={`/${data.id}`} className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden">
      <div className="relative h-48 w-full bg-gray-100">
        {fotoUrl && fotoUrl[0] ? (
          <Image
            src={fotoUrl[0]}
            alt={baslik}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Resim Yok
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-white/90 backdrop-blur text-orange-600 text-xs font-bold px-2 py-1 rounded shadow-sm">
            {sehir}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {baslik}
          </h3>
        </div>

        <div className="flex items-center text-sm text-gray-500 gap-2 mb-3">
          <span>{ilce || sehir}</span>
          <span>•</span>
          <span>{yas}</span>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-50">
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600 uppercase">
            {kategori}
          </span>
          <span className="font-bold text-orange-600">
            {fiyat > 0 ? `${fiyat} ₺` : 'Ücretsiz'}
          </span>
        </div>
      </div>
    </Link>
  );
}