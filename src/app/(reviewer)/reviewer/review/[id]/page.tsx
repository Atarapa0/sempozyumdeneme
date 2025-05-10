'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { bildiriService, revizeService, sempozyumService } from '@/lib/services';
import { Bildiri } from '@/lib/services/bildiri.service';
import { Revize } from '@/lib/services/revize.service';
import { revizeGecmisiService } from '@/lib/services/revize-gecmisi.service';

// Geçici test verisi (API hatası durumunda kullanılacak)
const DEMO_BILDIRI: Bildiri = {
  id: 1,
  baslik: "Demo Bildiri",
  baslikEn: "Demo Paper",
  ozet: "Bu bir demo bildiri özetidir. API hatası durumunda gösterim için kullanılmaktadır.",
  ozetEn: "This is a demo paper abstract. It's used for display in case of API error.",
  yazarlar: ["Demo Yazar"],
  anahtarKelimeler: ["Demo", "Test", "Geçici"],
  anahtarKelimelerEn: ["Demo", "Test", "Temporary"],
  sunumTipi: "oral",
  anaKonuId: 1,
  bildiriKonusuId: 1,
  kullaniciId: 1,
  durum: "incelemede",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  anaKonu: {
    baslik: "Demo Ana Konu"
  },
  bildiriKonusu: {
    baslik: "Demo Alt Konu"
  }
};

// Bildiri tipi tanımı
type Paper = {
  id: number;
  title: string;
  authors: string;
  abstract: string;
  keywords: string[];
  content: string;
  assignedDate: string;
  dueDate: string;
  status: 'Bekliyor' | 'Değerlendiriliyor' | 'Tamamlandı';
};

// Değerlendirme tipi tanımı
type Review = {
  id: number;
  paperId: number;
  submittedDate: string;
  decision: 'Kabul' | 'Revizyon' | 'Red';
  score: number;
  comments: string;
  strengths: string;
  weaknesses: string;
  confidenceLevel: 'Düşük' | 'Orta' | 'Yüksek';
};

export default function ReviewPaperPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const bildiriId = Number(params.id);

  const [bildiri, setBildiri] = useState<Bildiri | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [useTemporaryData, setUseTemporaryData] = useState(false);

  // Form state
  const [comments, setComments] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [weaknesses, setWeaknesses] = useState<string>('');
  const [durum, setDurum] = useState<'KABUL' | 'RED' | 'REVIZE'>('KABUL');
  const [confidence, setConfidence] = useState<number>(3);
  
  // New state variables for additional form fields
  const [makaleTuru, setMakaleTuru] = useState<string>('');
  const [makaleBasligi, setMakaleBasligi] = useState<string>('');
  const [soyut, setSoyut] = useState<string>('');
  const [anahtarKelimeler, setAnahtarKelimeler] = useState<string>('');
  const [giris, setGiris] = useState<string>('');
  const [gerekcelerVeYontemler, setGerekcelerVeYontemler] = useState<string>('');
  const [sonuclarVeTartismalar, setSonuclarVeTartismalar] = useState<string>('');
  const [referanslar, setReferanslar] = useState<string>('');
  const [guncellikVeOzgunluk, setGuncellikVeOzgunluk] = useState<string>('');

  const [gucluYonler, setGucluYonler] = useState('');
  const [zayifYonler, setZayifYonler] = useState('');
  const [genelYorum, setGenelYorum] = useState('');
  const [guvenSeviyesi, setGuvenSeviyesi] = useState<number>(3);
  const [revizeData, setRevizeData] = useState<Revize | null>(null);

  const [formReadOnly, setFormReadOnly] = useState(false);
  const [hakemDegerlendirmeDurumu, setHakemDegerlendirmeDurumu] = useState<{durum: string|null, yapildi: boolean}>({
    durum: null,
    yapildi: false
  });

  // Hakem olmayan kullanıcıları ana sayfaya yönlendir
  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'reviewer' && user.rolId !== 3))) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Hakem değerlendirme durumu değiştiğinde, eğer yapıldıysa revize bilgilerini getir
  useEffect(() => {
    const fetchRevizeDataForHakem = async () => {
      if (hakemDegerlendirmeDurumu.yapildi && user?.id && bildiriId) {
        try {
          console.log(`[Debug] Hakem (${user.id}) için revize bilgileri getiriliyor...`)
          const hakemId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
          
          // Hakeme ait revize bilgisini getir
          const revizeler = await revizeService.getRevizesByHakemAndBildiriId(bildiriId, hakemId);
          
          if (revizeler && revizeler.length > 0) {
            // En son revizeyi al
            const sonRevize = revizeler[0];
            setRevizeData(sonRevize);
            
            // Form state'lerini güncelle
            setGucluYonler(sonRevize.gucluYonler || '');
            setZayifYonler(sonRevize.zayifYonler || '');
            setGenelYorum(sonRevize.genelYorum || '');
            setGuvenSeviyesi(sonRevize.guvenSeviyesi || 3);
            setDurum(sonRevize.durum as 'KABUL' | 'RED' | 'REVIZE');
            
            // Yeni değerlendirme alanlarını da yükle
            setMakaleTuru(sonRevize.makaleTuru || '');
            setMakaleBasligi(sonRevize.makaleBasligi || '');
            setSoyut(sonRevize.soyut || '');
            setAnahtarKelimeler(sonRevize.anahtarKelimeler || '');
            setGiris(sonRevize.giris || '');
            setGerekcelerVeYontemler(sonRevize.gerekcelerVeYontemler || '');
            setSonuclarVeTartismalar(sonRevize.sonuclarVeTartismalar || '');
            setReferanslar(sonRevize.referanslar || '');
            setGuncellikVeOzgunluk(sonRevize.guncellikVeOzgunluk || '');
            
            console.log('[Debug] Hakem değerlendirme bilgileri yüklendi:', sonRevize);
          } else {
            console.log('[Debug] Hakem için revize kaydı bulunamadı');
          }
        } catch (error) {
          console.error('Hakem revize verileri alınırken hata:', error);
        }
      }
    };
    
    fetchRevizeDataForHakem();
  }, [hakemDegerlendirmeDurumu, user, bildiriId]);

  // Bildiri verilerini yükle
  useEffect(() => {
    const fetchBildiri = async () => {
      if (!bildiriId) {
        setLoadingError('Geçersiz bildiri ID');
        setLoading(false);
        return;
      }
      
      if (isNaN(bildiriId)) {
        setLoadingError('Bildiri ID sayısal bir değer olmalıdır.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setLoadingError(null);
        
        console.log(`Bildiri ID ${bildiriId} için veri isteniyor...`);
        
        const result = await bildiriService.getById(bildiriId);
        setBildiri(result);
        
        // Hakem değerlendirme durumunu kontrol et
        if (user?.id) {
          const hakemId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
          try {
            const degerlendirmeDurumu = await bildiriService.getHakemDegerlendirmeDurumu(bildiriId, hakemId);
            console.log(`[Debug] Hakem değerlendirme durumu:`, degerlendirmeDurumu);
            setHakemDegerlendirmeDurumu(degerlendirmeDurumu);
            
            // Eğer hakem daha önce değerlendirme yapmışsa formu salt okunur hale getir
            if (degerlendirmeDurumu.yapildi) {
              console.log('Hakem daha önce değerlendirme yapmış, form salt okunur olarak ayarlanıyor');
              setFormReadOnly(true);
            }
          } catch (error) {
            console.error('Hakem değerlendirme durumu alınırken hata:', error);
          }
        }
        
        // Eğer bildiri revize edilmiş ise, revize detayları ve önceki değerlendirme bilgilerini al
        if (result.durum === 'revize_yapildi' || 
            result.durum === 'REVIZE_YAPILDI' || 
            result.durum.toLowerCase() === 'revize_yapildi') {
          try {
            // RevizeGecmisi tablosundan hakem için önceki değerlendirmeleri al
            if (user?.id) {
              const revizeGecmisiKayitlari = await revizeGecmisiService.getByBildiriAndHakem(bildiriId, Number(user.id));
              
              if (revizeGecmisiKayitlari && revizeGecmisiKayitlari.length > 0) {
                // En son revizeyi al
                const sonRevizeGecmisi = revizeGecmisiKayitlari[0];
                
                // RevizeGecmisi nesnesini Revize nesnesine dönüştür
                const sonRevize: Revize = {
                  ...sonRevizeGecmisi,
                  durum: sonRevizeGecmisi.durum as 'KABUL' | 'RED' | 'REVIZE',
                  createdAt: sonRevizeGecmisi.createdAt,
                  updatedAt: sonRevizeGecmisi.updatedAt
                };
                
                setRevizeData(sonRevize);
                // Form state'lerini güncelle
                setGucluYonler(sonRevize.gucluYonler || '');
                setZayifYonler(sonRevize.zayifYonler || '');
                setGenelYorum(sonRevize.genelYorum || '');
                setGuvenSeviyesi(sonRevize.guvenSeviyesi || 3);
                
                // Yeni değerlendirme alanlarını da yükle
                setMakaleTuru(sonRevize.makaleTuru || '');
                setMakaleBasligi(sonRevize.makaleBasligi || '');
                setSoyut(sonRevize.soyut || '');
                setAnahtarKelimeler(sonRevize.anahtarKelimeler || '');
                setGiris(sonRevize.giris || '');
                setGerekcelerVeYontemler(sonRevize.gerekcelerVeYontemler || '');
                setSonuclarVeTartismalar(sonRevize.sonuclarVeTartismalar || '');
                setReferanslar(sonRevize.referanslar || '');
                setGuncellikVeOzgunluk(sonRevize.guncellikVeOzgunluk || '');
                
                console.log('Revizyon öncesi veriler yüklendi (RevizeGecmisi):', sonRevize);
              } else {
                console.log('RevizeGecmisi kayıtları bulunamadı, normal revize verilerini deneyelim');
              
                // Eski revize verileri için mevcut revize tablosunu da kontrol et
                const revizeler = await revizeService.getRevizesByBildiriId(bildiriId);
                if (revizeler && revizeler.length > 0) {
                  // En son revizeyi al
                  const sonRevize = revizeler[0];
                  setRevizeData(sonRevize);
                  // Form state'lerini güncelle
                  setGucluYonler(sonRevize.gucluYonler || '');
                  setZayifYonler(sonRevize.zayifYonler || '');
                  setGenelYorum(sonRevize.genelYorum || '');
                  setGuvenSeviyesi(sonRevize.guvenSeviyesi || 3);
                  
                  // Yeni değerlendirme alanlarını da yükle
                  setMakaleTuru(sonRevize.makaleTuru || '');
                  setMakaleBasligi(sonRevize.makaleBasligi || '');
                  setSoyut(sonRevize.soyut || '');
                  setAnahtarKelimeler(sonRevize.anahtarKelimeler || '');
                  setGiris(sonRevize.giris || '');
                  setGerekcelerVeYontemler(sonRevize.gerekcelerVeYontemler || '');
                  setSonuclarVeTartismalar(sonRevize.sonuclarVeTartismalar || '');
                  setReferanslar(sonRevize.referanslar || '');
                  setGuncellikVeOzgunluk(sonRevize.guncellikVeOzgunluk || '');
                  
                  console.log('Revizyon öncesi veriler yüklendi (normal revize tablosu):', sonRevize);
                }
              }
            }
          } catch (revizeError) {
            console.error('Revize verileri alınırken hata:', revizeError);
          }
        }
        // Eğer bildiri kabul edildi veya reddedildi ise, revize verilerini al
        else if (result.durum === 'kabul_edildi' || result.durum === 'reddedildi') {
          try {
            // Bildiri için son revize verilerini al
            const revizeler = await revizeService.getRevizesByBildiriId(bildiriId);
            if (revizeler && revizeler.length > 0) {
              // En son revizeyi al
              const sonRevize = revizeler[0];
              setRevizeData(sonRevize);
              // Form state'lerini güncelle
              setGucluYonler(sonRevize.gucluYonler || '');
              setZayifYonler(sonRevize.zayifYonler || '');
              setGenelYorum(sonRevize.genelYorum || '');
              setGuvenSeviyesi(sonRevize.guvenSeviyesi || 3);
            }
          } catch (revizeError) {
            console.error('Revize verileri alınırken hata:', revizeError);
          }
        }
        
        console.log('Bildiri verileri yüklendi:', result);
      } catch (error: any) {
        console.error('Bildiri yükleme hatası:', error);
        // Daha detaylı hata mesajı
        const errorMessage = error.response?.status === 500 
          ? 'Sunucu tarafında bir hata oluştu. Sistem yöneticinizle iletişime geçin.' 
          : error.response?.status === 404
          ? `Bildiri (ID: ${bildiriId}) bulunamadı.`
          : error.message || 'Bildiri verileri yüklenirken bir hata oluştu.';
          
        setLoadingError(errorMessage);
        
        // Geçici veriyi hazırla (ID'yi güncelle)
        const tempData = {...DEMO_BILDIRI, id: bildiriId};
        console.log('Geçici veri kullanıma hazır:', tempData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBildiri();
  }, [bildiriId]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Hakem olmayan kullanıcılar için içerik gösterme
  if (!user || (user.role !== 'reviewer' && user.rolId !== 3)) {
    return null;
  }

  // Hata durumunda
  if (loadingError) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Hata</h1>
            <p className="text-gray-500 mb-6">{loadingError}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setLoading(true);
                  setLoadingError(null);
                  // Sayfayı yeniden yükle
                  window.location.reload();
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Yeniden Dene
              </button>
              <button
                onClick={() => {
                  // Demo veriyi kullanmayı etkinleştir
                  const tempData = {...DEMO_BILDIRI, id: bildiriId};
                  setBildiri(tempData);
                  setUseTemporaryData(true);
                  setLoadingError(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Demo Verilerle Devam Et
              </button>
              <Link href="/reviewer/dashboard" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Hakem Paneline Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Bildiri bulunamadıysa
  if (!bildiri) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Bildiri Bulunamadı</h1>
            <p className="text-gray-500 mb-6">İstediğiniz bildiri bulunamadı veya erişim izniniz yok.</p>
            <div className="flex justify-center space-x-4">
              <Link href="/reviewer/dashboard" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Hakem Paneline Dön
            </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Eğer form readonly durumda ise submit işlemini engelle
    if (formReadOnly) {
      console.log('Form salt okunur durumda, gönderim engellendi');
      return;
    }
    
    if (!user || !bildiri) return;
    
    // Form validasyonu
    if (!genelYorum.trim()) {
      alert('Lütfen genel bir değerlendirme yazınız.');
      return;
    }
    
    try {
    setIsSubmitting(true);

      // Token kontrolü
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      // Kullanıcı bilgilerini kontrol et
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      const userObj = JSON.parse(userData);
      console.log('Aktif kullanıcı:', userObj);
      
      // Birden çok olası rol formatını kontrol et
      const isReviewer = 
        userObj.role === 'reviewer' || 
        userObj.rolId === 3 || 
        userObj.rol === 'reviewer' || 
        userObj.rol === 3 ||
        (userObj.roller && Array.isArray(userObj.roller) && userObj.roller.includes('reviewer'));
      
      if (!userObj.id || !isReviewer) {
        throw new Error('Bu işlemi sadece hakem rolündeki kullanıcılar yapabilir.');
      }
      
      // Her durumda aktif sempozyum ID'sini al
      console.log('Aktif sempozyum bilgisi alınıyor...');
      const sempozyum = await sempozyumService.getAktifSempozyum();
      console.log('Alınan sempozyum bilgisi:', sempozyum);
      
      // Sempozyum yoksa mevcut bildirinin sempozyum ID'sini kullan
      const sempozyumId = sempozyum ? sempozyum.id : (bildiri.sempozyum?.id || 1);
      console.log('Kullanılacak sempozyumId:', sempozyumId);
      
      // Revize verisini hazırla
      const revizeData: Omit<Revize, 'id' | 'createdAt' | 'updatedAt'> = {
        sempozyumId,
        bildiriId: bildiri.id,
        hakemId: Number(userObj.id),
        durum,
        gucluYonler,
        zayifYonler,
        genelYorum,
        guvenSeviyesi,
        // Yeni değerlendirme alanları
        makaleTuru,
        makaleBasligi,
        soyut,
        anahtarKelimeler,
        giris,
        gerekcelerVeYontemler,
        sonuclarVeTartismalar,
        referanslar,
        guncellikVeOzgunluk
      };
      
      console.log('Gönderilecek revize verileri:', revizeData);
      
      // Gerçek API çağrısı
      await revizeService.createRevize(revizeData);
      
      setShowSuccessMessage(true);

      // 3 saniye sonra başarı mesajını kaldır ve hakem paneline yönlendir
      setTimeout(() => {
        router.push('/reviewer/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Değerlendirme gönderilirken hata:', error);
      // Kullanıcıya daha detaylı hata mesajı göster
      if (error instanceof Error) {
        alert(`Değerlendirme gönderilirken bir hata oluştu: ${error.message}`);
      } else {
        alert('Değerlendirme gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Bildiri Değerlendirme</h1>
            <Link href="/reviewer/dashboard" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Hakem Paneline Dön
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Bildiriyi inceleyip değerlendirmenizi yapabilirsiniz.
          </p>
        </div>

        {/* Başarı Mesajı */}
        {showSuccessMessage && (
          <div className="mb-8 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Değerlendirmeniz başarıyla kaydedildi. Hakem paneline yönlendiriliyorsunuz...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bildiri Detayları */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Bildiri Detayları</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Değerlendireceğiniz bildirinin detayları.</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Başlık</dt>
                <dd className="mt-1 text-lg text-gray-900">{bildiri.baslik}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Yazarlar</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {Array.isArray(bildiri.yazarlar) 
                    ? bildiri.yazarlar.join(', ') 
                    : typeof bildiri.yazarlar === 'string' 
                      ? bildiri.yazarlar 
                      : 'Yazar bilgisi bulunamadı'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ana Konu</dt>
                <dd className="mt-1 text-sm text-gray-900">{bildiri.anaKonu?.baslik || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Alt Konu</dt>
                <dd className="mt-1 text-sm text-gray-900">{bildiri.bildiriKonusu?.baslik || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Sunum Tipi</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {bildiri.sunumTipi === 'oral' ? 'Sözlü Sunum' : 'Poster Sunum'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Durum</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${bildiri.durum === 'beklemede' ? 'bg-yellow-100 text-yellow-800' : 
                      bildiri.durum === 'incelemede' ? 'bg-blue-100 text-blue-800' : 
                      bildiri.durum === 'kabul_edildi' ? 'bg-green-100 text-green-800' : 
                      bildiri.durum === 'revizyon_istendi' ? 'bg-orange-100 text-orange-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {bildiri.durum === 'beklemede' ? 'Beklemede' : 
                     bildiri.durum === 'incelemede' ? 'İncelemede' : 
                     bildiri.durum === 'kabul_edildi' ? 'Kabul Edildi' : 
                     bildiri.durum === 'revizyon_istendi' ? 'Revizyon İstendi' : 
                     bildiri.durum === 'reddedildi' ? 'Reddedildi' : bildiri.durum}
                    </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Gönderim Tarihi</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(bildiri.createdAt).toLocaleDateString('tr-TR')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Anahtar Kelimeler</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(bildiri.anahtarKelimeler) ? 
                      bildiri.anahtarKelimeler.map((keyword, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {keyword}
                        </span>
                      )) : 'Anahtar kelime bulunamadı'}
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Bildiri İçeriği */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Bildiri Dokümanı</h2>
          {!bildiri.dokuman ? (
            <p className="text-gray-500 italic">Bu bildiri için henüz bir doküman yüklenmemiştir.</p>
          ) : (
            <div>
              {showPdfViewer ? (
                <div className="mb-4">
                  <div className="border border-gray-300 rounded-lg overflow-hidden h-[600px]">
                    <iframe 
                      src={bildiri.dokuman}
                      className="w-full h-full border-0"
                      title={`${bildiri.baslik} - PDF Dokümanı`}
                      sandbox="allow-same-origin allow-scripts allow-forms"
                    ></iframe>
                  </div>
                  <button
                    onClick={() => setShowPdfViewer(false)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    PDF Görüntüleyiciyi Kapat
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3 mb-4">
                  <button
                    onClick={() => setShowPdfViewer(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    PDF Görüntüle
                  </button>
                  <a 
                    href={bildiri.dokuman} 
                    target="_blank"
                    rel="noopener noreferrer"
                    download 
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                  >
                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    PDF İndir
                  </a>
                  <a 
                    href={bildiri.dokuman}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    Yeni Sekmede Aç
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Revize Bilgileri - Sadece revize edilmiş bildiriler için göster */}
        {(bildiri.durum === 'revize_yapildi' || 
          bildiri.durum === 'REVIZE_YAPILDI' || 
          bildiri.durum.toLowerCase() === 'revize_yapildi') && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">Revizyon Bilgileri</h2>
            
            {/* Revize edilmiş özet */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Revize Edilmiş Özet</h3>
              <div className="bg-green-50 p-4 rounded-md border border-green-100">
                <p className="text-sm text-gray-800">{bildiri.ozet || "Revize edilmiş özet bilgisi bulunamadı."}</p>
              </div>
            </div>
            
            {/* Revizyon notu */}
            {bildiri.revizeNotu && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Yazarın Revizyon Notu</h3>
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <p className="text-sm text-gray-800">{bildiri.revizeNotu}</p>
                </div>
              </div>
            )}
            
            {/* Önceki değerlendirme bilgileri */}
            {revizeData && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Sizin Önceki Değerlendirmeniz
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                    {revizeData.durum || "Değerlendirme"}
                  </span>
                </h3>
                
                <div className="space-y-3 text-sm">
                  {revizeData.gucluYonler && (
                    <div>
                      <p className="font-medium text-gray-700">Güçlü Yönler:</p>
                      <p className="text-gray-700 bg-white p-2 rounded border border-gray-200">{revizeData.gucluYonler}</p>
                    </div>
                  )}
                  
                  {revizeData.zayifYonler && (
                    <div>
                      <p className="font-medium text-gray-700">Zayıf Yönler:</p>
                      <p className="text-gray-700 bg-white p-2 rounded border border-gray-200">{revizeData.zayifYonler}</p>
                    </div>
                  )}
                  
                  {revizeData.genelYorum && (
                    <div>
                      <p className="font-medium text-gray-700">Genel Değerlendirme:</p>
                      <p className="text-gray-700 bg-white p-2 rounded border border-gray-200">{revizeData.genelYorum}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Değerlendirme Formu veya Değerlendirme Bilgileri */}
        {(bildiri.durum === 'kabul_edildi' || bildiri.durum === 'reddedildi' || bildiri.durum === 'revizyon_istendi') ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Değerlendirme Durumu</h2>
              <div className="mt-2 max-w-2xl text-sm text-gray-500">
                <div className={`inline-flex items-center px-3 py-2 rounded-full ${
                  bildiri.durum === 'kabul_edildi' ? 'bg-green-100 text-green-800' : 
                  bildiri.durum === 'reddedildi' ? 'bg-red-100 text-red-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {bildiri.durum === 'kabul_edildi' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    ) : bildiri.durum === 'reddedildi' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    )}
                  </svg>
                  <span className="font-medium">
                    {bildiri.durum === 'kabul_edildi' 
                      ? 'Bu bildiri için kabul kararı verilmiştir.' 
                      : bildiri.durum === 'reddedildi'
                      ? 'Bu bildiri için red kararı verilmiştir.' 
                      : 'Bu bildiri için revizyon istenmiştir.'}
                    {' '}
                    {bildiri.durum === 'revizyon_istendi' 
                      ? 'Yazar revizyon gönderdiğinde yeniden değerlendirme yapabileceksiniz.' 
                      : 'Değerlendirme artık değiştirilemez.'}
                  </span>
                </div>
              </div>
            </div>
            
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="space-y-6">
                {/* Daha önce yapılmış değerlendirme bilgileri */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Güçlü Yönler</h3>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-800">
                    {gucluYonler || "Belirtilmemiş"}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">Zayıf Yönler</h3>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-800">
                    {zayifYonler || "Belirtilmemiş"}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">Genel Değerlendirme</h3>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-800">
                    {genelYorum || "Belirtilmemiş"}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link 
                    href="/reviewer/dashboard" 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Hakem Paneline Dön
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (bildiri.durum === 'incelemede' || 
             bildiri.durum === 'revize_yapildi' || 
             bildiri.durum === 'REVIZE_YAPILDI' || 
             bildiri.durum.toLowerCase() === 'revize_yapildi') ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Değerlendirme Formu</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {formReadOnly 
                  ? 'Değerlendirmeniz sisteme kaydedilmiştir. Sadece görüntüleme yapabilirsiniz.' 
                  : (bildiri.durum === 'incelemede' 
                    ? 'Lütfen bildiriyi değerlendirin ve geri bildiriminizi paylaşın.' 
                    : 'Yazar revizyonu tamamladı. Lütfen bildiriyi tekrar değerlendirin ve geri bildiriminizi paylaşın.')}
            </p>
            {formReadOnly && (
              <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Bu bildiriyi zaten değerlendirdiniz.</strong> Değerlendirme durumunuz: <span className="font-semibold">{hakemDegerlendirmeDurumu.durum?.toUpperCase() === 'KABUL' ? 'Kabul Edildi' : 
                      hakemDegerlendirmeDurumu.durum?.toUpperCase() === 'RED' ? 'Reddedildi' : 
                      hakemDegerlendirmeDurumu.durum?.toUpperCase() === 'REVIZE' ? 'Revizyon İstendi' : hakemDegerlendirmeDurumu.durum || 'Değerlendirildi'}</span>
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Değerlendirmenizi sadece görüntüleyebilirsiniz, değişiklik yapamazsınız.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Karar */}
                <div>
                    <label htmlFor="durum" className="block text-sm font-medium text-gray-700">
                    Karar
                  </label>
                  <select
                      id="durum"
                      name="durum"
                      value={durum}
                      onChange={(e) => setDurum(e.target.value as 'KABUL' | 'RED' | 'REVIZE')}
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={formReadOnly}
                    >
                      <option value="KABUL">Kabul</option>
                      <option value="REVIZE">Revizyon</option>
                      <option value="RED">Red</option>
                  </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Bildirininin nihai durum kararını seçin.
                    </p>
                </div>

                {/* Makale Türü */}
                <div>
                  <label htmlFor="makaleTuru" className="block text-sm font-medium text-gray-700">
                    Makale Türü
                  </label>
                  <div className="mt-1">
                    <select
                      id="makaleTuru"
                      name="makaleTuru"
                      value={makaleTuru}
                      onChange={(e) => setMakaleTuru(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={formReadOnly}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Orjinal makale">Orjinal makale</option>
                      <option value="İnceleme Makalesi">İnceleme Makalesi</option>
                      <option value="Vaka Raporu">Vaka Raporu</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                </div>

                {/* Makalenin Başlığı */}
                <div>
                  <label htmlFor="makaleBasligi" className="block text-sm font-medium text-gray-700">
                    Makalenin Başlığı
                  </label>
                  <div className="mt-1">
                    <select
                      id="makaleBasligi"
                      name="makaleBasligi"
                      value={makaleBasligi}
                      onChange={(e) => setMakaleBasligi(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={formReadOnly}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Bağlamla uyumlu">Bağlamla uyumlu</option>
                      <option value="Bağlamla Uyumlu Değil">Bağlamla Uyumlu Değil</option>
                    </select>
                  </div>
                </div>

                {/* Soyut */}
                <div>
                  <label htmlFor="soyut" className="block text-sm font-medium text-gray-700">
                    Soyut
                  </label>
                  <div className="mt-1">
                    <select
                      id="soyut"
                      name="soyut"
                      value={soyut}
                      onChange={(e) => setSoyut(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={formReadOnly}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Uyumlu">Uyumlu</option>
                      <option value="Uyumlu değil">Uyumlu değil</option>
                    </select>
                  </div>
                </div>

                {/* Anahtar kelimeler */}
                <div>
                  <label htmlFor="anahtarKelimeler" className="block text-sm font-medium text-gray-700">
                    Anahtar kelimeler
                  </label>
                  <div className="mt-1">
                    <select
                      id="anahtarKelimeler"
                      name="anahtarKelimeler"
                      value={anahtarKelimeler}
                      onChange={(e) => setAnahtarKelimeler(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={formReadOnly}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Yeterli">Yeterli</option>
                      <option value="Yetersiz">Yetersiz</option>
                    </select>
                  </div>
                </div>

                {/* Giriş */}
                <div>
                  <label htmlFor="giris" className="block text-sm font-medium text-gray-700">
                    Giriş
                  </label>
                  <div className="mt-1">
                    <select
                      id="giris"
                      name="giris"
                      value={giris}
                      onChange={(e) => setGiris(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={formReadOnly}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Yeterli">Yeterli</option>
                      <option value="Yetersiz">Yetersiz</option>
                    </select>
                  </div>
                </div>

                {/* Gereç ve Yöntemler */}
                <div>
                  <label htmlFor="gerekcelerVeYontemler" className="block text-sm font-medium text-gray-700">
                    Gereç ve Yöntemler
                  </label>
                  <div className="mt-1">
                    <select
                      id="gerekcelerVeYontemler"
                      name="gerekcelerVeYontemler"
                      value={gerekcelerVeYontemler}
                      onChange={(e) => setGerekcelerVeYontemler(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={formReadOnly}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Yeterli">Yeterli</option>
                      <option value="Yetersiz">Yetersiz</option>
                    </select>
                  </div>
                </div>

                {/* Sonuç ve tartışma */}
                <div>
                  <label htmlFor="sonuclarVeTartismalar" className="block text-sm font-medium text-gray-700">
                    Sonuç ve tartışma
                  </label>
                  <div className="mt-1">
                    <select
                      id="sonuclarVeTartismalar"
                      name="sonuclarVeTartismalar"
                      value={sonuclarVeTartismalar}
                      onChange={(e) => setSonuclarVeTartismalar(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={formReadOnly}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Yeterli">Yeterli</option>
                      <option value="Yetersiz">Yetersiz</option>
                    </select>
                  </div>
                </div>

                {/* Referanslar */}
                <div>
                  <label htmlFor="referanslar" className="block text-sm font-medium text-gray-700">
                    Referanslar
                  </label>
                  <div className="mt-1">
                    <select
                      id="referanslar"
                      name="referanslar"
                      value={referanslar}
                      onChange={(e) => setReferanslar(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={formReadOnly}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Yeterli">Yeterli</option>
                      <option value="Yetersiz">Yetersiz</option>
                    </select>
                  </div>
                </div>

                {/* Araştırma yazısının güncelliği ve özgünlüğü */}
                <div>
                  <label htmlFor="guncellikVeOzgunluk" className="block text-sm font-medium text-gray-700">
                    Araştırma yazısının güncelliği ve özgünlüğü
                  </label>
                  <div className="mt-1">
                    <select
                      id="guncellikVeOzgunluk"
                      name="guncellikVeOzgunluk"
                      value={guncellikVeOzgunluk}
                      onChange={(e) => setGuncellikVeOzgunluk(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      disabled={formReadOnly}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Evet">Evet</option>
                      <option value="Hayır">Hayır</option>
                    </select>
                  </div>
                </div>

                {/* Güçlü Yönler */}
                <div>
                    <label htmlFor="gucluYonler" className="block text-sm font-medium text-gray-700">
                    Güçlü Yönler
                  </label>
                  <div className="mt-1">
                    <textarea
                        id="gucluYonler"
                        name="gucluYonler"
                      rows={3}
                        value={gucluYonler}
                        onChange={(e) => setGucluYonler(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Bildirinin güçlü yönlerini belirtin..."
                      disabled={formReadOnly}
                    />
                  </div>
                </div>

                {/* Zayıf Yönler */}
                <div>
                    <label htmlFor="zayifYonler" className="block text-sm font-medium text-gray-700">
                    Zayıf Yönler
                  </label>
                  <div className="mt-1">
                    <textarea
                        id="zayifYonler"
                        name="zayifYonler"
                      rows={3}
                        value={zayifYonler}
                        onChange={(e) => setZayifYonler(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Bildirinin zayıf yönlerini belirtin..."
                      disabled={formReadOnly}
                    />
                  </div>
                </div>

                {/* Genel Yorumlar */}
                <div>
                    <label htmlFor="genelYorum" className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                    Genel Yorumlar
                  </label>
                  <div className="mt-1">
                    <textarea
                        id="genelYorum"
                        name="genelYorum"
                      rows={5}
                        value={genelYorum}
                        onChange={(e) => setGenelYorum(e.target.value)}
                      className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Bildiri hakkındaki genel yorumlarınızı yazın..."
                        required
                    />
                  </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Yazara iletilecek genel değerlendirme ve önerileriniz.
                    </p>
                </div>

                {/* Güven Seviyesi */}
                <div>
                    <label htmlFor="guvenSeviyesi" className="block text-sm font-medium text-gray-700">
                      Güven Seviyesi (1-5)
                  </label>
                    <div className="mt-1 flex items-center">
                      <input
                        type="range"
                        id="guvenSeviyesi"
                        name="guvenSeviyesi"
                        min="1"
                        max="5"
                        step="1"
                        value={guvenSeviyesi}
                        onChange={(e) => setGuvenSeviyesi(parseInt(e.target.value))}
                        className={`block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${formReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={formReadOnly}
                      />
                      <span className="ml-3 text-gray-700 font-medium">{guvenSeviyesi}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                      <span>Düşük</span>
                      <span>Yüksek</span>
                    </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Değerlendirmenize ne kadar güvendiğinizi belirtin.
                  </p>
                </div>

                {/* Gönder Butonu */}
                <div className="mt-8 flex justify-end">
                  <Link
                    href="/reviewer/assigned-papers"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4"
                  >
                    Geri Dön
                  </Link>

                  {!formReadOnly ? (
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Gönderiliyor...
                        </>
                      ) : (
                        'Değerlendirmeyi Gönder'
                      )}
                    </button>
                  ) : (
                    <Link
                      href="/reviewer/dashboard"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Hakem Paneline Dön
                    </Link>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h2 className="text-lg font-medium text-gray-900">Değerlendirme için Uygun Değil</h2>
            <p className="mt-2 text-sm text-gray-600">
              Bu bildiri şu anda değerlendirilemez. Bildirinin durumu: {bildiri.durum}
            </p>
            <div className="mt-4">
              <Link 
                href="/reviewer/dashboard" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hakem Paneline Dön
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 