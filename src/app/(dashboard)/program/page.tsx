'use client';

import React, { useState, useEffect } from 'react';
import { FaClock, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { ProgramItem } from '@/lib/database';
import { getProgramEtkinlikleri } from '@/lib/services';
import { sempozyumService, Sempozyum } from '@/lib/services/sempozyum.service';

// Yardımcı fonksiyonlar
const formatDay = (day: string) => {
  return day === '1' ? '1. Gün' : day === '2' ? '2. Gün' : day === '3' ? '3. Gün' : `${day}. Gün`;
};

const formatType = (type: string) => {
  switch (type) {
    case 'opening': return 'Açılış';
    case 'closing': return 'Kapanış';
    case 'keynote': return 'Davetli Konuşmacı';
    case 'session': return 'Oturum';
    case 'break': return 'Ara';
    case 'social': return 'Sosyal Etkinlik';
    default: return type;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'opening': return 'border-green-500';
    case 'closing': return 'border-red-500';
    case 'keynote': return 'border-purple-500';
    case 'session': return 'border-blue-500';
    case 'break': return 'border-yellow-500';
    case 'social': return 'border-pink-500';
    default: return 'border-gray-500';
  }
};

export default function ProgramPage() {
  const [programData, setProgramData] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [uniqueDays, setUniqueDays] = useState<string[]>([]);
  const [aktifSempozyum, setAktifSempozyum] = useState<Sempozyum | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Program verilerini yükle
    const loadProgramData = async () => {
      try {
        setLoading(true);
        
        // Önce aktif sempozyumu kontrol et
        const sempozyum = await sempozyumService.getAktifSempozyum();
        setAktifSempozyum(sempozyum);
        
        if (sempozyum) {
          // Veritabanından program verilerini çek (aktif sempozyum ID'si ile)
          const data = await getProgramEtkinlikleri(sempozyum.id);
          setProgramData(data);
          
          // Benzersiz günleri bul
          const daysSet = new Set<string>();
          data.forEach(item => daysSet.add(item.day));
          const days = Array.from(daysSet).sort();
          setUniqueDays(days);
          
          // Varsayılan olarak ilk günü seç
          if (days.length > 0 && !selectedDay) {
            setSelectedDay(days[0]);
          }
        } else {
          // Aktif sempozyum yoksa hata mesajı göster
          setError('Aktif sempozyum bulunamadı. Lütfen daha sonra tekrar deneyin.');
          setProgramData([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Program verileri yüklenirken hata oluştu:", error);
        setError('Program verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        setLoading(false);
      }
    };
    
    loadProgramData();
  }, [selectedDay]);
  
  // Seçilen güne göre program verilerini filtrele
  const filteredProgram = selectedDay 
    ? programData.filter(item => item.day === selectedDay)
    : programData;
  
  // Program verilerini saate göre sırala
  const sortedProgram = [...filteredProgram].sort((a, b) => {
    // Önce güne göre sırala
    if (a.day !== b.day) {
      return a.day.localeCompare(b.day);
    }
    // Sonra başlangıç saatine göre sırala
    return a.startTime.localeCompare(b.startTime);
  });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Aktif sempozyum yoksa veya hata oluştuysa uyarı mesajı göster
  if (error || !aktifSempozyum) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Sempozyum Programı</h1>
        
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
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Sempozyum Programı</h1>
      <h2 className="text-xl text-gray-600 mb-6">{aktifSempozyum.title}</h2>
      
      {programData.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">Henüz program bilgisi bulunmamaktadır.</p>
          <p className="text-gray-500">Program bilgileri yakında eklenecektir.</p>
        </div>
      ) : (
        <>
          {/* Gün seçimi */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDay(null)}
                className={`px-4 py-2 rounded-md ${
                  selectedDay === null 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Tüm Program
              </button>
              
              {uniqueDays.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-md ${
                    selectedDay === day 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {formatDay(day)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Program içeriği */}
          <div className="space-y-8">
            {selectedDay === null ? (
              // Tüm günleri göster
              uniqueDays.map(day => (
                <div key={day} className="mb-10">
                  <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-300">
                    {formatDay(day)}
                  </h2>
                  
                  <div className="space-y-4">
                    {sortedProgram
                      .filter(item => item.day === day)
                      .map(item => (
                        <div 
                          key={item.id} 
                          className={`p-4 rounded-lg border-l-4 ${getTypeColor(item.type)} shadow-sm`}
                        >
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
                            <h3 className="text-xl font-semibold">{item.title}</h3>
                            <span className="text-sm font-medium px-2 py-1 rounded-full bg-opacity-50 inline-flex items-center">
                              {formatType(item.type)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            <div className="flex items-center text-gray-600">
                              <i className="mr-2 text-base">⏰</i>
                              <span>{item.startTime} - {item.endTime}</span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <i className="mr-2 text-base">📍</i>
                              <span>{item.location}</span>
                            </div>
                            
                            {item.speaker && (
                              <div className="flex items-center text-gray-600">
                                <i className="mr-2 text-base">👤</i>
                                <span>{item.speaker}</span>
                              </div>
                            )}
                          </div>
                          
                          {item.description && (
                            <p className="mt-2 text-gray-700">{item.description}</p>
                          )}
                          
                          {item.sessionChair && (
                            <p className="mt-2 text-gray-700">
                              <span className="font-medium">Oturum Başkanı:</span> {item.sessionChair}
                            </p>
                          )}
                          
                          {item.papers && item.papers.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-medium text-gray-800 mb-2">Bildiriler:</h4>
                              <div className="space-y-2 pl-4">
                                {item.papers.map(paper => (
                                  <div key={paper.id} className="border-l-2 border-gray-300 pl-3 py-1">
                                    <div className="flex justify-between">
                                      <h5 className="font-medium">{paper.title}</h5>
                                      <span className="text-sm text-gray-600">{paper.time}</span>
                                    </div>
                                    {paper.authors.length > 0 && (
                                      <p className="text-sm text-gray-600">
                                        {paper.authors.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))
            ) : (
              // Seçilen günü göster
              <div className="space-y-4">
                {sortedProgram.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-lg border-l-4 ${getTypeColor(item.type)} shadow-sm`}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <span className="text-sm font-medium px-2 py-1 rounded-full bg-opacity-50 inline-flex items-center">
                        {formatType(item.type)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div className="flex items-center text-gray-600">
                        <i className="mr-2 text-base">⏰</i>
                        <span>{item.startTime} - {item.endTime}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <i className="mr-2 text-base">📍</i>
                        <span>{item.location}</span>
                      </div>
                      
                      {item.speaker && (
                        <div className="flex items-center text-gray-600">
                          <i className="mr-2 text-base">👤</i>
                          <span>{item.speaker}</span>
                        </div>
                      )}
                    </div>
                    
                    {item.description && (
                      <p className="mt-2 text-gray-700">{item.description}</p>
                    )}
                    
                    {item.sessionChair && (
                      <p className="mt-2 text-gray-700">
                        <span className="font-medium">Oturum Başkanı:</span> {item.sessionChair}
                      </p>
                    )}
                    
                    {item.papers && item.papers.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-800 mb-2">Bildiriler:</h4>
                        <div className="space-y-2 pl-4">
                          {item.papers.map(paper => (
                            <div key={paper.id} className="border-l-2 border-gray-300 pl-3 py-1">
                              <div className="flex justify-between">
                                <h5 className="font-medium">{paper.title}</h5>
                                <span className="text-sm text-gray-600">{paper.time}</span>
                              </div>
                              {paper.authors.length > 0 && (
                                <p className="text-sm text-gray-600">
                                  {paper.authors.join(', ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
         
          
        </>
      )}
    </div>
  );
}