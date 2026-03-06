'use client';

import { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase'; // DEĞİŞTİ: auth, db yerine initializeFirebase
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

// 81 İL VERİSİNİ İÇEREN DOSYAYI ÇAĞIRIYORUZ
import { citiesData, cityNames } from '@/lib/turkiye-data';

export default function FaturaBilgileriPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('...');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    taxNumber: '',
    city: '',
    district: '',
    taxOffice: ''
  });

  useEffect(() => {
    const { auth } = initializeFirebase(); // Firebase servislerini al
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setUserName(user.displayName || user.email?.split('@')[0] || 'Kullanıcı');
        
        // Kullanıcının mevcut fatura bilgilerini getir
        try {
          const { firestore } = initializeFirebase();
          const userRef = doc(firestore, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().billingInfo) {
            const billing = userSnap.data().billingInfo;
            setFormData({
              fullName: billing.fullName || '',
              taxNumber: billing.taxNumber || '',
              city: billing.city || '',
              district: billing.district || '',
              taxOffice: billing.taxOffice || ''
            });
          }
        } catch (error) {
          console.error("Fatura bilgileri getirilemedi:", error);
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("1. Form gönderildi");
    console.log("2. currentUser:", currentUser?.uid);
    
    if (!currentUser) {
      console.log("3. Kullanıcı yok!");
      return;
    }
    
    setLoading(true);
    console.log("4. Loading başladı");
  
    try {
      const { firestore } = initializeFirebase();
      console.log("5. Firestore alındı");
      
      const userRef = doc(firestore, 'users', currentUser.uid);
      console.log("6. UserRef oluşturuldu:", userRef.path);
      
      await updateDoc(userRef, {
        billingInfo: formData,
        hasBillingInfo: true
      });
      console.log("7. Firestore güncellemesi başarılı");
      
      console.log("8. Yönlendirme yapılıyor...");
      router.push('/listings/new');
      console.log("9. Yönlendirme komutu verildi");
      
    } catch (error) {
      console.error("10. HATA YAKALANDI:", error);
      alert("Bir hata oluştu: " + error);
    } finally {
      console.log("11. Finally bloğu çalıştı");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-12">
        
        {/* Başlık Alanı */}
        <div className="text-center mb-10">
          <h1 className="text-orange-600 text-3xl font-bold mb-4">
            Fatura Bilgilerinizi Doğrulayın
          </h1>
          <p className="text-gray-600 text-[15px] leading-relaxed max-w-3xl mx-auto">
            Sayın <span className="font-bold text-gray-800">{userName}</span>, yasal düzenlemeler gereği ilan vermeye devam edebilmeniz için fatura bilgilerinizi girmeniz gerekmektedir. İşlem sonrası otomatik yönlendirileceksiniz.
          </p>
        </div>

        {/* Form Kartı */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          
          {/* Kart Başlığı - Turuncu */}
          <div className="bg-orange-600 px-8 py-5 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold tracking-wide">Fatura Bilgileri</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-10">
            <p className="text-gray-500 text-sm mb-8 italic border-l-4 border-orange-200 pl-3">
              Lütfen fatura kesilecek kişi veya kurum bilgilerini eksiksiz doldurunuz.
            </p>

            <div className="space-y-6">
              {/* Ad Soyad */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Ad Soyad / Firma Ünvanı <span className="text-red-500 select-none">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Örn: Ahmet Yılmaz veya petsemti Ltd. Şti."
                  className="w-full p-3.5 border border-gray-300 rounded-lg text-gray-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              {/* TC / Vergi No */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  TC Kimlik No / Vergi No <span className="text-red-500 select-none">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="11 haneli TC veya 10 haneli Vergi No"
                  maxLength={11}
                  className="w-full p-3.5 border border-gray-300 rounded-lg text-gray-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                />
              </div>

              {/* İL VE İLÇE SEÇİMİ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* İL SEÇİMİ */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    İl <span className="text-red-500 select-none">*</span>
                  </label>
                  <select
                    required
                    value={formData.city}
                    className="w-full p-3.5 border border-gray-300 rounded-lg text-gray-700 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer"
                    onChange={(e) => setFormData({ 
                        ...formData, 
                        city: e.target.value, 
                        district: '' // İl değişirse ilçe sıfırlanır
                    })}
                  >
                    <option value="">İl Seçiniz</option>
                    {cityNames.map((city) => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* İLÇE SEÇİMİ */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    İlçe <span className="text-red-500 select-none">*</span>
                  </label>
                  <select
                    required
                    value={formData.district}
                    disabled={!formData.city} // İl seçilmeden açılmaz
                    className="w-full p-3.5 border border-gray-300 rounded-lg text-gray-700 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  >
                    <option value="">
                        {formData.city ? "İlçe Seçiniz" : "Önce İl Seçiniz"}
                    </option>
                    {formData.city && citiesData[formData.city]?.map((dist) => (
                        <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vergi Dairesi */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Vergi Dairesi <span className="text-gray-400 font-normal text-xs ml-1">(Bireysel kullanıcılar için opsiyonel)</span>
                </label>
                <input
                  type="text"
                  placeholder="Vergi Dairesi Adı"
                  className="w-full p-3.5 border border-gray-300 rounded-lg text-gray-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  value={formData.taxOffice}
                  onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                />
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex flex-col-reverse md:flex-row justify-between items-center mt-10 pt-6 border-t border-gray-100 gap-4">
              
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full md:w-auto px-6 py-3 rounded-lg text-gray-600 font-bold hover:bg-gray-100 hover:text-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <span>←</span> Anasayfaya Dön
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-3.5 rounded-lg font-bold shadow-lg shadow-orange-200 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <span>Bilgileri Kaydet ve Devam Et</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}