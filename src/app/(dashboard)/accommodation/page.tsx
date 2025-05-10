'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AccommodationPage() {
  const router = useRouter();
  
  const accommodations = [
    {
      id: 1,
      name: 'RUBY Otel Amasya',
      type: '3 yıldızlı Otel',
      mapUrl: 'https://maps.app.goo.gl/NpS8e9DCaKRg7jAi6'
    },
    {
      id: 2,
      name: 'AKS Royal Otel',
      type: '3 yıldızlı Otel',
      mapUrl: 'https://maps.app.goo.gl/4FYfx21NTnnw2uYo7'
    },
    {
      id: 3,
      name: 'Üniversite Konukevi',
      type: 'Konukevi',
      mapUrl: 'https://maps.app.goo.gl/vxmH6tqUTG1xG3Dr5'
    },
    {
      id: 4,
      name: 'Amasya Orman Bölge Müdürlüğü',
      type: 'Misafirhane',
      mapUrl: 'https://maps.app.goo.gl/BSRqxYFCcUZxUYJo7'
    },
    {
      id: 5,
      name: 'Amasya Öğretmenevi',
      type: 'Öğretmenevi',
      mapUrl: 'https://maps.app.goo.gl/hRvp9TF9aP9qE2RY7'
    },
    {
      id: 6,
      name: 'Amasya Öğretmenevi',
      type: 'Öğretmenevi',
      mapUrl: 'https://maps.app.goo.gl/qUjPXPc3EDsMG56o9'
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Konaklama</h1>
        
        {/* Konaklama Bilgileri */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mb-8">
          <div className="bg-gray-50 py-4 px-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800">Konaklama Bilgileri</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              MÜBES 2025 Sempozyumu katılımcıları için Amasya'da bulunan çeşitli konaklama yerlerinde özel kontenjanlar ayrılmıştır. 
              Aşağıda listelenen konaklama yerlerinde rezervasyon yaptırırken "MÜBES 2025" kodunu belirtmeniz yeterlidir.
            </p>
            <p className="text-gray-600 mb-4">
              Rezervasyon yapmak için doğrudan konaklama yerleriyle iletişime geçebilir veya sempozyum sekretaryasından yardım alabilirsiniz.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold mb-2 text-gray-800">Önemli Bilgi</h3>
              <p className="text-gray-600">
                Konaklama rezervasyonlarınızı en geç 15 Nisan 2025 tarihine kadar yapmanızı öneririz. 
                Bu tarihten sonra kontenjan garantisi verilememektedir.
              </p>
            </div>
          </div>
        </div>
        
        {/* Konaklama Yerleri */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mb-8">
          <div className="bg-gray-50 py-4 px-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800">Konaklama Yerleri</h2>
          </div>
          <div className="p-6">
            <ul className="divide-y divide-gray-200">
              {accommodations.map(accommodation => (
                <li key={accommodation.id} className="py-3">
                  <a 
                    href={accommodation.mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded-lg transition duration-200"
                  >
                    <span className="text-blue-600 hover:text-blue-800">{accommodation.name}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Ulaşım Bilgileri */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="bg-gray-50 py-4 px-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800">Ulaşım Bilgileri</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Amasya'ya ulaşım ve şehir içi ulaşım hakkında bilgiler:
            </p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-gray-200 pl-4 py-2">
                <h3 className="font-bold text-gray-800 mb-1">Havayolu</h3>
                <p className="text-gray-600">
                  Amasya Merzifon Havalimanı şehir merkezine 45 km uzaklıktadır. 
                  Havalimanından şehir merkezine düzenli servisler bulunmaktadır.
                </p>
              </div>
              
              <div className="border-l-4 border-gray-200 pl-4 py-2">
                <h3 className="font-bold text-gray-800 mb-1">Demiryolu</h3>
                <p className="text-gray-600">
                  Amasya Tren İstasyonu şehir merkezinde yer almaktadır. 
                  Ankara ve İstanbul'dan düzenli tren seferleri mevcuttur.
                </p>
              </div>
              
              <div className="border-l-4 border-gray-200 pl-4 py-2">
                <h3 className="font-bold text-gray-800 mb-1">Karayolu</h3>
                <p className="text-gray-600">
                  Amasya, Ankara'ya 336 km, İstanbul'a 671 km, Samsun'a 131 km uzaklıktadır. 
                  Şehirlerarası otobüs terminali şehir merkezine 3 km mesafededir.
                </p>
              </div>
              
              <div className="border-l-4 border-gray-200 pl-4 py-2">
                <h3 className="font-bold text-gray-800 mb-1">Şehir İçi Ulaşım</h3>
                <p className="text-gray-600">
                  Sempozyum süresince oteller ve üniversite kampüsü arasında ücretsiz servis hizmeti sağlanacaktır. 
                  Servis saatleri sempozyum programına göre düzenlenecektir.
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/contact" className="text-gray-600 hover:text-gray-800 font-medium">
                Daha fazla bilgi için iletişime geçin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 