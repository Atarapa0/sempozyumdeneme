'use client';

import React from 'react';
import Link from 'next/link';
import { useSymposium } from '@/lib/hooks/useSymposium';

const Footer = () => {
  const { symposium, loading } = useSymposium();

  if (loading || !symposium) {
    return null; // veya loading spinner
  }

  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold text-black mb-4">Site İsmi</h3>
          </div>
          <div>
            <h3 className="text-lg font-bold text-black mb-4">Menüler</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-black hover:text-blue-700 transition duration-200">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-black hover:text-blue-700 transition duration-200">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/papers" className="text-black hover:text-blue-700 transition duration-200">
                  Bildiriler
                </Link>
              </li>
              <li>
                <Link href="/program" className="text-black hover:text-blue-700 transition duration-200">
                  Program
                </Link>
              </li>
              <li>
                <Link href="/etik-kurallar" className="text-black hover:text-blue-700 transition duration-200">
                  Etik Kurallar
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <Link href="/contact">
              <h3 className="text-lg font-bold text-black mb-4 hover:text-blue-700 transition duration-200">İletişim</h3>
            </Link>
            <p className="text-black mb-2">{symposium.organizer}</p>
            <p className="text-black mb-2">{symposium.venue}</p>
            <p className="text-black">E-posta: info@mubes2025.org</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-black mb-4">Sosyal Medya</h3>
            <div className="flex flex-col space-y-2">
              <a href="#" className="text-black hover:text-blue-700 transition duration-200 font-medium">
                Twitter
              </a>
              <a href="#" className="text-black hover:text-blue-700 transition duration-200 font-medium">
                Facebook
              </a>
              <a href="#" className="text-black hover:text-blue-700 transition duration-200 font-medium">
                Instagram
              </a>
              <a href="#" className="text-black hover:text-blue-700 transition duration-200 font-medium">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-black">
            © {new Date().getFullYear()} {symposium.title}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;