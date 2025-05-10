"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// import { FaCalendarAlt, FaMapMarkerAlt, FaUniversity, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { 
  getAktifAnaKonular,
  getAktifSponsorlar,
  getAktifGenelBilgiler,
  getAktifOnemliTarihler,
  getProgramEtkinlikleri
} from '@/lib/services';
import Countdown from '@/components/Countdown';

// Veritabanından değil API'den veri alacağız, ancak tip tanımlamaları için interface'leri kullanacağız
type SymposiumInfo = {
  id: string;
  title: string;
  subtitle: string;
  dates: string;
  countdownDate: string;
  description: string;
  longDescription: string;
  venue: string;
  organizer: string;
  year: number;
  isActive: boolean;
  docentlikInfo: string;
  createdAt: string;
  updatedAt: string;
  genelBilgilerId?: number;
};

type ImportantDate = {
  id: string;
  title: string;
  date: string;
  isCompleted: boolean;
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
  onemliTarihId?: number;
};

type MainTopic = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
  anaKonuId?: number;
};

type Sponsor = {
  id: string;
  name: string;
  logo: string;
  website: string;
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
  sponsorId?: number;
};

// Konuşmacı tipi
type Speaker = {
  name: string;
  day: string;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [symposium, setSymposium] = useState<SymposiumInfo | null>(null);
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [topics, setTopics] = useState<MainTopic[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const images = [
    { src: "/assets/slider/amasya_kalesii.jpeg", title: "Amasya Kalesi" },
    { src: "/assets/slider/yalıboyuevleri.jpeg", title: "Yalıboyu Evleri" },
    { src: "/assets/slider/kral_kaya_mezarlıkları.jpeg", title: "Kral Kaya Mezarları" },
    { src: "/assets/slider/şehzadelermüzesi.jpeg", title: "Şehzadeler Müzesi" },
    { src: "/assets/slider/amasaya ünivesites.jpeg", title: "Amasya Üniversitesi" },
    { src: "/assets/slider/alçakkopruveyesilırmak.jpeg", title: "Yeşilırmak" },
    { src: "/assets/slider/ferhat ile şirin.jpeg", title: "Ferhat ile Şirin" },
    { src: "/assets/slider/amasaya.jpeg", title: "Amasya" },
  ];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Slider için yön fonksiyonları
  const handlePrevSlide = () => {
    setCurrentSlideIndex(prev => 
      prev > 0 ? prev - 1 : Math.max(Math.ceil(speakers.length / getVisibleCount()) - 1, 0)
    );
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => 
      prev < Math.ceil(speakers.length / getVisibleCount()) - 1 ? prev + 1 : 0
    );
  };
  
  // Ekran boyutuna göre görünecek konuşmacı sayısını belirle
  const getVisibleCount = () => {
    // Tarayıcı ortamındaysa window genişliğini kontrol et
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 1; // Mobil için 1
      if (window.innerWidth < 1024) return 2; // Tablet için 2
      return 4; // PC için 4
    }
    return 4; // Varsayılan olarak 4
  };

  // Otomatik slider için
  useEffect(() => {
    if (speakers.length > getVisibleCount()) {
      const timer = setInterval(() => {
        handleNextSlide();
      }, 5000); // 5 saniyede bir değiştir
      
      return () => clearInterval(timer);
    }
  }, [speakers, currentSlideIndex]);
  
  // Pencere boyutu değişikliklerini izle
  useEffect(() => {
    const handleResize = () => {
      // Pencere boyutu değiştiğinde currentSlideIndex'i sıfırla veya yeniden hesapla
      const newMaxSlide = Math.ceil(speakers.length / getVisibleCount()) - 1;
      if (currentSlideIndex > newMaxSlide) {
        setCurrentSlideIndex(Math.max(newMaxSlide, 0));
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [speakers.length, currentSlideIndex]);

  // Kritik verileri yükle (sempozyum bilgileri ve önemli tarihler)
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setError(null);
        setLoading(true);

        // Tüm API çağrılarını paralel olarak yap
        const [
          symposiumData,
          importantDates,
          mainTopicsData,
          sponsorsData,
          programData
        ] = await Promise.all([
          getAktifGenelBilgiler(),
          getAktifOnemliTarihler(),
          getAktifAnaKonular(),
          getAktifSponsorlar(),
          getProgramEtkinlikleri()
        ]);

        if (!symposiumData) {
          throw new Error('Sempozyum verisi alınamadı');
        }

        // Konuşmacıları ve günlerini çıkartma
        const formattedSpeakers = programData
          .filter(item => item.speaker && item.speaker.trim() !== '')
          .map(item => ({
            name: item.speaker as string,
            day: item.day.includes('-') 
              ? `${parseInt(item.day.split('-')[2])}. Gün` 
              : `${item.day}. Gün`
          }));

        // Tekrarlayan konuşmacıları temizle
        const uniqueSpeakers = formattedSpeakers.filter((speaker, index, self) =>
          index === self.findIndex(s => s.name === speaker.name)
        );

        // Tüm state'leri güncelle
        setSymposium(symposiumData);
        setDates(importantDates);
        setTopics(mainTopicsData);
        setSponsors(sponsorsData);
        setSpeakers(uniqueSpeakers);
        setInitialLoading(false);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        setError('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Loading durumunda gösterilecek içerik
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Sempozyum bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Hata durumunda gösterilecek içerik
  if (error || !symposium) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Bir Hata Oluştu</h3>
          <p className="text-gray-600 mb-4">{error || 'Sempozyum bilgileri yüklenemedi.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-r from-blue-900 to-blue-700">
        {/* Arka plan resmi */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{ 
            backgroundImage: 'url("/assets/slider/anasayfa-slider.jpeg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Sol taraf - Mevcut içerik */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{symposium?.title}</h1>
              <p className="text-xl md:text-2xl mb-8 text-white">{symposium?.subtitle}</p>
              
              <div className="flex flex-col md:flex-row justify-center lg:justify-start items-center gap-4 mb-8">
                <div className="flex items-center text-white">
                  <span className="mr-2">📅</span>
                  <span>{symposium?.dates}</span>
                </div>
                <div className="hidden md:block text-white">•</div>
                <div className="flex items-center text-white">
                  <span className="mr-2">📍</span>
                  <span>{symposium?.venue}</span>
                </div>
                <div className="hidden md:block text-white">•</div>
                <div className="flex items-center text-white">
                  <span className="mr-2">🏛️</span>
                  <span>{symposium?.organizer}</span>
                </div>
              </div>
              
              <div className="mb-8">
                <Countdown targetDate={new Date(symposium?.countdownDate || '')} />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link href="/papers" className="bg-white text-blue-700 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition duration-300">
                  Bildiri Gönder
                </Link>
                <Link href="/register" className="bg-transparent hover:bg-white hover:text-blue-700 text-white border border-white font-bold py-3 px-6 rounded-lg transition duration-300">
                  Kayıt Ol
                </Link>
              </div>
            </div>

            {/* Sağ taraf - Resim */}
            <div className="hidden lg:block relative h-[500px]">
              <Image
                src="/assets/slider/anasayfa-slider.jpeg"
                alt="Sempozyum Görseli"
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-lg shadow-xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Konuşmacılar Bölümü */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Konuşmacılar</h2>
          
          {speakers.length > 0 ? (
            <div className="relative px-10">
              {/* Slider Navigation Butonları */}
              {speakers.length > getVisibleCount() && (
                <>
                  <button 
                    onClick={handlePrevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-lg shadow-md p-2 hover:bg-gray-100 transition-colors"
                    aria-label="Önceki konuşmacılar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={handleNextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-lg shadow-md p-2 hover:bg-gray-100 transition-colors"
                    aria-label="Sonraki konuşmacılar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* Konuşmacılar Slider */}
              <div className="overflow-hidden">
                <div 
                  className="transition-transform duration-500 ease-in-out flex"
                  style={{ 
                    transform: `translateX(-${currentSlideIndex * 100}%)`,
                  }}
                >
                  {Array(Math.max(Math.ceil(speakers.length / getVisibleCount()), 1)).fill(0).map((_, slideIndex) => {
                    const visibleCount = getVisibleCount();
                    return (
                      <div key={slideIndex} className="flex-shrink-0 w-full flex gap-4">
                        {speakers.slice(slideIndex * visibleCount, slideIndex * visibleCount + visibleCount).map((speaker, index) => (
                          <div 
                            key={index} 
                            className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1 ${
                              visibleCount === 1 ? 'w-full' : 
                              visibleCount === 2 ? 'w-1/2' : 
                              'w-1/4'
                            }`}
                          >
                            <div className="p-4 text-center">
                              <h3 className="text-lg font-semibold mb-1">{speaker.name}</h3>
                              <p className="text-blue-600 text-sm">{speaker.day}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Slider Göstergesi (Dots) */}
              {speakers.length > getVisibleCount() && (
                <div className="flex justify-center mt-6 space-x-2">
                  {Array(Math.ceil(speakers.length / getVisibleCount())).fill(0).map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 w-6 rounded-sm ${
                        index === currentSlideIndex ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      onClick={() => setCurrentSlideIndex(index)}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500">Konuşmacı bilgisi henüz eklenmemiştir.</p>
          )}
        </div>
      </section>
      
      {/* Sempozyum Hakkında */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Sempozyum Hakkında</h2>
            
            <div className="prose max-w-none">
              <p className="text-lg mb-6">{symposium?.description}</p>
              <p className="text-lg mb-6">{symposium?.longDescription}</p>
              
              <div className="mt-8 text-center">
                <Link href="/about" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300">
                  Daha Fazla Bilgi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Ana Konular */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Ana Konular</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topics.map((topic) => (
              <div key={topic.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-300">
                {topic.icon && (
                  <div className="text-blue-600 text-4xl mb-4">
                    <i className={`fas fa-${topic.icon}`}></i>
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-3">{topic.title}</h3>
                <p className="text-gray-600">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Önemli Tarihler */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Önemli Tarihler</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-blue-200"></div>
              
              {/* Timeline items */}
              <div className="space-y-12">
                {dates
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((date, index) => (
                    <div key={date.id} className={`relative flex flex-col md:flex-row ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                      <div className="md:w-1/2"></div>
                      <div className="absolute left-0 md:left-1/2 transform -translate-y-1/2 md:-translate-x-1/2 w-8 h-8 rounded-full bg-blue-600 border-4 border-white z-10"></div>
                      <div className="relative md:w-1/2 ml-10 md:ml-0 md:px-8 py-4">
                        <div className={`bg-blue-50 p-4 rounded-lg shadow-sm ${date.isCompleted ? 'opacity-60' : ''}`}>
                          <h3 className="text-lg font-semibold mb-1">{date.title}</h3>
                          <p className="text-blue-600 font-medium">
                            {new Date(date.date).toLocaleDateString('tr-TR', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                          {date.isCompleted && (
                            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              Tamamlandı
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Amasya Galerisi */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Amasya'dan Kareler</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div 
                key={index} 
                className="relative h-64 group overflow-hidden rounded-lg cursor-pointer"
                onClick={() => {
                  setSelectedImageIndex(index);
                  setSelectedImage(image.src);
                }}
              >
                <Image
                  src={image.src}
                  alt={image.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transform transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <p className="text-white text-center font-semibold">{image.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl w-full max-h-[90vh] flex items-center justify-center">
            {/* Önceki Resim Butonu */}
            <button 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 z-20"
              onClick={handlePrevImage}
            >
              &lt;
            </button>

            {/* Kapatma Butonu */}
            <button 
              className="absolute top-4 right-4 text-white text-xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 z-20"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              ×
            </button>

            {/* Sonraki Resim Butonu */}
            <button 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 z-20"
              onClick={handleNextImage}
            >
              &gt;
            </button>

            {/* Resim */}
            <div className="relative w-full h-[80vh]">
              <Image
                src={images[selectedImageIndex].src}
                alt={images[selectedImageIndex].title}
                fill
                style={{ objectFit: 'contain' }}
                className="rounded-lg"
                priority
              />
            </div>

            {/* Resim Başlığı */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xl font-semibold bg-black bg-opacity-50 px-6 py-2 rounded-full">
              {images[selectedImageIndex].title}
            </div>
          </div>
        </div>
      )}
      
      {/* Sponsorlar */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Sponsorlar</h2>
          
          <div className="flex flex-wrap justify-center items-center gap-8">
            {sponsors.map((sponsor) => (
              <a 
                key={sponsor.id} 
                href={sponsor.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 grayscale hover:grayscale-0 transition duration-300"
              >
                <div className="relative h-16 w-40">
                  <Image 
                    src={sponsor.logo} 
                    alt={sponsor.name} 
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
      
      {/* Doçentlik Bilgisi */}
      <section className="py-12 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Doçentlik Bilgisi</h2>
            <p className="text-gray-700">{symposium?.docentlikInfo}</p>
            
            <div className="mt-4">
              <Link href="/papers" className="text-blue-600 hover:text-blue-800 font-medium">
                Bildiri Gönder →
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Soruların var mı? Bölümü */}
      <section 
        className="relative py-16 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("/assets/slider/anasayfa-slider.jpeg")',
        }}
      >
        {/* Karanlık overlay ekleyelim ki yazılar daha iyi görünsün */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">
              Soruların var mı?
            </h2>
            <p className="text-lg mb-8 text-white">
              Sempozyum hakkında merak ettiğin her şeyi bize sorabilirsin. 
              Size yardımcı olmaktan mutluluk duyarız.
            </p>
            <Link 
              href="/contact" 
              className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              İletişime Geç
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
