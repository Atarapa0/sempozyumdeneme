"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

// ImportantDate tipini tanımlayalım
type ImportantDate = {
  id: string;
  title: string;
  date: string;
  isCompleted: boolean;
  symposiumId: string;
};

// Sempozyum tipini tanımlayalım
type Sempozyum = {
  id: number;
  title: string;
  aktiflik: boolean;
  tarih: string;
};

export default function PapersPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeSempozyum, setActiveSempozyum] = useState<Sempozyum | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Veriler yükleniyor...");
        
        // Önce aktif sempozyumu alalım
        const sempozyumResponse = await fetch('/api/sempozyum');
        
        if (!sempozyumResponse.ok) {
          throw new Error(`Sempozyum API yanıtı başarısız: ${sempozyumResponse.status}`);
        }
        
        const sempozyumData = await sempozyumResponse.json();
        console.log("Tüm sempozyumlar:", sempozyumData);
        
        // Aktif sempozyumu bulalım
        const aktifSempozyum = sempozyumData.find((s: Sempozyum) => s.aktiflik === true);
        
        if (!aktifSempozyum) {
          console.warn("Aktif sempozyum bulunamadı!");
          setError("Aktif sempozyum bulunamadı");
          setLoading(false);
          return;
        }
        
        console.log("Aktif sempozyum:", aktifSempozyum);
        setActiveSempozyum(aktifSempozyum);
        
        // Şimdi aktif sempozyuma ait önemli tarihleri alalım
        const response = await fetch(`/api/onemli-tarihler?sempozyumId=${aktifSempozyum.id}`);
        
        if (!response.ok) {
          throw new Error(`Önemli tarihler API yanıtı başarısız: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Aktif sempozyuma ait önemli tarihler:", data);
        
        // API'den gelen veriyi frontend formatına dönüştürelim
        const mappedDates = data.map((item: any) => ({
          id: item.id.toString(),
          title: item.baslik,
          date: item.tarih,
          isCompleted: item.durum,
          symposiumId: item.sempozyumId.toString()
        }));
        
        console.log("Dönüştürülmüş önemli tarihler:", mappedDates);
        setImportantDates(mappedDates);
      } catch (error) {
        console.error("Veriler yüklenirken hata oluştu:", error);
        setError("Veriler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Tarih formatını düzenlemek için yardımcı fonksiyon
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Tarih formatlama hatası:", error);
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bildiriler</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4">Bildiri Gönderimi</h2>
        
        <div className="prose max-w-none">
          <p className="mb-4">
            Sempozyumumuza bildiri göndermek için aşağıdaki adımları takip edebilirsiniz:
          </p>
          
          <ol className="list-decimal pl-5 mb-6 space-y-2">
            <li>Hesabınıza giriş yapın veya yeni bir hesap oluşturun.</li>
            <li>Bildiri başlığı, özeti, yazarlar ve anahtar kelimeler gibi gerekli bilgileri doldurun.</li>
            <li>Bildiri tam metnini PDF formatında yükleyin.</li>
            <li>Bildiri gönderim koşullarını kabul edin ve bildiriyi gönderin.</li>
            <li>Bildiri durumunu "Bildirilerim" sayfasından takip edebilirsiniz.</li>
          </ol>
          
          <p className="mb-6">
            Bildiri değerlendirme süreci yaklaşık 2-3 hafta sürmektedir. Kabul edilen bildiriler sempozyum programında yer alacak ve bildiri kitapçığında yayınlanacaktır.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              Önemli Tarihler {activeSempozyum && `- ${activeSempozyum.title}`}
            </h3>
            {error && <p className="text-red-600 mb-2">Hata: {error}</p>}
            {importantDates.length > 0 ? (
              <ul className="list-disc pl-5 text-blue-700">
                {importantDates
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(date => (
                    <li key={date.id} className={date.isCompleted ? "opacity-70" : ""}>
                      <span className="font-medium">{date.title}:</span> {formatDate(date.date)}
                      {date.isCompleted && (
                        <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Tamamlandı
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-blue-700">
                {error 
                  ? "Önemli tarihler yüklenirken bir hata oluştu." 
                  : "Henüz önemli tarih bilgisi bulunmamaktadır."}
              </p>
            )}
          </div>
          
          <div className="flex justify-center">
            <Link
              href="/submit-paper"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Bildiri Gönder
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 