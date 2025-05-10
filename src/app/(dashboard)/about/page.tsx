"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const AboutPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const images = [
    { src: "/assets/slider/amasya_kalesi.jpeg", title: "Amasya Kalesi" },
    { src: "/assets/slider/yalıboyuevleri.jpeg", title: "Yalıboyu Evleri" },
    { src: "/assets/slider/kral_kaya_mezarlıkları.jpeg", title: "Kral Kaya Mezarları" },
    { src: "/assets/slider/şehzadelermüzesi.jpeg", title: "Şehzadeler Müzesi" },
    { src: "/assets/slider/amasaya ünivesites.jpeg", title: "Amasya Üniversitesi" },
    { src: "/assets/slider/yeşilırmak.jpeg", title: "Yeşilırmak" },
  ];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Hakkımızda</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <div className="prose prose-lg max-w-none space-y-6">
            <p>
              MÜBES 2025 (Mühendislik Bilimleri ve Eğitimi Sempozyumu), mühendislik bilimleri ve eğitimi alanında çalışan akademisyenler, araştırmacılar ve profesyoneller için düzenlenen prestijli bir akademik etkinliktir.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Amacımız</h2>
            <p>
              Sempozyumumuzun temel amacı, mühendislik bilimleri ve eğitimi alanındaki en son gelişmeleri, araştırmaları ve yenilikleri paylaşmak için bir platform oluşturmaktır. Bu platform sayesinde:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Akademisyenler ve araştırmacılar arasında bilgi alışverişini teşvik etmek</li>
              <li>Yeni araştırma işbirliklerinin önünü açmak</li>
              <li>Mühendislik eğitiminde yenilikçi yaklaşımları tartışmak</li>
              <li>Endüstri-akademi işbirliğini güçlendirmek</li>
              <li>Genç araştırmacılara deneyimli akademisyenlerle etkileşim fırsatı sunmak</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Kapsam</h2>
            <p>
              MÜBES 2025, aşağıdaki ana başlıklar altında bildiri kabul etmektedir:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Mühendislik Eğitimi ve Metodolojileri</li>
              <li>Yapay Zeka ve Makine Öğrenmesi Uygulamaları</li>
              <li>Sürdürülebilir Mühendislik Çözümleri</li>
              <li>Endüstri 4.0 ve Dijital Dönüşüm</li>
              <li>Yenilenebilir Enerji Teknolojileri</li>
              <li>Akıllı Sistemler ve Robotik</li>
            </ul>
          </div>
        </div>

        {/* Amasya Galerisi */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center">Amasya'dan Kareler</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
      </div>

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
              <ChevronLeftIcon className="w-6 h-6" />
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
              <ChevronRightIcon className="w-6 h-6" />
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
    </div>
  );
};

export default AboutPage;