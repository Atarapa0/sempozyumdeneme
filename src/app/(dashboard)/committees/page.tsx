'use client';
import React, { useState, useEffect } from 'react';
import { getKomiteUyeleri, getKomiteUyeleriBySymposium, sempozyumService, KomiteUyesi, Sempozyum } from '@/lib/services';

// Komite türü tip tanımı
type KomiteTuru = 'bilim' | 'düzenleme' | 'yürütme' | 'danışma' | 'hakem';

// Komite türü başlıkları ve ikonları
const komiteBasliklari: Record<KomiteTuru, { baslik: string, ikon: JSX.Element, aciklama: string }> = {
  'bilim': { 
    baslik: 'Bilim Kurulu', 
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
      </svg>
    ),
    aciklama: 'Bilimsel içerik ve kalite değerlendirmesinden sorumlu uzmanlar'
  },
  'düzenleme': { 
    baslik: 'Düzenleme Kurulu', 
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    aciklama: 'Sempozyumun organizasyon ve düzenlemesinden sorumlu ekip'
  },
  'yürütme': { 
    baslik: 'Yürütme Kurulu', 
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    aciklama: 'Sempozyumun yürütülmesinden sorumlu yönetici ekip'
  },
  'danışma': { 
    baslik: 'Danışma Kurulu', 
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    aciklama: 'Sempozyum stratejisi ve politikaları konusunda danışmanlık yapan uzmanlar'
  },
  'hakem': { 
    baslik: 'Hakem Kurulu', 
    ikon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    aciklama: 'Bildirilerin değerlendirilmesinden sorumlu hakemler'
  }
};

const CommitteesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symposium, setSymposium] = useState<Sempozyum | null>(null);
  const [komiteUyeleri, setKomiteUyeleri] = useState<KomiteUyesi[]>([]);
  const [activeTab, setActiveTab] = useState<KomiteTuru | 'all'>('all');

  // Verileri yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Aktif sempozyumu getir
        const symposiumData = await sempozyumService.getAktifSempozyum();
        setSymposium(symposiumData);
        
        // Eğer aktif sempozyum varsa komite üyelerini getir
        if (symposiumData) {
          // Aktif sempozyuma ait komite üyelerini getir
          const komiteData = await getKomiteUyeleriBySymposium(symposiumData.id);
          setKomiteUyeleri(komiteData);
        }
        
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
        setError("Komite bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Komite türüne göre üyeleri filtrele
  const getKomiteUyeleriByTur = (tur: KomiteTuru) => {
    return komiteUyeleri.filter(uye => uye.komiteTur === tur);
  };

  // Komite türlerinin üye sayılarını hesapla
  const getKomiteTurleriWithUyeSayisi = () => {
    const turler: Record<KomiteTuru, number> = {
      'bilim': 0,
      'düzenleme': 0,
      'yürütme': 0,
      'danışma': 0,
      'hakem': 0
    };
    
    // Her komite türü için üye sayısını hesapla
    komiteUyeleri.forEach(uye => {
      if (uye.komiteTur in turler) {
        turler[uye.komiteTur as KomiteTuru]++;
      }
    });
    
    return turler;
  };

  // Yükleme durumu
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Komite bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-bold">Hata!</p>
            <p>{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  // Aktif sempozyum yoksa
  if (!symposium) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Komiteler</h1>
          
          <div className="bg-red-100 border-l-4 border-red-500 p-6 mb-6 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-red-700 mb-2">
                  Şu an açık sempozyum bulunmamaktadır
                </h2>
                <p className="text-base text-red-700 mb-4">
                  Sempozyum ile ilgili bilgi almak veya sorularınız için lütfen organizasyon komitesi ile iletişime geçiniz.
                </p>
                <div className="flex space-x-4">
                  <a 
                    href="/contact" 
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    İletişime Geç
                  </a>
                  <a 
                    href="/" 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Ana Sayfaya Dön
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Komite üyeleri yoksa
  if (komiteUyeleri.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{symposium.title}</h1>
          <p className="text-gray-600 mb-8">Komiteler</p>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
              <p className="font-bold">Bilgi!</p>
              <p>Henüz komite üyesi eklenmemiştir.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Komite türlerinin üye sayılarını hesapla
  const komiteTurleriWithUyeSayisi = getKomiteTurleriWithUyeSayisi();

  // Tüm komite üyelerini göster
  const allKomiteUyeleri = activeTab === 'all' 
    ? komiteUyeleri 
    : getKomiteUyeleriByTur(activeTab);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{symposium.title}</h1>
          <p className="text-gray-600">Komiteler</p>
        </div>
        
        {/* Komite Türü Seçimi */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8 overflow-x-auto">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tümü
            </button>
            {Object.entries(komiteBasliklari).map(([tur, { baslik, ikon }]) => {
              // Sadece üyesi olan komite türlerini göster
              if (komiteTurleriWithUyeSayisi[tur as KomiteTuru] === 0) {
                return null;
              }
              
              return (
                <button
                  key={tur}
                  onClick={() => setActiveTab(tur as KomiteTuru)}
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 transition-colors ${
                    activeTab === tur 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg">{ikon}</span>
                  <span>{baslik}</span>
                  <span className="ml-1 bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                    {komiteTurleriWithUyeSayisi[tur as KomiteTuru]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Komite Üyeleri */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allKomiteUyeleri.map((uye) => {
            const komiteInfo = komiteBasliklari[uye.komiteTur as KomiteTuru];
            return (
              <div key={uye.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-2xl mr-3">{komiteInfo.ikon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{uye.unvan} {uye.ad} {uye.soyad}</h3>
                      <p className="text-sm text-gray-500">{komiteInfo.baslik}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Kurum:</span> {uye.kurum || 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Komite Açıklamaları */}
        {activeTab !== 'all' && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">{komiteBasliklari[activeTab].ikon}</div>
              <h2 className="text-xl font-semibold text-gray-800">{komiteBasliklari[activeTab].baslik}</h2>
            </div>
            <p className="text-gray-600">{komiteBasliklari[activeTab].aciklama}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommitteesPage; 