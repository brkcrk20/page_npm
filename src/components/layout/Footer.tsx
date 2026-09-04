'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import type { SiteContact } from '@/lib/queries/site-settings';
import { Logo } from '@/components/Logo';
import {
  PawPrint,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Phone,
  Mail,
  MessageCircle,
  ArrowUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// A simple SVG placeholder for logos like iyzico, visa, etc.


export function Footer({ contact = {} }: { contact?: SiteContact }) {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const footerLinkStyle = "text-sm text-gray-600 hover:text-primary transition-colors";
  const footerTitleStyle = "text-base font-bold text-gray-800 mb-4";

  return (
    <footer className="bg-secondary/50 border-t">
      <div className="container mx-auto py-12 px-4">
        {/* Top Section: Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Brand */}
          <div className="col-span-1 lg:col-span-1">
            <Link href="/" className="mb-4 inline-flex" aria-label="PetSemti ana sayfa">
              <Logo size={40} showTagline />
            </Link>
            {/* Marka cümlesi site geneliyle aynı; bkz. app/layout.tsx. */}
            <p className="text-sm text-gray-600">
              PetSemti, evcil hayvan sahiplerini ilanlar, yerel pet hizmetleri ve
              güvercin dünyasıyla buluşturan pet yaşam platformudur. Sahiplendirmeden
              kayıp ilanına, veterinerden pet oteline 81 ilde. İlan vermek ücretsiz.
            </p>
          </div>

          {/* Column 2: Dog Breeds */}
          <div>
            <h3 className={footerTitleStyle}>Köpek İlanları</h3>
            <ul className="space-y-2">
              <li><Link href="/kopek-ilanlari/pomeranian-boo" className={footerLinkStyle}>Pomeranian Boo</Link></li>
              <li><Link href="/kopek-ilanlari/maltipoo" className={footerLinkStyle}>Maltipoo</Link></li>
              <li><Link href="/kopek-ilanlari/maltese-terrier" className={footerLinkStyle}>Maltese Terrier</Link></li>
              <li><Link href="/kopek-ilanlari/golden-retriever" className={footerLinkStyle}>Golden Retriever</Link></li>
              <li><Link href="/kopek-ilanlari/toy-poodle" className={footerLinkStyle}>Toy Poodle</Link></li>
            </ul>
          </div>

          {/* Column 3: Cat Breeds */}
          <div>
            <h3 className={footerTitleStyle}>Kedi İlanları</h3>
            <ul className="space-y-2">
              <li><Link href="/kedi-ilanlari/british-shorthair" className={footerLinkStyle}>British Shorthair</Link></li>
              <li><Link href="/kedi-ilanlari/scottish-fold" className={footerLinkStyle}>Scottish Fold</Link></li>
              <li><Link href="/kedi-ilanlari/iran-kedisi" className={footerLinkStyle}>İran Kedisi</Link></li>
              <li><Link href="/kedi-ilanlari/siyam" className={footerLinkStyle}>Siyam</Link></li>
              <li><Link href="/kedi-ilanlari/van-kedisi" className={footerLinkStyle}>Van Kedisi</Link></li>
            </ul>
          </div>

          {/* Column 4: Corporate */}
          <div>
            <h3 className={footerTitleStyle}>Kurumsal</h3>
            <ul className="space-y-2">
              <li><Link href="/gizlilik-politikasi" className={footerLinkStyle}>Gizlilik Politikası</Link></li>
              <li><Link href="/ilan-kurallari" className={footerLinkStyle}>İlan Verme Kuralları</Link></li>
              <li><Link href="/kullanim-sartlari" className={footerLinkStyle}>Kullanım Şartları</Link></li>
              {/* CC BY / CC BY-SA lisanslı cins görselleri atıf zorunlu tutuyor;
                  bu bağlantı yasal yükümlülüğün parçası, kaldırılmamalı. */}
              <li><Link href="/gorsel-kaynaklari" className={footerLinkStyle}>Görsel Kaynakları</Link></li>
            </ul>
          </div>

          {/* Column 5: General */}
          <div>
            <h3 className={footerTitleStyle}>Genel Bilgiler</h3>
            <ul className="space-y-2">
              <li><Link href="/hakkimizda" className={footerLinkStyle}>Hakkımızda</Link></li>
              <li><Link href="/iletisim" className={footerLinkStyle}>İletişim</Link></li>
            </ul>
          </div>
        </div>

        {/* Middle Section: Contact Info & Social */}
        <div className="border-t mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Yalnızca ayarlarda TANIMLI olan iletişim bilgisi gösteriliyor.
                Buradaki değerler daha önce koda gömülü yer tutuculardı
                (0555 555 55 55, wa.me/905555555555) ve her ziyaretçiye
                gösteriliyordu — arayan kişiyi başkasının numarasına
                düşürebilecek bir hata. */}
            <div className="flex flex-col items-center gap-6 text-sm text-gray-700 md:flex-row">
                {(contact.phone || contact.email || contact.whatsapp) && (
                  <h3 className="hidden text-base font-bold md:block">BİZE ULAŞIN</h3>
                )}
                {contact.phone && (
                  <Link href={`tel:${contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-primary">
                    <Phone className="h-4 w-4" /> {contact.phone}
                  </Link>
                )}
                {contact.email && (
                  <Link href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary">
                    <Mail className="h-4 w-4" /> {contact.email}
                  </Link>
                )}
                {contact.whatsapp && (
                  <Link
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    className="flex items-center gap-2 hover:text-primary"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Link>
                )}
            </div>
            <div className="flex space-x-2">
                {contact.facebook && (
                  <Link href={contact.facebook} target="_blank" aria-label="Facebook" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:opacity-80"><Facebook className="h-5 w-5" /></Link>
                )}
                {contact.x && (
                  <Link href={contact.x} target="_blank" aria-label="X" className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white hover:opacity-80"><Twitter className="h-5 w-5" /></Link>
                )}
                {contact.instagram && (
                  <Link href={contact.instagram} target="_blank" aria-label="Instagram" className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-white hover:opacity-80"><Instagram className="h-5 w-5" /></Link>
                )}
                {contact.youtube && (
                  <Link href={contact.youtube} target="_blank" aria-label="YouTube" className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white hover:opacity-80"><Youtube className="h-5 w-5" /></Link>
                )}
            </div>
        </div>

        {/* Bottom Section: Copyright & Badges */}
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 order-2 md:order-1">
            &copy; {new Date().getFullYear()} petsemti. Tüm hakları saklıdır.
          </p>
          {/* ISO, TÜRKPATENT, iyzico, VISA, Mastercard, AMEX ve troy rozetleri
              KALDIRILDI. Sitede kart ödemesi yok (ücretlendirme kapalı, ödeme
              sağlayıcısı seçilmedi) ve belgelendirme iddiaları doğrulanamıyor.
              Sahip olunmayan bir belgeyi veya kabul edilmeyen bir ödeme
              yöntemini göstermek tüketiciyi yanıltır. Gerçek belgeler ve ödeme
              sağlayıcısı geldiğinde buraya eklenmeli. */}
          <nav className="order-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 md:order-2">
            <Link href="/kullanim-sartlari" className="hover:text-primary">Kullanım Şartları</Link>
            <Link href="/gizlilik-politikasi" className="hover:text-primary">Gizlilik Politikası</Link>
            <Link href="/iletisim" className="hover:text-primary">İletişim</Link>
          </nav>
        </div>
      </div>
      
       {/* Scroll to Top Button */}
      {isVisible && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 h-12 w-12 rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-900"
          aria-label="Go to top"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}
    </footer>
  );
}