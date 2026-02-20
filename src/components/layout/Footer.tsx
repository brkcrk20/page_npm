'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
const PaymentBadge = ({ text, width = 80, height = 30 }: { text: string, width?: number, height?: number }) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
    <rect width={width} height={height} rx="4" fill="currentColor" fillOpacity="0.1" />
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold">
      {text}
    </text>
  </svg>
);


export function Footer() {
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
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <PawPrint className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold font-headline">petsemti</span>
            </Link>
            <p className="text-sm text-gray-600">
              Evcil Hayvan Sahiplendirme platformu petsemti, yavru evcil hayvan cinsleri ve diğer tüm sahiplendirme ilanları ile yayında!
            </p>
          </div>

          {/* Column 2: Dog Breeds */}
          <div>
            <h3 className={footerTitleStyle}>Köpek İlanları</h3>
            <ul className="space-y-2">
              <li><Link href="#" className={footerLinkStyle}>Pomeranian Boo</Link></li>
              <li><Link href="#" className={footerLinkStyle}>Maltipoo</Link></li>
              <li><Link href="#" className={footerLinkStyle}>Maltese Terrier</Link></li>
              <li><Link href="#" className={footerLinkStyle}>Golden Retriever</Link></li>
              <li><Link href="#" className={footerLinkStyle}>Toy Poodle</Link></li>
            </ul>
          </div>

          {/* Column 3: Cat Breeds */}
          <div>
            <h3 className={footerTitleStyle}>Kedi İlanları</h3>
            <ul className="space-y-2">
              <li><Link href="#" className={footerLinkStyle}>British Shorthair</Link></li>
              <li><Link href="#" className={footerLinkStyle}>Scottish Fold</Link></li>
              <li><Link href="#" className={footerLinkStyle}>İran Kedisi</Link></li>
              <li><Link href="#" className={footerLinkStyle}>Siyam Kedisi</Link></li>
              <li><Link href="#" className={footerLinkStyle}>Bengal Kedisi</Link></li>
            </ul>
          </div>

          {/* Column 4: Corporate */}
          <div>
            <h3 className={footerTitleStyle}>Kurumsal</h3>
            <ul className="space-y-2">
              <li><Link href="#" className={footerLinkStyle}>Gizlilik Sözleşmesi</Link></li>
              <li><Link href="#" className={footerLinkStyle}>Kullanım Şartları</Link></li>
            </ul>
          </div>

          {/* Column 5: General */}
          <div>
            <h3 className={footerTitleStyle}>Genel Bilgiler</h3>
            <ul className="space-y-2">
              <li><Link href="#" className={footerLinkStyle}>Hakkımızda</Link></li>
              <li><Link href="#" className={footerLinkStyle}>İletişim</Link></li>
            </ul>
          </div>
        </div>

        {/* Middle Section: Contact Info & Social */}
        <div className="border-t mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6 text-sm text-gray-700">
                <h3 className="font-bold text-base hidden md:block">BİZE ULAŞIN</h3>
                <Link href="tel:05555555555" className="flex items-center gap-2 hover:text-primary"><Phone className="w-4 h-4"/> 0555 555 55 55</Link>
                <Link href="mailto:info@petsemti.com" className="flex items-center gap-2 hover:text-primary"><Mail className="w-4 h-4"/> info@petsemti.com</Link>
                <Link href="https://wa.me/905555555555" target="_blank" className="flex items-center gap-2 hover:text-primary"><MessageCircle className="w-4 h-4"/> Whatsapp: 0555 555 55 55</Link>
            </div>
            <div className="flex space-x-2">
                <Link href="#" className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-80"><Facebook className="w-5 h-5"/></Link>
                <Link href="#" className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center hover:opacity-80"><Twitter className="w-5 h-5"/></Link>
                <Link href="#" className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center hover:opacity-80"><Instagram className="w-5 h-5"/></Link>
                <Link href="#" className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:opacity-80"><Youtube className="w-5 h-5"/></Link>
                <Link href="#" className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center hover:opacity-80"><Linkedin className="w-5 h-5"/></Link>
            </div>
        </div>

        {/* Bottom Section: Copyright & Badges */}
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 order-2 md:order-1">
            &copy; {new Date().getFullYear()} petsemti. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-3 order-1 md:order-2">
            <PaymentBadge text="ISO" width={40} />
            <PaymentBadge text="TÜRKPATENT" />
            <PaymentBadge text="iyzico" />
            <PaymentBadge text="Mastercard" />
            <PaymentBadge text="VISA" />
            <PaymentBadge text="AMEX" />
            <PaymentBadge text="troy" />
          </div>
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