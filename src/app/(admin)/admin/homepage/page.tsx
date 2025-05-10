"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { 
  getSymposiumInfo, 
  updateSymposiumInfo, 
  getImportantDates, 
  updateImportantDate, 
  addImportantDate, 
  deleteImportantDate,
  getPageContent,
  updatePageContent,
  SymposiumInfo,
  ImportantDate,
  MainTopic,
  Sponsor,
  PageContent,
  getPaperTopics,
  updatePaperTopic,
  addPaperTopic,
  deletePaperTopic,
  PaperTopic
} from '@/lib/database';
import { 
  getAktifGenelBilgiler, saveGenelBilgiler,
  getAktifOnemliTarihler, updateOnemliTarih, createOnemliTarih, deleteOnemliTarih,
  getAktifAnaKonular, updateAnaKonu, createAnaKonu, deleteAnaKonu,
  getAktifSponsorlar, updateSponsorAPI, createSponsorAPI, deleteSponsorAPI,
  getBildiriKonulari,
  updateBildiriKonusu,
  createBildiriKonusu,
  deleteBildiriKonusu,
} from '@/lib/services';

export default function AdminHomepage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const pageParam = searchParams.get('page') || 'home';
  
  // ISO string'i datetime-local input için formatlar (YYYY-MM-DDThh:mm)
  const formatDateForInput = (isoString: string) => {
    if (!isoString) return '';
    return isoString.substring(0, 16); // "2023-01-01T12:00:00.000Z" -> "2023-01-01T12:00"
  };
  
  // Datetime-local input'tan gelen değeri ISO string'e çevirir
  const formatInputToISOString = (inputDate: string) => {
    if (!inputDate) return '';
    try {
      const date = new Date(inputDate);
      if (!isNaN(date.getTime())) {
        console.log('Formattan ISO stringe dönüştürülen tarih:', inputDate, '→', date.toISOString());
        return date.toISOString();
      } else {
        console.error('Geçersiz tarih formatı:', inputDate);
        return inputDate;
      }
    } catch (e) {
      console.error('Tarih formatı dönüşüm hatası:', e);
      return inputDate;
    }
  };
  
  const [loading, setLoading] = useState(true);
  const [symposium, setSymposium] = useState<SymposiumInfo | null>(null);
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [topics, setTopics] = useState<MainTopic[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [aboutPageContent, setAboutPageContent] = useState<PageContent | null>(null);
  const [activePage, setActivePage] = useState(pageParam);
  const [activeTab, setActiveTab] = useState(tabParam || 'general');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasChanges, setHasChanges] = useState(false);
  
  // Yeni tarih için state
  const [newDate, setNewDate] = useState<Omit<ImportantDate, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    date: '',
    isCompleted: false,
    symposiumId: 'sym2025'
  });

  // Yeni konu için state
  const [newTopic, setNewTopic] = useState<Omit<MainTopic, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    icon: '',
    symposiumId: 'sym2025'
  });

  // Yeni sponsor için state
  const [newSponsor, setNewSponsor] = useState<Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'> & { logo: string }>({
    name: '',
    logo: '',
    website: '',
    symposiumId: 'sym2025'
  });

  // Paper Topics için yeni state'ler
  const [paperTopics, setPaperTopics] = useState<PaperTopic[]>([]);
  const [newPaperTopic, setNewPaperTopic] = useState<Omit<PaperTopic, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    mainTopicId: '',
    symposiumId: 'sym2025'
  });
  const [editingPaperTopic, setEditingPaperTopic] = useState<PaperTopic | null>(null);
  const [selectedMainTopic, setSelectedMainTopic] = useState<string | null>(null);

  // Debug panel state
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Debug logger
  const logDebug = useCallback((message: string) => {
    console.log(message);
    setDebugLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  }, []);
  
  // Clear debug logs
  const clearLogs = useCallback(() => {
    setDebugLogs([]);
  }, []);

  // Sayfadan çıkış uyarısı
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'Kaydedilmemiş değişiklikleriniz var. Sayfadan çıkmak istediğinizden emin misiniz?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

  useEffect(() => {
    // URL'den gelen parametreleri kontrol et
    if (tabParam) {
      setActiveTab(tabParam);
    }
    if (pageParam) {
      setActivePage(pageParam);
    }
    
    // Sayfa veya tab değiştiğinde verileri yeniden yükle
    if (user) {
      logDebug(`Sayfa veya tab değişti. Sayfa: ${pageParam}, Tab: ${tabParam}`);
      loadData();
    }
  }, [tabParam, pageParam, user]);

  // Sempozyum ID'sini newDate state'ine yansıt
  useEffect(() => {
    if (symposium && symposium.id) {
      setNewDate(prevState => ({
        ...prevState,
        symposiumId: symposium.id
      }));
    }
  }, [symposium]);

  useEffect(() => {
    // Admin değilse ana sayfaya yönlendir
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Token var mı kontrol et
        const token = localStorage.getItem('token');
        console.log('🔑 Homepage - Token kontrolü:', !!token);
        if (token) {
          console.log('Token değeri:', token.substring(0, 20) + '...');
        }
        
        // Önce aktif sempozyumu al
        try {
          const { sempozyumService } = await import('@/lib/services');
          const aktifSempozyum = await sempozyumService.getAktifSempozyum();
          
          if (aktifSempozyum) {
            console.log('Aktif sempozyum bilgileri alındı:', aktifSempozyum);
            // Sempozyum ID'sini state'e kaydet
            localStorage.setItem('aktif_sempozyum_id', aktifSempozyum.id.toString());
          } else {
            console.warn('Aktif sempozyum bulunamadı!');
            localStorage.removeItem('aktif_sempozyum_id');
          }
        } catch (sempozyumError) {
          console.error('Aktif sempozyum bilgisi alınamadı:', sempozyumError);
        }
        
        // API'den verileri çekmek için servisleri kullanıyoruz
        try {
          // Her Promise'i ayrı çağırarak hata ayıklamayı kolaylaştır
          const genelBilgiler = await getAktifGenelBilgiler();
          const importantDates = await getAktifOnemliTarihler();
          const mainTopicsData = await getAktifAnaKonular();
          const sponsorsData = await getAktifSponsorlar();
          const aboutContent = await getPageContent('about');
          
          // Gerçek sempozyumId'yi al
          if (genelBilgiler) {
            if ('sempozyumId' in genelBilgiler) {
              console.log('📋 API verisi içinde numeric sempozyumId bulundu:', (genelBilgiler as any).sempozyumId);
            } else {
              console.log('📋 API verisinde sempozyumId bulunamadı. ID:', genelBilgiler.id);
            }
          }
          
          setSymposium(genelBilgiler);
          setDates(importantDates);
          setTopics(mainTopicsData);
          setSponsors(sponsorsData);
          setAboutPageContent(aboutContent);
        } catch (promiseError) {
          console.error("API veri çekme hatası:", promiseError);
          setMessage({ type: 'error', text: 'Veri çekme işlemi sırasında hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.' });
          
          // Hata durumunda varsayılan değerler ayarla - boş değerlerle
          const defaultSymposium: SymposiumInfo & { genelBilgilerId: number } = {
            id: '1',
            title: '',
            subtitle: '',
            dates: '',
            countdownDate: new Date().toISOString(),
            description: '',
            longDescription: '',
            venue: '',
            organizer: '',
            year: new Date().getFullYear(),
            isActive: true,
            docentlikInfo: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            genelBilgilerId: 0
          };
          
          setSymposium(defaultSymposium);
          setDates([]);
          setTopics([]);
          setSponsors([]);
          setAboutPageContent(null);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
        setMessage({ type: 'error', text: 'Veriler yüklenirken bir hata oluştu.' });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, router]);

  useEffect(() => {
    const fetchPaperTopics = async () => {
      try {
        setLoading(true);
        const bildiriKonulari = await getBildiriKonulari();
        setPaperTopics(bildiriKonulari);
      } catch (error) {
        console.error("Bildiri konuları yüklenirken hata oluştu:", error);
        setMessage({ type: 'error', text: 'Bildiri konuları yüklenirken bir hata oluştu.' });
      } finally {
        setLoading(false);
      }
    };

    if (activePage === 'paper-topics') {
      fetchPaperTopics();
    }
  }, [activePage]);

  const handleSymposiumChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!symposium) return;
    
    const { name, value } = e.target;
    setSymposium({
      ...symposium,
      [name]: value
    });
    setHasChanges(true);
  };

  const handleSymposiumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symposium) return;

    try {
      setLoading(true);
      
      // Token kontrolü
      const token = localStorage.getItem('token');
      logDebug(`🔑 Sempozyum güncelleme - Token kontrolü: ${!!token}`);
      
      if (!token) {
        setMessage({ type: 'error', text: 'Oturum anahtarı bulunamadı. Lütfen tekrar giriş yapın.' });
        setLoading(false);
        return;
      }
      
      // API entegrasyonu: database.ts yerine API servisini kullanıyoruz
      let updatedSymposium;
      
      // Sempozyum ID'sini doğru şekilde alıyoruz
      let sempozyumId: number;
      
      // Aktif sempozyum ID'sini localStorage'dan al
      const aktifSempozyumId = localStorage.getItem('aktif_sempozyum_id');
      
      if (aktifSempozyumId && !isNaN(Number(aktifSempozyumId))) {
        // Aktif sempozyum ID'sini kullan
        sempozyumId = Number(aktifSempozyumId);
        logDebug(`Aktif sempozyum ID kullanılıyor: ${sempozyumId}`);
      } else {
        // Mevcut veriden sempozyumId'yi almayı dene
        if (symposium && (symposium as any).sempozyumId !== undefined) {
          // sempozyumId'nin sayı olduğundan emin olalım
          const rawId = (symposium as any).sempozyumId;
          if (typeof rawId === 'number') {
            sempozyumId = rawId;
          } else if (typeof rawId === 'string' && !isNaN(Number(rawId))) {
            sempozyumId = Number(rawId);
          } else {
            // Geçersiz sempozyumId, aktif sempozyumu almayı deneyelim veya varsayılan değeri kullanalım
            logDebug(`Geçersiz sempozyumId değeri: ${rawId}, varsayılan kullanılacak`);
            sempozyumId = 1;
          }
          logDebug(`API'den alınan sempozyumId kullanılıyor: ${sempozyumId}`);
        } else {
          // Yoksa, varsayılan bir değer kullanalım
          sempozyumId = 1;
          logDebug(`Varsayılan sempozyumId kullanılıyor: ${sempozyumId}`);
        }
      }
      
      // Aktif sempozyum ID'sini son bir kez kontrol et
      try {
        const { sempozyumService } = await import('@/lib/services');
        const aktifSempozyum = await sempozyumService.getAktifSempozyum();
        
        if (aktifSempozyum) {
          // API çağrısından dönen en güncel değeri kullan
          sempozyumId = aktifSempozyum.id;
          logDebug(`API'den alınan en güncel aktif sempozyum ID: ${sempozyumId}`);
        }
      } catch (sempozyumError) {
        logDebug(`Aktif sempozyum bilgisi alınırken hata: ${sempozyumError}. Mevcut ID kullanılacak.`);
      }
      
      logDebug(`Güncellenecek sempozyum ID: ${sempozyumId}`);
      
      // Önbellek temizleme
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cached_symposium_data');
        localStorage.removeItem('cached_general_info');
        localStorage.removeItem('last_fetch_time');
        logDebug('LocalStorage önbelleği temizlendi');
      }
      
      try {
        // saveGenelBilgiler fonksiyonunu kullanarak akıllı kayıt/güncelleme işlemi yap
        const { saveGenelBilgiler } = await import('@/lib/services');
        
        logDebug(`Genel bilgiler için akıllı kayıt/güncelleme kullanılıyor... SempozyumID: ${sempozyumId}`);
        updatedSymposium = await saveGenelBilgiler(symposium, sempozyumId);
        
        logDebug(`Güncelleme sonucu: ${JSON.stringify(updatedSymposium, null, 2)}`);
      } catch (apiError: any) {
        logDebug(`API hatası: ${apiError.message}`);
        throw apiError; // Hatayı dışarıya fırlat
      }
      
      // Başarı mesajı göster
      setMessage({ type: 'success', text: 'Sempozyum bilgileri başarıyla güncellendi.' });
      setHasChanges(false);
      
      // Veritabanından taze veri çekmek için zorla yenileme işlemi
      logDebug('Veritabanı güncelleme sonrası sayfa yenileniyor...');
      
      // Önbellek sıfırlama ve timestamp ile yönlendirme 
      const timestamp = Date.now();
      
      // Önce tüm önbellekleri temizle
      if (typeof window !== 'undefined') {
        // Önbellek temizleme
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('cached_')) {
            localStorage.removeItem(key);
          }
        });
        
        // Yenileme zamanını kaydet
        localStorage.setItem('last_refresh_time', timestamp.toString());
        
        // Sayfa URL'sine timestamp ekleyerek önbelleği bypass et
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('_refresh', timestamp.toString());
        
        // Sayfayı 1 saniye sonra zorla yenile
        setTimeout(() => {
          logDebug(`Sayfa yenileniyor: ${currentUrl.toString()}`);
          window.location.href = currentUrl.toString();
        }, 1000);
      }
      
    } catch (error: any) {
      console.error("Güncelleme hatası:", error);
      
      let errorMessage = 'Sempozyum bilgileri güncellenirken bir hata oluştu.';
      
      // Hata detayları
      if (error.response) {
        logDebug(`API yanıt hatası: ${error.response.status} ${error.response.statusText}`);
        logDebug(`Hata detayları: ${JSON.stringify(error.response.data, null, 2)}`);
        
        if (error.response.status === 401) {
          errorMessage = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.';
        } else if (error.response.status === 403) {
          errorMessage = 'Bu işlem için yetkiniz yok. Sadece admin kullanıcılar bu işlemi yapabilir.';
        } else if (error.response.data?.error) {
          errorMessage = `API Hatası: ${error.response.data.error}`;
        }
      } else {
        logDebug(`Bilinmeyen hata: ${error.message}`);
        errorMessage = `Hata: ${error.message}`;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (id: string, field: keyof ImportantDate, value: any) => {
    if (field === 'date' && typeof value === 'string') {
      // Input'tan gelen date değerini ISO string'e çeviriyoruz
      const isoString = formatInputToISOString(value);
      setDates(dates.map(date => 
        date.id === id ? { ...date, [field]: isoString } : date
      ));
    } else {
      setDates(dates.map(date => 
        date.id === id ? { ...date, [field]: value } : date
      ));
    }
    setHasChanges(true);
  };

  const handleDateSubmit = async (id: string) => {
    try {
      setLoading(true);
      
      // Token kontrolü
      const token = localStorage.getItem('token');
      console.log('🔑 Tarih güncelleme - Token kontrolü:', !!token);
      
      if (!token) {
        setMessage({ type: 'error', text: 'Oturum anahtarı bulunamadı. Lütfen tekrar giriş yapın.' });
        setLoading(false);
        return;
      }
      
      const dateToUpdate = dates.find(date => date.id === id);
      if (!dateToUpdate) {
        console.error('Güncellenecek tarih bulunamadı. ID:', id);
        setMessage({ type: 'error', text: 'Güncellenecek tarih bulunamadı.' });
        setLoading(false);
        return;
      }
      
      console.log('Güncellenecek tarih:', dateToUpdate);
      
      // Aktif sempozyum ID'sini al
      const sempozyumId = await getAktifSempozyumId();
      console.log('Aktif Sempozyum ID:', sempozyumId);
      
      // API entegrasyonu: database.ts yerine API servisini kullanıyoruz
      // API'den gelen verideki onemliTarihId'yi kullanmak için type assertion yapıyoruz
      const onemliTarihId = (dateToUpdate as any).onemliTarihId;
      console.log('Önemli tarih ID:', onemliTarihId);
      
      if (onemliTarihId) {
        console.log('API isteği hazırlanıyor...');
        const updatedDate = await updateOnemliTarih(onemliTarihId, dateToUpdate, sempozyumId);
        console.log('API yanıtı:', updatedDate);
        
        // Güncellenmiş tarihi state'e yansıtıyoruz
        setDates(dates.map(d => d.id === id ? { ...updatedDate } : d));
      } else {
        console.error('onemliTarihId bulunamadı - API isteği yapılamayacak');
        // Eski yöntem (API bağlantısı yoksa)
        await updateImportantDate(id, dateToUpdate);
      }
      
      setMessage({ type: 'success', text: 'Tarih başarıyla güncellendi.' });
      setHasChanges(false);
    } catch (error: any) {
      console.error("Tarih güncelleme hatası:", error);
      
      let errorMessage = 'Tarih güncellenirken bir hata oluştu.';
      
      // Hata detayları
      if (error.response) {
        console.error('API yanıt detayları:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        if (error.response.status === 401) {
          errorMessage = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.';
        } else if (error.response.status === 403) {
          errorMessage = 'Bu işlem için yetkiniz yok. Sadece admin kullanıcılar bu işlemi yapabilir.';
        } else if (error.response.data?.error) {
          errorMessage = `API Hatası: ${error.response.data.error}`;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleNewDateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewDate({
        ...newDate,
        [name]: checked
      });
    } else if (name === 'date' && type === 'datetime-local') {
      // Datetime-local input'tan gelen değeri ISO string'e çeviriyoruz
      const isoString = formatInputToISOString(value);
      setNewDate({
        ...newDate,
        [name]: isoString
      });
    } else {
      setNewDate({
        ...newDate,
        [name]: value
      });
    }
  };

  const getAktifSempozyumId = async (): Promise<number> => {
    // Önce localStorage'dan kontrol et
    const storedId = localStorage.getItem('aktif_sempozyum_id');
    if (storedId && !isNaN(Number(storedId))) {
      return Number(storedId);
    }
    
    // Yoksa API'den al
    try {
      const { sempozyumService } = await import('@/lib/services');
      const aktifSempozyum = await sempozyumService.getAktifSempozyum();
      
      if (aktifSempozyum) {
        localStorage.setItem('aktif_sempozyum_id', aktifSempozyum.id.toString());
        return aktifSempozyum.id;
      }
    } catch (error) {
      console.error('Aktif sempozyum bilgisi alınamadı:', error);
    }
    
    // Varsayılan değer
    return 1;
  };

  const handleAddDate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDate.title || !newDate.date) {
      setMessage({ type: 'error', text: 'Lütfen tüm alanları doldurun.' });
      return;
    }

    try {
      setLoading(true);
      
      // Sempozyum ID'sini alıyoruz
      const sempozyumId = await getAktifSempozyumId();
      
      console.log('Yeni tarih ekleniyor:', newDate);
      console.log('Aktif Sempozyum ID:', sempozyumId);
      
      // API entegrasyonu: database.ts yerine API servisini kullanıyoruz
      const addedDate = await createOnemliTarih(newDate, sempozyumId);
      
      console.log('Eklenen tarih:', addedDate);
      
      setDates([...dates, addedDate]);
      setNewDate({
        title: '',
        date: '',
        isCompleted: false,
        symposiumId: symposium?.id || 'sym2025'
      });
      setMessage({ type: 'success', text: 'Yeni tarih başarıyla eklendi.' });
    } catch (error: any) {
      console.error("Tarih ekleme hatası:", error);
      if (error.response) {
        console.error("API yanıtı:", error.response.data);
        setMessage({ type: 'error', text: `Tarih eklenirken bir hata oluştu: ${error.response.data.error || error.message}` });
      } else {
        setMessage({ type: 'error', text: `Tarih eklenirken bir hata oluştu: ${error.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDate = async (id: string) => {
    if (!confirm('Bu tarihi silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      
      // Silinecek tarihi bulalım
      const dateToDelete = dates.find(date => date.id === id);
      if (!dateToDelete) return;
      
      // API entegrasyonu: database.ts yerine API servisini kullanıyoruz
      const onemliTarihId = (dateToDelete as any).onemliTarihId;
      if (onemliTarihId) {
        await deleteOnemliTarih(onemliTarihId);
      } else {
        // Eski yöntem (API bağlantısı yoksa)
        await deleteImportantDate(id);
      }
      
      setDates(dates.filter(date => date.id !== id));
      setMessage({ type: 'success', text: 'Tarih başarıyla silindi.' });
    } catch (error) {
      console.error("Tarih silme hatası:", error);
      setMessage({ type: 'error', text: 'Tarih silinirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTopicChange = (id: string, field: keyof MainTopic, value: any) => {
    setTopics(topics.map(topic => 
      topic.id === id ? { ...topic, [field]: value } : topic
    ));
    setHasChanges(true);
  };

  const handleTopicSubmit = async (id: string) => {
    try {
      setLoading(true);
      const topicToUpdate = topics.find(topic => topic.id === id);
      if (!topicToUpdate) return;
      
      // Aktif sempozyum ID'sini al
      const sempozyumId = await getAktifSempozyumId();
      console.log('Aktif Sempozyum ID:', sempozyumId);
      
      // Ana konuyu API üzerinden güncelliyoruz
      const anaKonuId = (topicToUpdate as any).anaKonuId;
      if (anaKonuId) {
        // Aktif sempozyum ID'sini ekle
        const topicWithSempozyumId = {
          ...topicToUpdate,
          sempozyumId: sempozyumId.toString()
        };
        
        const updated = await updateAnaKonu(anaKonuId.toString(), topicWithSempozyumId);
        // Güncellenmiş konuyu state'e yansıtıyoruz
        setTopics(topics.map(t => t.id === id ? { ...updated } : t));
      } else {
        // Eski yöntem kullanılamaz, API fonksiyonunu kullanmalıyız
        console.error("API entegrasyonu tamamlanmadı, anaKonuId bulunamadı");
        setMessage({ type: 'error', text: 'Ana konu güncellenirken bir hata oluştu: API entegrasyonu tamamlanmadı.' });
        return;
      }
      
      setMessage({ type: 'success', text: 'Ana konu başarıyla güncellendi.' });
      setHasChanges(false);
    } catch (error) {
      console.error("Ana konu güncelleme hatası:", error);
      setMessage({ type: 'error', text: 'Ana konu güncellenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewTopicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTopic({
      ...newTopic,
      [name]: value
    });
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTopic.title || !newTopic.description) {
      setMessage({ type: 'error', text: 'Lütfen tüm alanları doldurun.' });
      return;
    }

    try {
      setLoading(true);
      
      // Sempozyum ID'sini alıyoruz
      const sempozyumId = await getAktifSempozyumId();
      
      console.log('Yeni konu ekleniyor:', newTopic);
      console.log('Aktif Sempozyum ID:', sempozyumId);
      
      // API entegrasyonu: database.ts yerine API servisini kullanıyoruz
      const topicToSubmit = {
        ...newTopic,
        sempozyumId: sempozyumId.toString(),
        baslik: newTopic.title,
        aciklama: newTopic.description
      };
      
      const addedTopic = await createAnaKonu(topicToSubmit);
      
      console.log('Eklenen konu:', addedTopic);
      
      setTopics([...topics, addedTopic]);
      setNewTopic({
        title: '',
        description: '',
        icon: '',
        symposiumId: symposium?.id || 'sym2025'
      });
      setMessage({ type: 'success', text: 'Yeni konu başarıyla eklendi.' });
    } catch (error: any) {
      console.error("Konu ekleme hatası:", error);
      if (error.response) {
        console.error("API yanıtı:", error.response.data);
        setMessage({ type: 'error', text: `Konu eklenirken bir hata oluştu: ${error.response.data.error || error.message}` });
      } else {
        setMessage({ type: 'error', text: `Konu eklenirken bir hata oluştu: ${error.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Bu konuyu silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      
      // Silinecek konuyu bulalım
      const topicToDelete = topics.find(topic => topic.id === id);
      if (!topicToDelete) return;
      
      // API entegrasyonu: database.ts yerine API servisini kullanıyoruz
      const anaKonuId = (topicToDelete as any).anaKonuId;
      if (anaKonuId) {
        await deleteAnaKonu(anaKonuId);
      } else {
        // Eski yöntem kullanılamaz, API fonksiyonunu kullanmalıyız
        console.error("API entegrasyonu tamamlanmadı, anaKonuId bulunamadı");
        setMessage({ type: 'error', text: 'Konu silinirken bir hata oluştu: API entegrasyonu tamamlanmadı.' });
        return;
      }
      
      setTopics(topics.filter(topic => topic.id !== id));
      setMessage({ type: 'success', text: 'Konu başarıyla silindi.' });
    } catch (error) {
      console.error("Konu silme hatası:", error);
      setMessage({ type: 'error', text: 'Konu silinirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSponsorChange = (id: string, field: keyof Sponsor, value: any) => {
    setSponsors(sponsors.map(sponsor => 
      sponsor.id === id ? { ...sponsor, [field]: value } : sponsor
    ));
    setHasChanges(true);
  };

  // Sponsor düzenleme için state'ler
  const [editingSponsor, setEditingSponsor] = useState<string | null>(null);
  const [editFileMap, setEditFileMap] = useState<Map<string, File>>(new Map());
  const [editPreviewMap, setEditPreviewMap] = useState<Map<string, string>>(new Map());

  // Sponsor düzenleme için dosya seçimi
  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>, sponsorId: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Lütfen sadece resim dosyası seçin.' });
        return;
      }
      
      // Dosya boyutu kontrolü (2MB)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setMessage({ type: 'error', text: 'Dosya boyutu 2MB\'dan büyük olamaz.' });
        return;
      }
      
      // Yeni Map nesneleri oluştur (React state immutability için)
      const newFileMap = new Map(editFileMap);
      const newPreviewMap = new Map(editPreviewMap);
      
      // Haritaya dosyayı ekle
      newFileMap.set(sponsorId, file);
      
      // Önizleme URL'si oluştur
      const previewUrl = URL.createObjectURL(file);
      newPreviewMap.set(sponsorId, previewUrl);
      
      // State'leri güncelle
      setEditFileMap(newFileMap);
      setEditPreviewMap(newPreviewMap);
      setEditingSponsor(sponsorId);
      setHasChanges(true);
    }
  };

  // Mevcut bir sponsor için logo yükleme
  const uploadSponsorLogo = async (sponsorId: string): Promise<string> => {
    const file = editFileMap.get(sponsorId);
    if (!file) throw new Error('Dosya seçilmedi');
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Logo yüklenemedi');
      }
      
      const data = await response.json();
      setIsUploading(false);
      setUploadProgress(100);
      
      // Haritadan dosyayı temizle
      const newFileMap = new Map(editFileMap);
      newFileMap.delete(sponsorId);
      setEditFileMap(newFileMap);
      
      // Yüklenen dosyanın URL'sini döndür
      return data.fileUrl;
    } catch (error: any) {
      console.error('Logo yükleme hatası:', error);
      setMessage({ type: 'error', text: `Logo yüklenemedi: ${error.message}` });
      setIsUploading(false);
      setUploadProgress(0);
      throw error; // Hata durumunda dışarıya fırlat
    }
  };

  const handleSponsorSubmit = async (id: string) => {
    try {
      setLoading(true);
      const sponsorToUpdate = sponsors.find(sponsor => sponsor.id === id);
      if (!sponsorToUpdate) return;
      
      // Aktif sempozyum ID'sini al
      const sempozyumId = await getAktifSempozyumId();
      console.log('Aktif Sempozyum ID:', sempozyumId);
      
      // Eğer yeni bir dosya seçildiyse, önce onu yükle
      if (editFileMap.has(id)) {
        try {
          const logoUrl = await uploadSponsorLogo(id);
          // Logo URL'sini güncelle
          sponsorToUpdate.logo = logoUrl;
        } catch (error) {
          setMessage({ type: 'error', text: 'Logo yüklenemedi, lütfen tekrar deneyin.' });
          setLoading(false);
          return;
        }
      }
      
      // Sponsoru API üzerinden güncelliyoruz
      const sponsorId = (sponsorToUpdate as any).sponsorId;
      if (sponsorId) {
        // Include the sempozyumId parameter in the API call
        const updatedSponsor = await updateSponsorAPI(sponsorId, sponsorToUpdate, sempozyumId);
        // Güncellenmiş sponsoru state'e yansıtıyoruz
        setSponsors(sponsors.map(s => s.id === id ? { ...updatedSponsor } : s));
      } else {
        // Eski yöntem kullanılamaz, API fonksiyonunu kullanmalıyız
        console.error("API entegrasyonu tamamlanmadı, sponsorId bulunamadı");
        setMessage({ type: 'error', text: 'Sponsor güncellenirken bir hata oluştu: API entegrasyonu tamamlanmadı.' });
        return;
      }
      
      // Başarılı güncelleme sonrası temizlik
      if (editPreviewMap.has(id)) {
        const newPreviewMap = new Map(editPreviewMap);
        newPreviewMap.delete(id);
        setEditPreviewMap(newPreviewMap);
      }
      
      setEditingSponsor(null);
      setMessage({ type: 'success', text: 'Sponsor başarıyla güncellendi.' });
      setHasChanges(false);
    } catch (error) {
      console.error("Sponsor güncelleme hatası:", error);
      setMessage({ type: 'error', text: 'Sponsor güncellenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewSponsorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSponsor({
      ...newSponsor,
      [name]: value
    });
  };

  // Logo yükleme state'leri
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Logo dosyasını seç
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Lütfen sadece resim dosyası seçin.' });
        return;
      }
      
      // Dosya boyutu kontrolü (2MB)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setMessage({ type: 'error', text: 'Dosya boyutu 2MB\'dan büyük olamaz.' });
        return;
      }
      
      setSelectedFile(file);
      
      // Önizleme URL'si oluştur
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
    }
  };

  // Logo dosyasını yükle
  const uploadLogo = async (): Promise<string> => {
    if (!selectedFile) throw new Error('Dosya seçilmedi');
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Logo yüklenemedi');
      }
      
      const data = await response.json();
      setIsUploading(false);
      setUploadProgress(100);
      
      // Yüklenen dosyanın URL'sini döndür
      return data.fileUrl;
    } catch (error: any) {
      console.error('Logo yükleme hatası:', error);
      setMessage({ type: 'error', text: `Logo yüklenemedi: ${error.message}` });
      setIsUploading(false);
      setUploadProgress(0);
      throw error; // Hata durumunda dışarıya fırlat
    }
  };

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSponsor.name || !newSponsor.website) {
      setMessage({ type: 'error', text: 'Lütfen tüm alanları doldurun.' });
      return;
    }
    
    // Dosya seçildi mi kontrol et
    if (!selectedFile && !newSponsor.logo) {
      setMessage({ type: 'error', text: 'Lütfen bir logo seçin.' });
      return;
    }

    try {
      setLoading(true);
      
      // Eğer yeni bir dosya seçildiyse, önce onu yükle
      let finalLogo = newSponsor.logo;
      
      if (selectedFile) {
        try {
          finalLogo = await uploadLogo();
        } catch (error) {
          setMessage({ type: 'error', text: 'Logo yüklenemedi, lütfen tekrar deneyin.' });
          setLoading(false);
          return;
        }
      }
      
      // Sempozyum ID'sini alıyoruz
      const sempozyumId = await getAktifSempozyumId();
      
      console.log('Yeni sponsor ekleniyor:', { ...newSponsor, logo: finalLogo });
      console.log('Aktif Sempozyum ID:', sempozyumId);
      
      // API entegrasyonu: database.ts yerine API servisini kullanıyoruz
      const sponsorToSubmit = {
        ...newSponsor,
        logo: finalLogo
      };
      
      const addedSponsor = await createSponsorAPI(sponsorToSubmit, sempozyumId);
      
      console.log('Eklenen sponsor:', addedSponsor);
      
      setSponsors([...sponsors, addedSponsor]);
      setNewSponsor({
        name: '',
        logo: '',
        website: '',
        symposiumId: symposium?.id || 'sym2025'
      });
      setSelectedFile(null);
      setPreviewImage(null);
      setMessage({ type: 'success', text: 'Yeni sponsor başarıyla eklendi.' });
    } catch (error: any) {
      console.error("Sponsor ekleme hatası:", error);
      if (error.response) {
        console.error("API yanıtı:", error.response.data);
        setMessage({ type: 'error', text: `Sponsor eklenirken bir hata oluştu: ${error.response.data.error || error.message}` });
      } else {
        setMessage({ type: 'error', text: `Sponsor eklenirken bir hata oluştu: ${error.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    if (!confirm('Bu sponsoru silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      
      // Silinecek sponsoru bulalım
      const sponsorToDelete = sponsors.find(sponsor => sponsor.id === id);
      if (!sponsorToDelete) return;
      
      // API entegrasyonu: database.ts yerine API servisini kullanıyoruz
      const sponsorId = (sponsorToDelete as any).sponsorId;
      if (sponsorId) {
        await deleteSponsorAPI(sponsorId);
      } else {
        // Eski yöntem kullanılamaz, API fonksiyonunu kullanmalıyız
        console.error("API entegrasyonu tamamlanmadı, sponsorId bulunamadı");
        setMessage({ type: 'error', text: 'Sponsor silinirken bir hata oluştu: API entegrasyonu tamamlanmadı.' });
        return;
      }
      
      setSponsors(sponsors.filter(sponsor => sponsor.id !== id));
      setMessage({ type: 'success', text: 'Sponsor başarıyla silindi.' });
    } catch (error) {
      console.error("Sponsor silme hatası:", error);
      setMessage({ type: 'error', text: 'Sponsor silinirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = useCallback((page: string) => {
    if (hasChanges) {
      if (confirm('Kaydedilmemiş değişiklikleriniz var. Sayfadan çıkmak istediğinizden emin misiniz?')) {
        setActivePage(page);
        router.push(`/admin/homepage?page=${page}`);
        setHasChanges(false);
      }
    } else {
      setActivePage(page);
      router.push(`/admin/homepage?page=${page}`);
    }
  }, [hasChanges, router]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/admin/homepage?page=${activePage}&tab=${tab}`);
  };

  const handleAboutPageChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!aboutPageContent) return;
    
    const { name, value } = e.target;
    setAboutPageContent({
      ...aboutPageContent,
      [name]: value
    });
    setHasChanges(true);
  };

  const handleAboutPageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aboutPageContent) return;

    try {
      setLoading(true);
      await updatePageContent('homepage', '1', {
        title: aboutPageContent.title,
        content: aboutPageContent.content
      });
      setMessage({ type: 'success', text: 'Hakkımızda sayfası başarıyla güncellendi.' });
      setHasChanges(false);
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      setMessage({ type: 'error', text: 'Hakkımızda sayfası güncellenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  // Paper Topics için yeni handler'lar
  const handleNewPaperTopicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPaperTopic({
      ...newPaperTopic,
      [name]: value
    });
  };

  const handleAddPaperTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPaperTopic.title || !newPaperTopic.mainTopicId) {
      setMessage({ type: 'error', text: 'Lütfen başlık ve ana konu alanlarını doldurun.' });
      return;
    }

    try {
      setLoading(true);
      console.log('Bildiri konusu ekleniyor:', newPaperTopic);
      
      // Aktif sempozyum ID'sini al
      const sempozyumId = await getAktifSempozyumId();
      console.log('Aktif Sempozyum ID:', sempozyumId);
      
      // API entegrasyonu: database.ts yerine API servisini kullanıyoruz
      const paperTopicToSubmit = {
        ...newPaperTopic,
        sempozyumId: sempozyumId.toString()
      };
      
      const addedTopic = await createBildiriKonusu(paperTopicToSubmit);
      console.log('Eklenen bildiri konusu:', addedTopic);
      
      setPaperTopics([...paperTopics, addedTopic]);
      setNewPaperTopic({
        title: '',
        description: '',
        mainTopicId: '',
        symposiumId: sempozyumId.toString()
      });
      setMessage({ type: 'success', text: 'Bildiri konusu başarıyla eklendi.' });
    } catch (error: any) {
      console.error("Bildiri konusu eklenirken hata oluştu:", error);
      if (error.response) {
        console.error("API yanıtı:", error.response.data);
        setMessage({ type: 'error', text: `Bildiri konusu eklenirken bir hata oluştu: ${error.response.data.error || error.message}` });
      } else {
        setMessage({ type: 'error', text: `Bildiri konusu eklenirken bir hata oluştu: ${error.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditPaperTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaperTopic) return;

    try {
      setLoading(true);
      console.log('Bildiri konusu güncelleniyor:', editingPaperTopic);
      
      // Aktif sempozyum ID'sini al
      const sempozyumId = await getAktifSempozyumId();
      console.log('Aktif Sempozyum ID:', sempozyumId);
      
      // bildiriKonusuId'yi kontrol et (API tarafından eklenen)
      const bildiriKonusuId = (editingPaperTopic as any).bildiriKonusuId;
      if (bildiriKonusuId) {
        // Aktif sempozyum ID'si ile güncelle
        const paperTopicWithSempozyumId = {
          ...editingPaperTopic,
          sempozyumId: sempozyumId.toString()
        };
        
        // API entegrasyonu: database.ts yerine API servisini kullanıyoruz
        const updatedTopic = await updateBildiriKonusu(bildiriKonusuId, paperTopicWithSempozyumId);
        console.log('Güncellenen bildiri konusu:', updatedTopic);
        
        setPaperTopics(paperTopics.map(topic => 
          topic.id === updatedTopic.id ? updatedTopic : topic
        ));
      } else {
        // Eski yöntem (API bağlantısı yoksa)
        const updatedTopic = await updatePaperTopic(editingPaperTopic.id, editingPaperTopic);
        setPaperTopics(paperTopics.map(topic => 
          topic.id === updatedTopic.id ? updatedTopic : topic
        ));
      }
      
      setEditingPaperTopic(null);
      setMessage({ type: 'success', text: 'Bildiri konusu başarıyla güncellendi.' });
    } catch (error: any) {
      console.error("Bildiri konusu güncellenirken hata oluştu:", error);
      if (error.response) {
        console.error("API yanıtı:", error.response.data);
        setMessage({ type: 'error', text: `Bildiri konusu güncellenirken bir hata oluştu: ${error.response.data.error || error.message}` });
      } else {
        setMessage({ type: 'error', text: `Bildiri konusu güncellenirken bir hata oluştu: ${error.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaperTopic = async (id: string) => {
    if (!confirm('Bu bildiri konusunu silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      console.log('Bildiri konusu siliniyor:', id);
      
      // Silinecek bildiri konusunu bulalım
      const topicToDelete = paperTopics.find(topic => topic.id === id);
      if (!topicToDelete) return;
      
      // bildiriKonusuId'yi kontrol et (API tarafından eklenen)
      const bildiriKonusuId = (topicToDelete as any).bildiriKonusuId;
      if (bildiriKonusuId) {
        // API entegrasyonu: database.ts yerine API servisini kullanıyoruz
        await deleteBildiriKonusu(bildiriKonusuId);
      } else {
        // Eski yöntem (API bağlantısı yoksa)
        await deletePaperTopic(id);
      }
      
      setPaperTopics(paperTopics.filter(topic => topic.id !== id));
      setMessage({ type: 'success', text: 'Bildiri konusu başarıyla silindi.' });
    } catch (error: any) {
      console.error("Bildiri konusu silinirken hata oluştu:", error);
      if (error.response) {
        console.error("API yanıtı:", error.response.data);
        setMessage({ type: 'error', text: `Bildiri konusu silinirken bir hata oluştu: ${error.response.data.error || error.message}` });
      } else {
        setMessage({ type: 'error', text: `Bildiri konusu silinirken bir hata oluştu: ${error.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  // Sayfadaki verileri yükle
  const loadData = async () => {
    try {
      setLoading(true);
      logDebug('Veriler yeniden yükleniyor...');
      
      // Token var mı kontrol et
      const token = localStorage.getItem('token');
      logDebug(`🔑 Token kontrolü: ${!!token}`);
      
      // Aktif sayfaya göre ilgili verileri yükle
      if (pageParam === 'home') {
        if (tabParam === 'general') {
          logDebug('Genel bilgiler yükleniyor...');
          try {
            const symposiumData = await getAktifGenelBilgiler();
            logDebug(`Genel bilgiler yüklendi: ${JSON.stringify(symposiumData, null, 2)}`);
            setSymposium(symposiumData);
          } catch (error) {
            logDebug(`Genel bilgileri yüklerken hata: ${error}`);
            // Eğer genel bilgiler yoksa varsayılan bir değer oluştur
            const defaultSymposium: SymposiumInfo & { genelBilgilerId: number } = {
              id: '1',
              title: '',
              subtitle: '',
              dates: '',
              countdownDate: new Date().toISOString(),
              description: '',
              longDescription: '',
              venue: '',
              organizer: '',
              year: new Date().getFullYear(),
              isActive: true,
              docentlikInfo: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              genelBilgilerId: 0
            };
            setSymposium(defaultSymposium);
          }
        } else if (tabParam === 'dates') {
          logDebug('Önemli tarihler yükleniyor...');
          try {
            const datesData = await getAktifOnemliTarihler();
            setDates(datesData);
          } catch (error) {
            logDebug(`Önemli tarihleri yüklerken hata: ${error}`);
            setDates([]);
          }
        } else if (tabParam === 'topics') {
          logDebug('Ana konular yükleniyor...');
          try {
            const topicsData = await getAktifAnaKonular();
            
            // Eğer boş dizi döndüyse ve aktif sempozyum kontrolü yapmamız gerekiyorsa
            if (topicsData.length === 0) {
              // Aktif sempozyum var mı kontrol et
              const { sempozyumService } = await import('@/lib/services');
              const aktifSempozyum = await sempozyumService.getAktifSempozyum();
              
              if (!aktifSempozyum) {
                // Aktif sempozyum yoksa uyarı mesajı göster
                setMessage({ type: 'warning', text: 'Aktif sempozyum bulunamadı. Lütfen önce aktif bir sempozyum oluşturun.' });
              } else {
                // Aktif sempozyum var ama veri yok
                logDebug(`Aktif sempozyum (ID: ${aktifSempozyum.id}) için ana konu bulunamadı`);
              }
            }
            
            setTopics(topicsData);
          } catch (error) {
            logDebug(`Ana konuları yüklerken hata: ${error}`);
            setTopics([]);
          }
        } else if (tabParam === 'sponsors') {
          logDebug('Sponsorlar yükleniyor...');
          try {
            const sponsorsData = await getAktifSponsorlar();
            setSponsors(sponsorsData);
          } catch (error) {
            logDebug(`Sponsorları yüklerken hata: ${error}`);
            setSponsors([]);
          }
        } else if (tabParam === 'about') {
          logDebug('Hakkında sayfası içeriği yükleniyor...');
          try {
            const aboutContent = await getPageContent('about');
            setAboutPageContent(aboutContent);
          } catch (error) {
            logDebug(`Hakkında sayfası içeriğini yüklerken hata: ${error}`);
            setAboutPageContent(null);
          }
        }
      } else if (pageParam === 'paper-topics') {
        logDebug('Bildiri konuları yükleniyor...');
        try {
          const bildiriKonulari = await getBildiriKonulari();
          
          // Eğer boş dizi döndüyse ve aktif sempozyum kontrolü yapmamız gerekiyorsa
          if (bildiriKonulari.length === 0) {
            // Aktif sempozyum var mı kontrol et
            const { sempozyumService } = await import('@/lib/services');
            const aktifSempozyum = await sempozyumService.getAktifSempozyum();
            
            if (!aktifSempozyum) {
              // Aktif sempozyum yoksa uyarı mesajı göster
              setMessage({ type: 'warning', text: 'Aktif sempozyum bulunamadı. Lütfen önce aktif bir sempozyum oluşturun.' });
            } else {
              // Aktif sempozyum var ama veri yok
              logDebug(`Aktif sempozyum (ID: ${aktifSempozyum.id}) için bildiri konusu bulunamadı`);
              
              // Ana konular da yükle
              const anaKonular = await getAktifAnaKonular();
              if (anaKonular.length === 0) {
                // Ana konu yoksa uyarı göster
                setMessage({ type: 'warning', text: 'Bildiri konusu eklemek için önce ana konu eklemelisiniz.' });
              }
            }
          }
          
          setPaperTopics(bildiriKonulari);
        } catch (error) {
          logDebug(`Bildiri konularını yüklerken hata: ${error}`);
          setPaperTopics([]);
        }
      }
      
      setMessage({ type: '', text: '' }); // Mesajı temizle
    } catch (error) {
      console.error("Veri yüklenirken hata oluştu:", error);
      setMessage({ type: 'error', text: 'Veriler yüklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !symposium) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Site Ayarları</h1>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}
      
      {/* Ana Sayfa Navigasyonu */}
      <div className="mb-6">
        <div className="bg-gray-100 rounded-lg p-2">
          <nav className="flex flex-wrap">
            <button
              onClick={() => handlePageChange('home')}
              className={`py-2 px-4 font-medium text-sm rounded-md mr-2 mb-2 ${activePage === 'home' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
            >
              Anasayfa
            </button>
            <button
              onClick={() => handlePageChange('paper-topics')}
              className={`py-2 px-4 font-medium text-sm rounded-md mr-2 mb-2 ${activePage === 'paper-topics' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
            >
              Bildiri Konuları
            </button>
          </nav>
        </div>
      </div>
      
      {/* Anasayfa Sekmeleri */}
      {activePage === 'home' && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange('general')}
                className={`py-4 px-6 font-medium text-sm ${activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Genel Bilgiler
              </button>
              <button
                onClick={() => handleTabChange('dates')}
                className={`py-4 px-6 font-medium text-sm ${activeTab === 'dates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Önemli Tarihler
              </button>
              <button
                onClick={() => handleTabChange('topics')}
                className={`py-4 px-6 font-medium text-sm ${activeTab === 'topics' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Ana Konular
              </button>
              <button
                onClick={() => handleTabChange('sponsors')}
                className={`py-4 px-6 font-medium text-sm ${activeTab === 'sponsors' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sponsorlar
              </button>
            </nav>
          </div>
        </div>
      )}
      
      {/* Anasayfa İçeriği */}
      {activePage === 'home' && (
        <>
          {/* Genel Bilgiler */}
          {activeTab === 'general' && symposium && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Sempozyum Genel Bilgileri</h2>
              <form onSubmit={handleSymposiumSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sempozyum Başlığı</label>
                  <input
                    type="text"
                    name="title"
                    value={symposium.title}
                    onChange={handleSymposiumChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Örn: Uluslararası Bilim ve Teknoloji Sempozyumu"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt Başlık</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={symposium.subtitle}
                    onChange={handleSymposiumChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Örn: Bilim ve Teknoloji"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarihler</label>
                  <input
                    type="text"
                    name="dates"
                    value={symposium.dates}
                    onChange={handleSymposiumChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Örn: 15-20 Haziran 2024"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geri Sayım Tarihi (ISO formatında)</label>
                  <input
                    type="datetime-local"
                    name="countdownDate"
                    value={symposium.countdownDate.substring(0, 16)}
                    onChange={handleSymposiumChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yer</label>
                  <input
                    type="text"
                    name="venue"
                    value={symposium.venue}
                    onChange={handleSymposiumChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Örn: İstanbul, Türkiye"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organizatör</label>
                  <input
                    type="text"
                    name="organizer"
                    value={symposium.organizer}
                    onChange={handleSymposiumChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Örn: Örnek Üniversitesi"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kısa Açıklama</label>
                  <textarea
                    name="description"
                    value={symposium.description}
                    onChange={handleSymposiumChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Sempozyum hakkında kısa bilgi verin"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uzun Açıklama</label>
                  <textarea
                    name="longDescription"
                    value={symposium.longDescription}
                    onChange={handleSymposiumChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={5}
                    placeholder="Sempozyum hakkında detaylı bilgi verin"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doçentlik Bilgisi</label>
                  <textarea
                    name="docentlikInfo"
                    value={symposium.docentlikInfo}
                    onChange={handleSymposiumChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Örn: Bu sempozyum doçentlik başvurularında geçerlidir."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yıl</label>
                  <input
                    type="number"
                    name="year"
                    value={symposium.year}
                    onChange={handleSymposiumChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder={new Date().getFullYear().toString()}
                    required
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    disabled={loading}
                  >
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Önemli Tarihler */}
          {activeTab === 'dates' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Önemli Tarihler</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-medium mb-4">Yeni Tarih Ekle</h3>
                <form onSubmit={handleAddDate} className="space-y-4 bg-gray-50 p-4 rounded-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                    <input
                      type="text"
                      name="title"
                      value={newDate.title}
                      onChange={handleNewDateChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                    <input
                      type="datetime-local"
                      name="date"
                      value={formatDateForInput(newDate.date)}
                      onChange={handleNewDateChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isCompleted"
                      checked={newDate.isCompleted}
                      onChange={handleNewDateChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">Tamamlandı</label>
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                      disabled={loading}
                    >
                      {loading ? 'Ekleniyor...' : 'Ekle'}
                    </button>
                  </div>
                </form>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Mevcut Tarihler</h3>
              <div className="space-y-4">
                {dates.map((date) => (
                  <div key={date.id} className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                        <input
                          type="text"
                          value={date.title}
                          onChange={(e) => handleDateChange(date.id, 'title', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                        <input
                          type="datetime-local"
                          value={formatDateForInput(date.date)}
                          onChange={(e) => handleDateChange(date.id, 'date', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={date.isCompleted}
                          onChange={(e) => handleDateChange(date.id, 'isCompleted', e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">Tamamlandı</label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleDateSubmit(date.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                        disabled={loading}
                      >
                        Güncelle
                      </button>
                      <button
                        onClick={() => handleDeleteDate(date.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                        disabled={loading}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Ana Konular */}
          {activeTab === 'topics' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Ana Konular</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-medium mb-4">Yeni Konu Ekle</h3>
                <form onSubmit={handleAddTopic} className="space-y-4 bg-gray-50 p-4 rounded-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                    <input
                      type="text"
                      name="title"
                      value={newTopic.title}
                      onChange={handleNewTopicChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <textarea
                      name="description"
                      value={newTopic.description}
                      onChange={handleNewTopicChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                      required
                    />
                  </div>
                  
                  
                  <div>
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                      disabled={loading}
                    >
                      {loading ? 'Ekleniyor...' : 'Ekle'}
                    </button>
                  </div>
                </form>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Mevcut Konular</h3>
              <div className="space-y-4">
                {topics.map((topic) => (
                  <div key={topic.id} className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                        <input
                          type="text"
                          value={topic.title}
                          onChange={(e) => handleTopicChange(topic.id, 'title', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea
                          value={topic.description}
                          onChange={(e) => handleTopicChange(topic.id, 'description', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleTopicSubmit(topic.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                        disabled={loading}
                      >
                        Güncelle
                      </button>
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                        disabled={loading}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Sponsorlar */}
          {activeTab === 'sponsors' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Sponsorlar</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-medium mb-4">Yeni Sponsor Ekle</h3>
                <form onSubmit={handleAddSponsor} className="space-y-4 bg-gray-50 p-4 rounded-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Adı</label>
                    <input
                      type="text"
                      name="name"
                      value={newSponsor.name}
                      onChange={handleNewSponsorChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                    <div className="mt-1 flex flex-col space-y-2">
                      {previewImage && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-500 mb-1">Önizleme:</p>
                          <div className="w-32 h-20 relative bg-gray-100 rounded border border-gray-300">
                            <Image
                              src={previewImage}
                              alt="Logo önizleme"
                              fill
                              style={{ objectFit: 'contain' }}
                              className="p-1"
                            />
                          </div>
                        </div>
                      )}
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                      />
                      
                      {isUploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Web Sitesi</label>
                    <input
                      type="url"
                      name="website"
                      value={newSponsor.website}
                      onChange={handleNewSponsorChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="https://www.example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                      disabled={loading || isUploading}
                    >
                      {loading || isUploading ? 
                        (isUploading ? 'Logo Yükleniyor...' : 'Ekleniyor...') : 
                        'Ekle'}
                    </button>
                  </div>
                </form>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Mevcut Sponsorlar</h3>
              <div className="space-y-4">
                {sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Adı</label>
                        <input
                          type="text"
                          value={sponsor.name}
                          onChange={(e) => handleSponsorChange(sponsor.id, 'name', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                        <div className="flex items-center space-x-4 mb-2">
                          {/* Mevcut logo önizlemesi */}
                          <div className="w-20 h-10 relative bg-gray-100 rounded">
                            {sponsor.logo && (
                              <Image 
                                src={sponsor.logo} 
                                alt={sponsor.name} 
                                fill
                                style={{ objectFit: 'contain' }}
                                className="p-1"
                              />
                            )}
                          </div>
                          
                          {/* Yeni logo önizlemesi (varsa) */}
                          {editPreviewMap.has(sponsor.id) && (
                            <div className="w-20 h-10 relative bg-gray-100 rounded border-2 border-blue-400">
                              <Image 
                                src={editPreviewMap.get(sponsor.id) || ''}
                                alt="Yeni logo"
                                fill
                                style={{ objectFit: 'contain' }}
                                className="p-1"
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Dosya yükleme alanı */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEditFileSelect(e, sponsor.id)}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        />
                        
                        {isUploading && editingSponsor === sponsor.id && (
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-20 h-10 relative bg-gray-100 rounded">
                        {sponsor.logo && (
                          <Image 
                            src={sponsor.logo} 
                            alt={sponsor.name} 
                            fill
                            style={{ objectFit: 'contain' }}
                            className="p-1"
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleSponsorSubmit(sponsor.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                        disabled={loading || (isUploading && editingSponsor === sponsor.id)}
                      >
                        {isUploading && editingSponsor === sponsor.id ? 'Logo Yükleniyor...' : 'Güncelle'}
                      </button>
                      <button
                        onClick={() => handleDeleteSponsor(sponsor.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                        disabled={loading || (isUploading && editingSponsor === sponsor.id)}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Bildiri Konuları İçeriği */}
      {activePage === 'paper-topics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sol Taraf - Konu Ekleme/Düzenleme Formu */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">
                {editingPaperTopic ? 'Bildiri Konusu Düzenle' : 'Yeni Bildiri Konusu Ekle'}
              </h2>
              
              <form onSubmit={editingPaperTopic ? handleEditPaperTopic : handleAddPaperTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ana Konu</label>
                  <select
                    name="mainTopicId"
                    value={editingPaperTopic ? editingPaperTopic.mainTopicId : newPaperTopic.mainTopicId}
                    onChange={editingPaperTopic ? (e) => setEditingPaperTopic({...editingPaperTopic, mainTopicId: e.target.value}) : handleNewPaperTopicChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Ana Konu Seçin</option>
                    {topics.map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.title}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                  <input
                    type="text"
                    name="title"
                    value={editingPaperTopic ? editingPaperTopic.title : newPaperTopic.title}
                    onChange={editingPaperTopic ? (e) => setEditingPaperTopic({...editingPaperTopic, title: e.target.value}) : handleNewPaperTopicChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    name="description"
                    value={editingPaperTopic ? editingPaperTopic.description : newPaperTopic.description}
                    onChange={editingPaperTopic ? (e) => setEditingPaperTopic({...editingPaperTopic, description: e.target.value}) : handleNewPaperTopicChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={4}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className={`${editingPaperTopic ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded`}
                    disabled={loading}
                  >
                    {loading ? 'İşleniyor...' : editingPaperTopic ? 'Güncelle' : 'Ekle'}
                  </button>
                  
                  {editingPaperTopic && (
                    <button
                      type="button"
                      onClick={() => setEditingPaperTopic(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                    >
                      İptal
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
          
          {/* Sağ Taraf - Konular Listesi */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Bildiri Konuları</h2>
                
                <div>
                  <select
                    value={selectedMainTopic || ''}
                    onChange={(e) => setSelectedMainTopic(e.target.value || null)}
                    className="p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Tüm Ana Konular</option>
                    {topics.map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {paperTopics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Başlık
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ana Konu
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Açıklama
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paperTopics
                        .filter(topic => !selectedMainTopic || topic.mainTopicId === selectedMainTopic)
                        .map(topic => (
                        <tr key={topic.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{topic.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {topics.find(t => t.id === topic.mainTopicId)?.title || 'Bilinmeyen Ana Konu'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 truncate max-w-xs">{topic.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setEditingPaperTopic(topic)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleDeletePaperTopic(topic.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">
                    {selectedMainTopic
                      ? 'Seçilen ana konuya ait bildiri konusu bulunmamaktadır.'
                      : 'Henüz bildiri konusu eklenmemiş.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Değişiklik Uyarısı */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span>Kaydedilmemiş değişiklikleriniz var!</span>
          </div>
        </div>
      )}
    </div>
  );
}