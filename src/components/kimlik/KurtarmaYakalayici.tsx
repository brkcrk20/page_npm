'use client';

import { useEffect } from 'react';

/**
 * Şifre sıfırlama bağlantısını doğru sayfaya taşır.
 *
 * SORUN
 * Supabase, e-postadaki bağlantıda verdiğimiz redirect_to adresini yalnızca
 * panelin "Redirect URLs" listesiyle eşleşiyorsa kullanıyor. Eşleşmezse
 * sessizce Site URL'e düşüyor ve kullanıcı ana sayfada, adresin # kısmında
 * şu şekilde beliriyor:
 *
 *   https://www.petsemti.com#access_token=...&type=recovery
 *
 * # kısmı sunucuya HİÇ gönderilmiyor. Bu yüzden ne orta katman ne de
 * /auth/dogrula bu durumu görebiliyor; kullanıcı şifre formu yerine ana
 * sayfada kalıyordu — üstelik sessizce giriş yapmış olarak.
 *
 * ÇÖZÜM
 * Adresin # kısmındaki type=recovery işaretini tarayıcıda yakalayıp
 * kullanıcıyı /sifre-yenile'ye gönderiyoruz. # kısmı olduğu gibi taşınıyor:
 * oturumu ondan kuran Supabase istemcisi hedef sayfada çalışıyor.
 *
 * Böylece akış, panel ayarı düzeltilmemiş olsa bile çalışıyor.
 */
export function KurtarmaYakalayici() {
  useEffect(() => {
    const parca = window.location.hash;
    if (!parca || parca.length < 2) return;

    const alanlar = new URLSearchParams(parca.slice(1));
    if (alanlar.get('type') !== 'recovery') return;

    // Zaten doğru sayfadaysak dokunma; yoksa sonsuz döngü olur.
    if (window.location.pathname === '/sifre-yenile') return;

    // Tam yönlendirme: hedef sayfa # kısmını kendi okuyabilsin diye.
    window.location.replace('/sifre-yenile' + parca);
  }, []);

  return null;
}
