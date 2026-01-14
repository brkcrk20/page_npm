import Link from 'next/link';
import Image from 'next/image';

interface ListingProps {
  id: string;
  title: string;
  price: number;
  city: string;
  district: string;
  imageUrls: string[];
  category: string;
  type: string;
  age: string;
}

export default function ListingCard({ data }: { data: ListingProps }) {
  return (
    <Link href={`/ilan/${data.id}`} className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden">
      {/* Resim Alanı */}
      <div className="relative h-48 w-full bg-gray-100">
        {data.imageUrls && data.imageUrls[0] ? (
          <Image
            src={data.imageUrls[0]}
            alt={data.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Resim Yok
          </div>
        )}
        
        {/* Etiketler (Sol Üst) */}
        <div className="absolute top-3 left-3 flex gap-2">
           <span className="bg-white/90 backdrop-blur text-orange-600 text-xs font-bold px-2 py-1 rounded shadow-sm">
             {data.city}
           </span>
        </div>
      </div>

      {/* İçerik */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {data.title}
          </h3>
        </div>

        <div className="flex items-center text-sm text-gray-500 gap-2 mb-3">
          <span>{data.district}</span>
          <span>•</span>
          <span>{data.age} Yaş</span>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-50">
           <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600 uppercase">
             {data.category}
           </span>
           <span className="font-bold text-orange-600">
             {data.price > 0 ? `${data.price} ₺` : 'Ücretsiz'}
           </span>
        </div>
      </div>
    </Link>
  );
}