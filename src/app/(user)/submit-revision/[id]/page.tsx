'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { bildiriService, getAktifAnaKonular, getBildiriKonulari, sempozyumService } from '@/lib/services';
import { apiClient } from '@/lib/services/api.client';
import { toast } from 'react-hot-toast';
import { isDuzeltmeStatus } from '@/lib/utils/status-helpers';
import { ArrowLeftIcon, PaperAirplaneIcon, DocumentIcon, InformationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { revizeService } from '@/lib/services/revize.service';

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface RevizeDetay {
  gucluYonler?: string;
  zayifYonler?: string;
  genelYorum?: string;
  hakemId?: number;
  durum?: string;
  createdAt?: string;
  makaleTuru?: string;
  makaleBasligi?: string;
  soyut?: string;
  anahtarKelimeler?: string;
  giris?: string;
  gerekcelerVeYontemler?: string;
  sonuclarVeTartismalar?: string;
  referanslar?: string;
  guncellikVeOzgunluk?: string;
}

export default function SubmitRevisionPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const bildiriId = Number(params.id);
  
  const [loading, setLoading] = useState(true);
  const [originalPaper, setOriginalPaper] = useState<any>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [activeSempozyum, setActiveSempozyum] = useState<any>(null);
  
  // Revizyon detayları
  const [revizeDetay, setRevizeDetay] = useState<RevizeDetay | null>(null);
  const [revizeLoading, setRevizeLoading] = useState(false);
  
  // Birden fazla hakemin revize değerlendirmelerini tutacak dizi
  const [revizeIsteyenHakemler, setRevizeIsteyenHakemler] = useState<RevizeDetay[]>([]);
  
  // Form state
  const [revisionNote, setRevisionNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Başlangıçta kullanıcıya bir uyarı mesajı gösterecek değişken ekleyelim
  const [revizeDurumUyari, setRevizeDurumUyari] = useState<string | null>(null);

  useEffect(() => {
    // Token kontrolü - her sayfa yüklendiğinde token'ı kontrol et
    const checkToken = () => {
      const token = localStorage.getItem('token');
      console.log('Token kontrolü:', token ? 'Token mevcut' : 'Token bulunamadı');
      
      if (!token) {
        setError('Oturum bilgisi bulunamadı. Lütfen giriş yapın veya sayfayı yenileyin.');
        return false;
      }
      return true;
    };

    if (!checkToken()) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Aktif sempozyumu getir
        const activeSempozyum = await sempozyumService.getAktifSempozyum();
        setActiveSempozyum(activeSempozyum);
        
        if (!activeSempozyum) {
          setError('Şu anda aktif bir sempozyum bulunmamaktadır. Revizyon gönderimi için aktif bir sempozyum olması gerekmektedir.');
          setLoading(false);
          return;
        }

        // Orijinal bildiriyi getir
        const paper = await bildiriService.getById(bildiriId);
        
        if (!paper) {
          setError('Bildiri bulunamadı.');
          setLoading(false);
          return;
        }
        
        // Durum kontrolünü gelişmiş fonksiyonla yapacağız
        console.log("Bildiri durumu:", paper.durum);
        console.log("Bildiri durumunun türü:", typeof paper.durum);
        console.log("Bildiri detayları:", paper);

        // Revizyon durumunu kontrol et
        if (paper.durum === "REVIZE_YAPILDI") {
          setRevizeDurumUyari("Bu bildiri için revizyon zaten gönderilmiştir. Hakem değerlendirmesi beklenmektedir.");
        }
        
        if (!isDuzeltmeStatus(paper.durum)) {
          setError('Bu bildiri için revizyon istenmemiştir veya revizyon yapma hakkınız bulunmamaktadır.');
          setLoading(false);
          return;
        }
        
        setOriginalPaper(paper);
        
        // Bildiriye ait revizeleri getir
        setRevizeLoading(true);
        try {
          const revizeler = await revizeService.getRevizesByBildiriId(bildiriId);
          console.log("Bildiriye ait revizeler:", revizeler);
          
          if (revizeler && revizeler.length > 0) {
            // Revizeleri son tarihten eskiye doğru sırala
            const siraliRevizeler = revizeler.sort((a, b) => {
              return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
            });
            
            // Revize isteyen hakemlerin değerlendirmelerini bul
            const revizeIsteyenDegerlendirmeler = siraliRevizeler.filter(revize => 
              revize.durum === 'REVIZE' || 
              revize.durum?.toLowerCase() === 'revize'
            );
            
            console.log("Revize isteyen hakem değerlendirmeleri:", revizeIsteyenDegerlendirmeler);
            
            // Revize değerlendirmelerini dönüştür ve state'e kaydet
            const duzeltilmisRevizeler: RevizeDetay[] = revizeIsteyenDegerlendirmeler.map(revize => ({
              hakemId: revize.hakemId,
              durum: revize.durum,
              gucluYonler: revize.gucluYonler,
              zayifYonler: revize.zayifYonler,
              genelYorum: revize.genelYorum,
              createdAt: revize.createdAt,
              // Yeni alanlar - API'dan gelmiyor olabilir
              makaleTuru: revize.makaleTuru || undefined,
              makaleBasligi: revize.makaleBasligi || undefined,
              soyut: revize.soyut || undefined,
              anahtarKelimeler: revize.anahtarKelimeler || undefined,
              giris: revize.giris || undefined,
              gerekcelerVeYontemler: revize.gerekcelerVeYontemler || undefined,
              sonuclarVeTartismalar: revize.sonuclarVeTartismalar || undefined,
              referanslar: revize.referanslar || undefined,
              guncellikVeOzgunluk: revize.guncellikVeOzgunluk || undefined,
            }));
            
            // Eğer en az bir revize isteği varsa, onu revizeDetay'a da atayalım (geriye dönük uyumluluk)
            if (duzeltilmisRevizeler.length > 0) {
              setRevizeDetay(duzeltilmisRevizeler[0]);
            }
            
            // Tüm revizeleri state'e kaydet
            setRevizeIsteyenHakemler(duzeltilmisRevizeler);
            
            console.log("Düzeltilmiş revize nesneleri:", duzeltilmisRevizeler);
          }
        } catch (revizeError) {
          console.error("Revize bilgileri alınırken hata:", revizeError);
          // Revizeleri alamadık ama sayfa yine de çalışsın
        } finally {
          setRevizeLoading(false);
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        setError('Veri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyiniz.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bildiriId, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Token kontrolü
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Revizyon göndermek için lütfen giriş yapın.");
        setSubmitting(false);
        return;
      }

      // Kullanıcı bilgilerini kontrol et
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError("Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        setSubmitting(false);
        return;
      }

      const user = JSON.parse(userData);
      if (!user.id) {
        setError("Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.");
        setSubmitting(false);
        return;
      }

      // Aktif sempozyum var mı kontrol et
      if (!activeSempozyum) {
        setError("Aktif sempozyum bulunamadı.");
        setSubmitting(false);
        return;
      }

      // Form validasyonları
      if (!selectedFile) {
        setError("Lütfen revize edilmiş bildiri dosyasını yükleyiniz.");
        setSubmitting(false);
        return;
      }

      // Upload file
      const formDataForUpload = new FormData();
      formDataForUpload.append('file', selectedFile);
      formDataForUpload.append('sempozyumId', activeSempozyum.id.toString());

      // Dosya yükleme işlemi
      let dosyaUrl;
      try {
        console.log('📤 Dosya yükleme başlıyor, token:', token.substring(0, 15) + '...');
        
        const uploadResponse = await fetch('/api/bildiri/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataForUpload
        });

        if (!uploadResponse.ok) {
          if (uploadResponse.status === 401) {
            throw new Error('Yetkilendirme hatası. Oturumunuz sonlanmış olabilir. Lütfen sayfayı yenileyip tekrar giriş yapın.');
          }
          
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Dosya yükleme sırasında bir hata oluştu.');
        }

        const responseData = await uploadResponse.json();
        dosyaUrl = responseData.fileInfo.url;
        console.log('✅ Dosya başarıyla yüklendi:', dosyaUrl);
      } catch (uploadError) {
        console.error('Dosya yükleme hatası:', uploadError);
        throw new Error(uploadError instanceof Error ? uploadError.message : 'Dosya yükleme sırasında bir hata oluştu.');
      }

      // Revizyon verilerini hazırla
      const revisionData = {
        id: Number(originalPaper.id),
        durum: "REVIZE_YAPILDI",
        dokuman: dosyaUrl,
        ozet: revisionNote,
        sempozyumId: Number(activeSempozyum.id)
      };

      console.log("Revizyon gönderiliyor...", revisionData);
      console.log("Bildiri durumu REVIZE_YAPILDI olarak ayarlanacak. Backend'in bu değeri doğru şekilde işlediğinden emin olun.");

      try {
        // Bildiri güncelleme servisini çağır
        console.log("Bildiri güncelleme servisine istek gönderiliyor:", revisionData);
        const updatedBildiri = await bildiriService.update(revisionData);
        console.log("Revizyon başarıyla gönderildi: ", updatedBildiri);
        
        // Durum değerini kontrol et ve doğru ayarlandığından emin ol
        if (updatedBildiri.durum !== "REVIZE_YAPILDI" && updatedBildiri.durum !== "revize_yapildi") {
          console.warn("Uyarı: Bildiri durumu beklenen değere ayarlanmamış olabilir:", updatedBildiri.durum);
        }

        // Revize değerlendirmelerini sıfırla (mevcut değerlendirmeleri RevizeGecmisi'ne taşı ve sil)
        try {
          console.log("Revize değerlendirmeleri sıfırlanıyor...");
          const resetResult = await bildiriService.resetReviews(originalPaper.id);
          console.log("Revize değerlendirmeleri sıfırlandı:", resetResult);
        } catch (resetError: any) {
          console.error("Revize sıfırlama hatası:", resetError);
          // Burada sıfırlama başarısız olsa bile bildiriyi güncelledik, 
          // bu nedenle kullanıcıya bildirilsin ama işlem iptal edilmesin
          toast.error("Revizyon gönderildi ancak değerlendirme sıfırlama işleminde bir hata oluştu.");
        }

        // Başarılı bildirim
        toast.success("Revizyon başarıyla gönderildi.");
        
        // Display success message
        setMessage({ type: 'success', text: 'Revizyon başarıyla gönderildi! Değerlendirme sonucunu "Bildirilerim" sayfasından takip edebilirsiniz.' });
        
        // 3 saniye sonra yönlendir
        setTimeout(() => {
          router.push('/my-papers');
        }, 3000);
      } catch (bildiriError: any) {
        console.error("Bildiri güncelleme hatası:", bildiriError);
        console.error("Bildiri hatası detayları:", {
          message: bildiriError.message,
          stack: bildiriError.stack,
          response: bildiriError.response?.data
        });
        
        // Hata mesajını doğrudan ekranda göster
        setError(bildiriError.message || "Revizyon gönderilirken bir hata oluştu.");
        
        // Hata bildirimi göster
        toast.error(bildiriError.message || "Revizyon gönderilirken bir hata oluştu.");
        setSubmitting(false);
      }
    } catch (error: any) {
      console.error("Revizyon gönderme hatası:", error);
      
      // Hata mesajını doğrudan ekranda göster
      setError(error.message || "Revizyon gönderilirken bir hata oluştu.");
      
      // Hata bildirimi göster
      toast.error(error.message || "Revizyon gönderilirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-600"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen pt-8 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center mb-8">
          <Link 
            href="/my-papers" 
            className="flex items-center text-gray-600 hover:text-yellow-600 transition-colors mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> Bildirilerime Dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Bildiri Revizyonu</h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-md shadow-sm mb-8" role="alert">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="font-bold text-red-700">Hata</p>
                <p className="text-red-700">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Sorun devam ederse lütfen <a href="mailto:info@sempozyum.org" className="underline">info@sempozyum.org</a> adresinden bizimle iletişime geçin.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {message && (
          <div className={`p-5 rounded-md shadow-sm mb-8 ${message.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`} role="alert">
            <div className="flex items-start">
              <InformationCircleIcon className={`h-6 w-6 mr-3 mt-0.5 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className={`font-bold ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {message.type === 'success' ? 'Başarılı!' : 'Hata!'}
                </p>
                <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>{message.text}</p>
              </div>
            </div>
          </div>
        )}
        
        {revizeDurumUyari && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-md shadow-sm mb-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
              <div>
                <p className="font-bold text-yellow-700">Bilgi</p>
                <p className="text-yellow-700">{revizeDurumUyari}</p>
              </div>
            </div>
          </div>
        )}
        
        {!originalPaper ? (
          <div className="bg-yellow-50 text-yellow-800 p-5 rounded-md shadow-sm">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
              <p>Bildiri bilgileri yüklenemedi. Lütfen sayfayı yenileyiniz.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bildiri temel bilgileri */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <DocumentIcon className="h-6 w-6 mr-2 text-yellow-600" /> Bildiri Detayları
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Başlık</p>
                  <p className="text-gray-900 font-medium">{originalPaper.baslik}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Yazarlar</p>
                  <p className="text-gray-900">{Array.isArray(originalPaper.yazarlar) ? originalPaper.yazarlar.join(', ') : originalPaper.yazarlar}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Ana Konu</p>
                  <p className="text-gray-900">{originalPaper.anaKonu?.baslik || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Alt Konu</p>
                  <p className="text-gray-900">{originalPaper.bildiriKonusu?.baslik || 'Belirtilmemiş'}</p>
                </div>
              </div>
            </div>
            
            {/* Hakem Değerlendirmesi */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                <ChatBubbleLeftIcon className="h-6 w-6 mr-2 text-blue-600" /> 
                Hakem Değerlendirmeleri
                {revizeIsteyenHakemler.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {revizeIsteyenHakemler.length} hakem
                  </span>
                )}
              </h2>
              
              {revizeLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-600"></div>
                </div>
              ) : revizeIsteyenHakemler.length > 0 ? (
                <div className="space-y-8">
                  {revizeIsteyenHakemler.map((revize: RevizeDetay, index: number) => {
                    const hakemNo = index + 1;
                    
                    return (
                      <div key={index} className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <h3 className="flex items-center text-lg font-medium text-blue-800 mb-3">
                          <ChatBubbleLeftIcon className="h-6 w-6 mr-2 text-blue-600" /> 
                          <span className="flex items-center">
                            Hakem #{hakemNo} Değerlendirmesi
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Revizyon İstendi
                            </span>
                          </span>
                        </h3>
                        
                        {/* Güçlü Yönler */}
                        {revize.gucluYonler && (
                          <div className="bg-green-50 p-5 rounded-lg border border-green-200 mb-4">
                            <h3 className="flex items-center text-lg font-medium text-green-800 mb-3">
                              <CheckCircleIcon className="h-6 w-6 mr-2 text-green-600" /> Güçlü Yönler
                            </h3>
                            <div className="bg-white p-4 rounded border border-green-100">
                              <p className="text-gray-800">{revize.gucluYonler || "Belirtilmemiş"}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Zayıf Yönler */}
                        {revize.zayifYonler && (
                          <div className="bg-red-50 p-5 rounded-lg border border-red-200 mb-4">
                            <h3 className="flex items-center text-lg font-medium text-red-800 mb-3">
                              <XCircleIcon className="h-6 w-6 mr-2 text-red-600" /> Zayıf Yönler
                            </h3>
                            <div className="bg-white p-4 rounded border border-red-100">
                              <p className="text-gray-800">{revize.zayifYonler || "Belirtilmemiş"}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Genel Yorum */}
                        {revize.genelYorum && (
                          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mb-4">
                            <h3 className="flex items-center text-lg font-medium text-blue-800 mb-3">
                              <ChatBubbleLeftIcon className="h-6 w-6 mr-2 text-blue-600" /> Genel Değerlendirme
                            </h3>
                            <div className="bg-white p-4 rounded border border-blue-100">
                              <p className="text-gray-800">{revize.genelYorum || "Belirtilmemiş"}</p>
                            </div>
                          </div>
                        )}

                        {/* Detaylı Değerlendirme Alanları - Sadece dolu olanları göster */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {/* Makale Türü */}
                          {revize.makaleTuru && (
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                              <h3 className="flex items-center text-md font-medium text-purple-800 mb-2">
                                <DocumentIcon className="h-5 w-5 mr-1 text-purple-600" /> Makale Türü
                              </h3>
                              <div className="bg-white p-3 rounded border border-purple-100">
                                <p className="text-gray-800 text-sm">{revize.makaleTuru}</p>
                              </div>
                            </div>
                          )}

                          {/* Makale Başlığı */}
                          {revize.makaleBasligi && (
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                              <h3 className="flex items-center text-md font-medium text-indigo-800 mb-2">
                                <DocumentIcon className="h-5 w-5 mr-1 text-indigo-600" /> Makale Başlığı
                              </h3>
                              <div className="bg-white p-3 rounded border border-indigo-100">
                                <p className="text-gray-800 text-sm">{revize.makaleBasligi}</p>
                              </div>
                            </div>
                          )}

                          {/* Soyut (Abstract) */}
                          {revize.soyut && (
                            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                              <h3 className="flex items-center text-md font-medium text-cyan-800 mb-2">
                                <DocumentIcon className="h-5 w-5 mr-1 text-cyan-600" /> Özet
                              </h3>
                              <div className="bg-white p-3 rounded border border-cyan-100">
                                <p className="text-gray-800 text-sm">{revize.soyut}</p>
                              </div>
                            </div>
                          )}

                          {/* Anahtar Kelimeler */}
                          {revize.anahtarKelimeler && (
                            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                              <h3 className="flex items-center text-md font-medium text-teal-800 mb-2">
                                <DocumentIcon className="h-5 w-5 mr-1 text-teal-600" /> Anahtar Kelimeler
                              </h3>
                              <div className="bg-white p-3 rounded border border-teal-100">
                                <p className="text-gray-800 text-sm">{revize.anahtarKelimeler}</p>
                              </div>
                            </div>
                          )}

                          {/* Giriş */}
                          {revize.giris && (
                            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                              <h3 className="flex items-center text-md font-medium text-emerald-800 mb-2">
                                <DocumentIcon className="h-5 w-5 mr-1 text-emerald-600" /> Giriş
                              </h3>
                              <div className="bg-white p-3 rounded border border-emerald-100">
                                <p className="text-gray-800 text-sm">{revize.giris}</p>
                              </div>
                            </div>
                          )}

                          {/* Gerekçeler ve Yöntemler */}
                          {revize.gerekcelerVeYontemler && (
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                              <h3 className="flex items-center text-md font-medium text-amber-800 mb-2">
                                <DocumentIcon className="h-5 w-5 mr-1 text-amber-600" /> Gerekçeler ve Yöntemler
                              </h3>
                              <div className="bg-white p-3 rounded border border-amber-100">
                                <p className="text-gray-800 text-sm">{revize.gerekcelerVeYontemler}</p>
                              </div>
                            </div>
                          )}

                          {/* Sonuçlar ve Tartışmalar */}
                          {revize.sonuclarVeTartismalar && (
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                              <h3 className="flex items-center text-md font-medium text-orange-800 mb-2">
                                <DocumentIcon className="h-5 w-5 mr-1 text-orange-600" /> Sonuçlar ve Tartışmalar
                              </h3>
                              <div className="bg-white p-3 rounded border border-orange-100">
                                <p className="text-gray-800 text-sm">{revize.sonuclarVeTartismalar}</p>
                              </div>
                            </div>
                          )}

                          {/* Referanslar */}
                          {revize.referanslar && (
                            <div className="bg-lime-50 p-4 rounded-lg border border-lime-200">
                              <h3 className="flex items-center text-md font-medium text-lime-800 mb-2">
                                <DocumentIcon className="h-5 w-5 mr-1 text-lime-600" /> Referanslar
                              </h3>
                              <div className="bg-white p-3 rounded border border-lime-100">
                                <p className="text-gray-800 text-sm">{revize.referanslar}</p>
                              </div>
                            </div>
                          )}

                          {/* Güncellik ve Özgünlük */}
                          {revize.guncellikVeOzgunluk && (
                            <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                              <h3 className="flex items-center text-md font-medium text-rose-800 mb-2">
                                <DocumentIcon className="h-5 w-5 mr-1 text-rose-600" /> Güncellik ve Özgünlük
                              </h3>
                              <div className="bg-white p-3 rounded border border-rose-100">
                                <p className="text-gray-800 text-sm">{revize.guncellikVeOzgunluk}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 p-5 rounded-lg">
                  <p className="text-gray-700 text-center">Bu bildiri için revize değerlendirmesi mevcut değil.</p>
                </div>
              )}
              
              {/* Özet - Alt kısımda ayrı olarak gösterilecek */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Bildiri Özeti</h3>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <p className="text-gray-800 text-sm">{originalPaper?.ozet}</p>
                </div>
              </div>
            </div>
            
            {/* Revizyon Formu */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Revizyon Gönderimi</h2>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revizyon Sonrası Özet</label>
                  <textarea
                    name="revisionNote"
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    rows={5}
                    placeholder="Revizyon sonrası bildirinin güncellenmiş özetini buraya yazınız..."
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2 flex items-center">
                    <InformationCircleIcon className="h-5 w-5 mr-1" /> Bu alana yazdığınız metin, bildiri kaydınızdaki özet bölümü ile güncellenecektir.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-lg border border-yellow-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revize Edilmiş Bildiri Dosyası (PDF)</label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="dropzone-file"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">PDF dosyasını</span> yüklemek için tıklayın
                        </p>
                        <p className="text-xs text-gray-500">PDF (Maksimum 20MB)</p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // PDF dosyası kontrolü
                            if (file.type !== 'application/pdf') {
                              setMessage({ type: 'error', text: 'Lütfen sadece PDF dosyası yükleyin.' });
                              return;
                            }
                            
                            // Dosya boyutu kontrolü (20MB)
                            if (file.size > 20 * 1024 * 1024) {
                              setMessage({ type: 'error', text: 'Dosya boyutu 20MB\'dan büyük olamaz.' });
                              return;
                            }
                            
                            setSelectedFile(file);
                          }
                        }}
                        required
                      />
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                      <span className="text-sm text-gray-700">{selectedFile.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setSelectedFile(null)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Kaldır
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Sadece PDF formatında dosyalar kabul edilmektedir. Maksimum dosya boyutu: 20MB
                  </p>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium mb-3 text-blue-800">Revizyon Gönderim Kuralları</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                    <li>Revize edilmiş bildiri hakem isteklerine uygun şekilde düzeltilmiş olmalıdır.</li>
                    <li>Değişikliklerinizi açıkça belirtin ve hakem yorumlarını nasıl ele aldığınızı açıklayın.</li>
                    <li>Revizyon değerlendirme süreci yaklaşık 1-2 hafta sürmektedir.</li>
                    <li>Revizyon ile ilgili sorularınız için <a href="mailto:info@sempozyum.org" className="text-blue-600 hover:underline">info@sempozyum.org</a> adresine e-posta gönderebilirsiniz.</li>
                  </ul>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={() => setAcceptTerms(!acceptTerms)}
                    className="h-5 w-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <label htmlFor="terms" className="ml-3 block text-sm text-gray-700">
                    Revizyon gönderim koşullarını ve <a href="/etik-kurallar" className="text-yellow-600 hover:underline">etik kuralları</a> okudum ve kabul ediyorum.
                  </label>
                </div>
                
                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                  <Link
                    href="/my-papers"
                    className="bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-6 border border-gray-300 rounded-md shadow-sm transition-colors flex items-center"
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" /> İptal
                  </Link>
                  <button
                    type="submit"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-6 rounded-md shadow-sm transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={submitting || !selectedFile || !acceptTerms || originalPaper.durum === "REVIZE_YAPILDI"}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-5 w-5 mr-2" /> Revizyonu Gönder
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 