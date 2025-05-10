'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { userService } from '@/lib/services';
import apiClient from '@/lib/apiClient';
import { bildiriService } from '@/lib/services';
import { sempozyumService } from '@/lib/services';
import { revizeService } from '@/lib/services/revize.service';
import { revizeGecmisiService } from '@/lib/services/revize-gecmisi.service';
import { getBildiriKonulari } from '@/lib/services/bildiri-konusu.service';

// Paper interface'ini tanımlayalım
interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  paperTopicId: string;
  paperTopicTitle: string;
  mainTopicId: string;
  status: string;
  submissionDate: string;
  hakemIds: number[];
  reviewers: string[];
  dokuman?: string;
}

interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

// Revizyon detayları için interface
interface RevizeDetay {
  id?: number;
  gucluYonler?: string;
  zayifYonler?: string;
  genelYorum?: string;
  hakemId?: number;
  hakemAdi?: string;
  durum?: string;
  guvenSeviyesi?: number;
  createdAt?: string;
  updatedAt?: string;
  makaleTuru?: string;
  makaleBasligi?: string;
  soyut?: string;
  anahtarKelimeler?: string;
  giris?: string;
  gerekcelerVeYontemler?: string;
  sonuclarVeTartismalar?: string;
  referanslar?: string;
  guncellikVeOzgunluk?: string;
  sempozyumId?: number;
  bildiriId?: number;
  revizeTarihi?: string; // RevizeGecmisi tablosundan gelen alan
}

export default function AdminPapers() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [isReviewerModalOpen, setIsReviewerModalOpen] = useState(false);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [availableReviewers, setAvailableReviewers] = useState<string[]>([]);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });
  const [reviewers, setReviewers] = useState<string[]>([]);
  const [reviewerInfo, setReviewerInfo] = useState<Array<{id: number, name: string, email: string, expertise?: string[]}>>([]);
  const [reviewerSearchTerm, setReviewerSearchTerm] = useState<string>('');
  const [aktifSempozyumId, setAktifSempozyumId] = useState<number | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPaper, setPreviewPaper] = useState<Paper | null>(null);
  const [revizyonDetaylari, setRevizyonDetaylari] = useState<RevizeDetay[]>([]);
  const [revizyonYukleniyor, setRevizyonYukleniyor] = useState(false);
  
  // Admin kontrolü
  const isAdmin = user?.role === 'admin';
  
  // Admin değilse ana sayfaya yönlendir
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/');
      return;
    }

    // Aktif sempozyumu getir
    getAktifSempozyum();
    
    // API'den hakemleri çek
    fetchReviewers();
    
    // Sayfa her odaklandığında bildiri durumlarını yenile
    const handleFocus = () => {
      console.log('Sayfa odaklandı, bildiri durumları yenileniyor...');
      if (aktifSempozyumId) {
        fetchPapers(aktifSempozyumId);
      } else {
        getAktifSempozyum();
      }
    };
    
    // Sayfa yüklendiğinde ve her görünür olduğunda yenile
    window.addEventListener('focus', handleFocus);
    
    // Temizleme fonksiyonu
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, isAdmin, router, aktifSempozyumId]);

  // Aktif sempozyumu otomatik yenileme için useEffect - 60 saniyelik interval
  // useEffect(() => {
  //   // Eğer aktif sempozyum ID varsa, 60 saniyede bir yenile
  //   if (aktifSempozyumId) {
  //     console.log('Otomatik yenileme başlatıldı (60 saniye)');
  //     
  //     const interval = setInterval(() => {
  //       console.log('60 saniye doldu, veriler yenileniyor...');
  //       fetchPapers(aktifSempozyumId);
  //     }, 60000); // 60 saniye
  //     
  //     // Temizleme fonksiyonu
  //     return () => {
  //       console.log('Otomatik yenileme interval durduruldu');
  //       clearInterval(interval);
  //     };
  //   }
  // }, [aktifSempozyumId]);
  
  // Aktif sempozyumu getir
  const getAktifSempozyum = async () => {
    try {
      const aktifSempozyum = await sempozyumService.getAktifSempozyum();
      if (aktifSempozyum) {
        setAktifSempozyumId(aktifSempozyum.id);
        console.log('Aktif sempozyum ID:', aktifSempozyum.id);
        fetchPapers(aktifSempozyum.id);
      } else {
        setMessage({
          type: 'error',
          text: 'Aktif sempozyum bulunamadı. Lütfen önce bir sempozyumu aktif hale getirin.'
        });
        setPapers([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Aktif sempozyum getirme hatası:', error);
      setMessage({
        type: 'error',
        text: 'Aktif sempozyum bilgisi alınamadı. Lütfen sayfayı yenileyin.'
      });
      setLoading(false);
    }
  };

  // API'den hakemleri çek
  const fetchReviewers = async () => {
    setLoading(true);
    try {
      console.log('🔍 Hakemler getiriliyor...');
      
      // Hata mesajını temizle
      setMessage({ type: '', text: '' });
      
      // /api/users yerine /kullanici/hakemler endpointini kullanalım
      const reviewerUsers = await userService.getReviewers();
      
      console.log('📊 API Yanıtı - Tüm hakemler:', JSON.stringify(reviewerUsers));
      
      if (!reviewerUsers || reviewerUsers.length === 0) {
        console.warn('⚠️ API yanıtı boş veya undefined. Hakem bulunamadı!');
        setMessage({
          type: 'error',
          text: 'Veritabanında hakem rolüne sahip kullanıcı bulunamadı! Lütfen önce hakem ekleyin.'
        });
        setReviewers([]);
        setReviewerInfo([]);
        return;
      }
      
      // API'den gelen hakem verilerini işle
      const reviewerNames = reviewerUsers.map(reviewer => {
        if (!reviewer || !reviewer.ad || !reviewer.soyad) {
          console.warn('Eksik hakem bilgisi:', reviewer);
          return null;
        }
        
        // Hakem yeteneklerini tüm detayıyla konsola yazdır
        console.log(`Ham hakem bilgisi (${reviewer.ad} ${reviewer.soyad}):`, JSON.stringify(reviewer, null, 2));
        
        // hakem_yetenekleri alanının doğrudan içeriğini kontrol et
        if ((reviewer as any).hakem_yetenekleri) {
          console.log(`🏆🏆🏆 Hakem ${reviewer.ad} ${reviewer.soyad} için hakem_yetenekleri MEVCUT!`);
          console.log(` - Ham değer:`, (reviewer as any).hakem_yetenekleri);
          console.log(` - Tipi:`, typeof (reviewer as any).hakem_yetenekleri);
          console.log(` - JSON ise:`, JSON.stringify((reviewer as any).hakem_yetenekleri));
        } else {
          console.warn(`⚠️ Hakem ${reviewer.ad} ${reviewer.soyad} için hakem_yetenekleri BULUNAMADI!`);
          
          // Alternatif alanlarda da yoksa tam olarak boş dönüyordur
          console.warn(`  Olası alanları kontrol ediyorum...`);
          
          if ((reviewer as any).yetenekler) {
            console.log(`  ✓ Hakem ${reviewer.ad} ${reviewer.soyad} için yetenekler MEVCUT!`, (reviewer as any).yetenekler);
          }
          
          if ((reviewer as any).expertise) {
            console.log(`  ✓ Hakem ${reviewer.ad} ${reviewer.soyad} için expertise MEVCUT!`, (reviewer as any).expertise);
          }
          
          // Hakem nesnesini tam olarak incele - belki farklı bir anahtar kullanılıyor
          const possibleFields = Object.keys(reviewer);
          console.log(`  Mevcut tüm alanlar:`, possibleFields);
          
          // yeteneklerle ilgili anahtar kelimeleri içeren alanları ara
          const potentialExpertiseFields = possibleFields.filter(field => 
            field.includes('yetenekler') || 
            field.includes('expertise') || 
            field.includes('hakem') || 
            field.includes('uzman') || 
            field.includes('alan')
          );
          
          if (potentialExpertiseFields.length > 0) {
            console.log(`  Potansiyel yetenek alanları:`, potentialExpertiseFields);
            potentialExpertiseFields.forEach(field => {
              console.log(`    ${field}:`, (reviewer as any)[field]);
            });
          }
        }
        
        // Hakem yetenekleri için tüm olası alanları kontrol edelim
        const hakemYetenekleri = (reviewer as any).hakem_yetenekleri || 
                               (reviewer as any).yetenekler || 
                               (reviewer as any).expertise || 
                               (reviewer as any).hakem?.yetenekler || 
                               null;
        
        console.log(`Hakem yetenekleri detaylı (${reviewer.ad} ${reviewer.soyad}):`, 
           hakemYetenekleri,
           typeof hakemYetenekleri, 
           Array.isArray(hakemYetenekleri) ? 'Array': 'Not Array');
        
        // Yetenekleri işlemek için
        let expertiseArray = [];
        try {
          if (hakemYetenekleri) {
            if (typeof hakemYetenekleri === 'string') {
              // String olarak gelmiş olabilir, JSON parse deneyelim
              console.log(`${reviewer.ad} için JSON string:`, hakemYetenekleri);
              
              try {
                expertiseArray = JSON.parse(hakemYetenekleri);
                console.log(`${reviewer.ad} için JSON.parse sonrası yetenekler:`, expertiseArray);
              } catch (parseError) {
                // JSON parse başarısız olursa, virgülle ayırma deneyelim
                console.warn(`${reviewer.ad} için JSON parse hatası, virgülle ayrılmış olabilir:`, parseError);
                expertiseArray = hakemYetenekleri.split(',').map(item => item.trim());
                console.log(`${reviewer.ad} için virgülle ayrılmış yetenekler:`, expertiseArray);
              }
            } else if (Array.isArray(hakemYetenekleri)) {
              // Zaten dizi ise doğrudan kullan
              expertiseArray = hakemYetenekleri;
              console.log(`${reviewer.ad} için array yetenekler:`, expertiseArray);
            } else if (typeof hakemYetenekleri === 'object') {
              // Eğer bir obje ise içindeki değerleri alıp diziye dönüştürelim
              expertiseArray = Object.values(hakemYetenekleri);
              console.log(`${reviewer.ad} için object yetenekler:`, expertiseArray);
            }
            
            // Eğer hala boş geliyorsa, direk string olarak vermeyi deneyelim
            if (expertiseArray.length === 0 && hakemYetenekleri) {
              expertiseArray = [String(hakemYetenekleri)];
              console.log(`${reviewer.ad} için string olarak yetenekler:`, expertiseArray);
            }
          } else {
            console.warn(`${reviewer.ad} ${reviewer.soyad} için yetenekler bulunamadı`);
          }
        } catch (e) {
          console.error(`${reviewer.ad} için hakem yetenekleri işleme hatası:`, e);
          expertiseArray = [];
        }
        
        // API yanıtı hakkında daha detaylı bilgi
        console.log(`${reviewer.ad} ${reviewer.soyad} işlenmiş yetenekler (${expertiseArray.length}):`, expertiseArray);
        
        return {
          id: reviewer.id,
          name: `${reviewer.unvan || ''} ${reviewer.ad} ${reviewer.soyad}`.trim(),
          email: reviewer.eposta,
          expertise: expertiseArray
        };
      }).filter(Boolean) as Array<{id: number, name: string, email: string, expertise?: string[]}>; // null değerleri filtrele
      
      // Her bir hakem için uzmanlık bilgilerini logla
      reviewerNames.forEach(reviewer => {
        console.log(`İşlenmiş Hakem: ${reviewer.name}, Uzmanlık alanları (${reviewer.expertise?.length || 0}):`, reviewer.expertise);
      });
      
      if (reviewerNames.length === 0) {
        console.warn('⚠️ Filtreleme sonrası hiç hakem bulunamadı. Ad/soyad değerleri eksik olabilir.');
        setMessage({
          type: 'error',
          text: 'Hakem bilgileri eksik veya hatalı formatta. Lütfen kullanıcı bilgilerini kontrol edin.'
        });
      } else {
        console.log('✅ İşlenen hakem verileri:', reviewerNames);
      }
      
      // Hem isim listesini hem de detaylı bilgiyi saklayalım
      setReviewers(reviewerNames.map(r => r.name));
      setReviewerInfo(reviewerNames);
      
      console.log('📝 Hakem sayısı:', reviewerNames.length);
    } catch (error: any) {
      console.error('❌ Hakem verileri alınamadı:', error);
      
      // Hata mesajını görüntüle
      setMessage({
        type: 'error',
        text: `Hakemler yüklenirken bir hata oluştu. Detaylı hata: ${error.message}`
      });
      
      // Boş diziler ile devam et (uygulamanın çalışmaya devam etmesi için)
      setReviewers([]);
      setReviewerInfo([]);
    } finally {
      setLoading(false);
    }
  };

  // Bildirileri getir
  const fetchPapers = async (sempozyumId?: number) => {
    setLoading(true);
    try {
      // Tüm bildirileri getir
      const allPapers = await bildiriService.getAll();
      
      // Bildiri konularını getir (kategori adlarını göstermek için)
      const bildiriKonulari = await getBildiriKonulari();
      console.log('Bildiri konuları:', bildiriKonulari);
      
      // Bildiri konuları için bir önbellek (lookup map) oluştur - daha hızlı eşleştirme için
      const bildiriKonulariMap = new Map();
      bildiriKonulari.forEach((konu: any) => {
        bildiriKonulariMap.set(Number(konu.bildiriKonusuId), konu);
      });
      
      // İlk bildirinin detaylarını log olarak göster
      if (allPapers.length > 0) {
        console.log('İlk bildiri detayları:', {
          bildiriKonusuId: allPapers[0].bildiriKonusuId,
          bildiriKonusu: allPapers[0].bildiriKonusu,
          type: typeof allPapers[0].bildiriKonusuId
        });
        if (bildiriKonulari.length > 0) {
          console.log('İlk bildiri kategorisi bildiriKonusuId:', bildiriKonulari[0].bildiriKonusuId, 'type:', typeof bildiriKonulari[0].bildiriKonusuId);
        }
      }
      
      // Aktif sempozyuma ait bildirileri filtrele
      let filteredPapers = allPapers;
      if (sempozyumId) {
        // Sempozyum bilgilerini getir
        const sempozyumlar = await sempozyumService.getAllSempozyumlar();
        // Aktif sempozyum adını bul
        const activeSempozyum = sempozyumlar.find(s => s.id === sempozyumId);
        const activeSempozyumTitle = activeSempozyum?.title;
        
        filteredPapers = allPapers.filter(bildiri => {
          // Bildiri sempozyum objesinde id yok, title ile karşılaştırma yapıyoruz
          return bildiri.sempozyum && bildiri.sempozyum.title === activeSempozyumTitle;
        });
        
        console.log(`Aktif sempozyum (${activeSempozyumTitle}) için ${filteredPapers.length} bildiri filtrelendi.`);
      }
      
      // Bildiri verilerini frontend formatına dönüştür
      const formattedPapers = filteredPapers.map(bildiri => {
        // Hakemler alanını doğru şekilde işle (JSON string'den dönüştür)
        let hakemlerArray = [];
        if (bildiri.hakemler) {
          try {
            // Eğer hakemler JSON string ise parse et
            if (typeof bildiri.hakemler === 'string') {
              hakemlerArray = JSON.parse(bildiri.hakemler);
            } 
            // Eğer zaten dizi ise doğrudan kullan
            else if (Array.isArray(bildiri.hakemler)) {
              hakemlerArray = bildiri.hakemler;
            }
          } catch (e) {
            console.error('Hakemler parse edilirken hata:', e);
            hakemlerArray = [];
          }
        }

        // Bildiri konusunun adını bul - lookup map kullan
        const bildiriKonusuId = Number(bildiri.bildiriKonusuId);
        
        // Önce bildiri objesindeki bildiriKonusu property'sini kontrol et
        let bildiriKonusuTitle = '';
        
        // API'den gelen nesnede bildiriKonusu objesi varsa ve baslik içeriyorsa direkt kullan
        if (bildiri.bildiriKonusu && bildiri.bildiriKonusu.baslik) {
          bildiriKonusuTitle = bildiri.bildiriKonusu.baslik;
          console.log('Bildiri konusu direkt objeden alındı:', bildiriKonusuTitle);
        } else {
          // Yoksa Map'ten bulmaya çalış
          const bildiriKonusu = bildiriKonulariMap.get(bildiriKonusuId);
          
          // Eğer bildiri konusu bulunamadıysa detayları logla
          if (!bildiriKonusu) {
            console.log('Bildiri konusu bulunamadı:', bildiriKonusuId);
            console.log('Mevcut bildiri konuları IDs:', Array.from(bildiriKonulariMap.keys()));
            bildiriKonusuTitle = bildiri.bildiriKonusuId?.toString() || '';
          } else {
            bildiriKonusuTitle = bildiriKonusu.title;
          }
        }
        
        return {
          id: bildiri.id.toString(),
          title: bildiri.baslik,
          authors: bildiri.yazarlar || [],
          abstract: bildiri.ozet,
          paperTopicId: bildiri.bildiriKonusuId?.toString() || '',
          paperTopicTitle: bildiriKonusuTitle, // Kategori adını da ekleyelim
          mainTopicId: bildiri.anaKonuId?.toString() || '',
          status: bildiri.durum || 'pending',
          submissionDate: new Date(bildiri.createdAt).toLocaleDateString('tr-TR'),
          hakemIds: hakemlerArray, // Hakem ID'lerini sakla
          reviewers: [], // Boş dizi olarak başlat, sonra dolduracağız
          dokuman: bildiri.dokuman // PDF dosyasının URL'i
        };
      });
      
      // Hakem ID'lerine göre hakem bilgilerini getir
      if (formattedPapers.length > 0) {
        try {
          // Bütün hakem ID'lerini topla
          const allHakemIds = formattedPapers.flatMap(paper => paper.hakemIds || []);
          
          if (allHakemIds.length > 0) {
            // Hakem bilgilerini getir
            const hakemler = await userService.getReviewers();
            
            // Her bildiri için hakem bilgilerini eşleştir
            formattedPapers.forEach(paper => {
              if (paper.hakemIds && paper.hakemIds.length > 0) {
                paper.reviewers = paper.hakemIds.map((hakemId: number) => {
                  const hakem = hakemler.find(h => h.id === hakemId);
                  return hakem ? `${hakem.unvan || ''} ${hakem.ad} ${hakem.soyad}`.trim() : `Hakem #${hakemId}`;
                });
              }
            });
          }
        } catch (error) {
          console.error('Hakem bilgileri getirilirken hata:', error);
        }
      }
      
      setPapers(formattedPapers);
      console.log('Bildiriler başarıyla yüklendi:', formattedPapers);
    } catch (error) {
      console.error('Bildiriler getirilirken hata:', error);
      setMessage({ 
        type: 'error', 
        text: 'Bildiriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Bildirileri filtrele - searchTerm, selectedStatus ve selectedCategory değişikliklerini izle
  // useEffect kullanarak bu değişiklikleri dinleyelim
  useEffect(() => {
    // Bildirileri filtrele - boş kontrol koşulunu kaldırdık
    const newFilteredPapers = papers.filter(currentPaper => {
      const matchesSearch = 
        currentPaper.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        currentPaper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = selectedStatus === '' || currentPaper.status === selectedStatus;
      const matchesCategory = selectedCategory === '' || currentPaper.paperTopicId === selectedCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sadece boş olmayan papers için debug log
    if (papers.length > 0) {
      console.log(`Filtreleme: ${papers.length} bildiriden ${newFilteredPapers.length} bildiri filtrelendi`);
      console.log(`Filtreler: Arama=${searchTerm}, Durum=${selectedStatus}, Kategori=${selectedCategory}`);
    }
  }, [searchTerm, selectedStatus, selectedCategory, papers]);

  // Bildirileri filtrele
  const filteredPapers = papers.filter(paper => {
    const matchesSearch = 
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      paper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = selectedStatus === '' || paper.status === selectedStatus;
    const matchesCategory = selectedCategory === '' || paper.paperTopicId === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });
  
  // Kategorileri çıkar - her kategori yalnızca bir kez gösterilsin
  const uniqueCategories = papers.reduce((acc, paper) => {
    // Eğer bu kategori daha önce eklenmemişse ekle
    if (!acc.some(cat => cat.id === paper.paperTopicId)) {
      acc.push({ id: paper.paperTopicId, title: paper.paperTopicTitle });
    }
    return acc;
  }, [] as { id: string, title: string }[]);
  
  // Kategorileri alfabetik olarak sırala
  const categories = uniqueCategories.sort((a, b) => a.title.localeCompare(b.title));
  
  // Mevcut durumları çıkar - sadece mevcut bildiri durumlarını göster
  const availableStatuses = papers.reduce((acc, paper) => {
    const status = paper.status;
    if (!acc.includes(status)) {
      acc.push(status);
    }
    return acc;
  }, [] as string[]);
  
  // Durum gösterimini çevirecek yardımcı fonksiyon ekleyelim
  const getStatusDisplay = (status: string) => {
    // Arka uçtan gelen durum değerlerini Türkçe karşılıklarına çeviriyoruz
    switch (status) {
      case 'accepted':
      case 'kabul_edildi':
        return { text: 'Kabul Edildi', classes: 'bg-green-100 text-green-800' };
      case 'rejected':
      case 'reddedildi':
        return { text: 'Reddedildi', classes: 'bg-red-100 text-red-800' };
      case 'under-review':
      case 'under_review':
      case 'incelemede':
        return { text: 'İncelemede', classes: 'bg-blue-100 text-blue-800' };
      case 'revision_requested':
      case 'revizyon_istendi':
      case 'revision-needed':
      case 'revizyon_gerekli': 
        return { text: 'Revizyon İstendi', classes: 'bg-yellow-100 text-yellow-800' };
      case 'REVIZE_YAPILDI':
      case 'revize_yapildi':
        return { text: 'Revize Yapıldı', classes: 'bg-purple-100 text-purple-800' };
      case 'pending':
      case 'beklemede':
        return { text: 'Beklemede', classes: 'bg-gray-100 text-gray-800' };
      case 'published':
      case 'yayinlandi':
        return { text: 'Yayınlandı', classes: 'bg-indigo-100 text-indigo-800' };
      default:
        return { text: status, classes: 'bg-gray-100 text-gray-800' };
    }
  };

  // Hakem atama modalını aç
  const openReviewerModal = (paper: Paper) => {
    setSelectedPaper(paper);
    const currentReviewers = paper.reviewers || [];
    setSelectedReviewers(currentReviewers);
    setReviewerSearchTerm(''); // Arama terimini sıfırla
    
    // Eğer reviewerInfo boşsa, uyarı mesajı göster
    if (reviewerInfo.length === 0) {
      console.warn('Hakem bilgileri bulunamadı - Kullanıcıya bildiri gösterilecek');
      setMessage({
        type: 'error',
        text: 'Sistemde kayıtlı hakem bulunamadı. Lütfen önce hakem ekleyin.'
      });
      // Boş hakem listelerini ayarla
      setReviewers([]);
      setReviewerInfo([]);
      setAvailableReviewers([]);
    } else {
      // Mevcut reviewerInfo kullanarak kullanılabilir hakemleri belirle
      const allReviewerNames = reviewerInfo.map(r => r.name);
      
      // Seçilmemiş olan hakemleri göster
      const notAssignedReviewers = allReviewerNames.filter(
        name => !currentReviewers.includes(name)
      );
      
      // Kullanılabilir hakemleri ayarla
      setAvailableReviewers(notAssignedReviewers);
      
      console.log('Mevcut hakemler:', currentReviewers);
      console.log('Tüm hakemler:', allReviewerNames);
      console.log('Seçilebilir hakemler:', notAssignedReviewers);
    }
    
    setIsReviewerModalOpen(true);
  };
  
  // Hakem atama modalını kapat
  const closeReviewerModal = () => {
    setIsReviewerModalOpen(false);
    setSelectedPaper(null);
    setSelectedReviewers([]);
  };

  // Anlık bildiri güncellemesi için yardımcı fonksiyon
  const updatePaperReviewers = (paperId: string, selectedReviewerNames: string[]) => {
    setPapers(prevPapers => 
      prevPapers.map(paper => {
        if (paper.id === paperId) {
          // Sadece seçili bildirideki hakem listesini güncelle
          return { 
            ...paper, 
            reviewers: [...selectedReviewerNames] 
          };
        }
        return paper;
      })
    );
  };
  
  // Hakem seçimini değiştir
  const toggleReviewer = (reviewer: string) => {
    if (selectedReviewers.includes(reviewer)) {
      // Hakem zaten seçili, çıkart
      const updatedReviewers = selectedReviewers.filter(r => r !== reviewer);
      setSelectedReviewers(updatedReviewers);
      
      // Çıkartılan hakemi availableReviewers listesine ekle (eğer yoksa)
      if (!availableReviewers.includes(reviewer)) {
        setAvailableReviewers(prev => [...prev, reviewer]);
      }

      // Eğer seçili bildiri varsa, anlık olarak UI'daki hakem listesini de güncelle
      if (selectedPaper) {
        updatePaperReviewers(selectedPaper.id, updatedReviewers);
      }
    } else {
      // Hakem seçili değil, ekle
      const updatedReviewers = [...selectedReviewers, reviewer];
      setSelectedReviewers(updatedReviewers);
      
      // Eklenen hakemi availableReviewers listesinden çıkart
      setAvailableReviewers(prev => prev.filter(r => r !== reviewer));

      // Eğer seçili bildiri varsa, anlık olarak UI'daki hakem listesini de güncelle
      if (selectedPaper) {
        updatePaperReviewers(selectedPaper.id, updatedReviewers);
      }
    }
  };
  
  // Hakem atamalarını kaydet
  const saveReviewerAssignment = async () => {
    try {
      if (!selectedPaper) {
        console.error('Seçili bildiri bulunamadı.');
        return;
      }
      
      console.log('Seçili hakemler:', selectedReviewers);
      
      // Hakem ID'lerini bulmak için reviewerInfo array'ini kullan
      const selectedHakemIds = selectedReviewers.map(reviewerName => {
        const reviewer = reviewerInfo.find(r => r.name === reviewerName);
        return reviewer ? reviewer.id : null;
      }).filter(id => id !== null) as number[]; // null değerleri filtrele
      
      console.log('Atanacak hakem ID\'leri:', selectedHakemIds);
      
      // bildiriService.assignReviewers kullan
      const result = await bildiriService.assignReviewers(parseInt(selectedPaper.id), selectedHakemIds);
      
      if (!result.success) {
        throw new Error(result.error || 'Hakem atama işlemi başarısız oldu.');
      }
      
      console.log('Hakem atama sonucu:', result);

      // Veritabanı güncellemesi sonrası aktif sempozyuma ait bildirileri getir
      if (aktifSempozyumId) {
        await fetchPapers(aktifSempozyumId);
      } else {
        // Aktif sempozyum yoksa, normal fetchPapers çağır
        await fetchPapers();
      }

      // Başarı mesajını göster
      setMessage({ 
        type: 'success', 
        text: selectedHakemIds.length > 0 ? 'Hakem ataması başarıyla güncellendi.' : 'Tüm hakemler başarıyla kaldırıldı.'
      });
      
      // Modalı kapat
      closeReviewerModal();
      
      // Mesajı 3 saniye sonra temizle
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Hakem ataması yapılırken hata:', error);
      setMessage({ 
        type: 'error', 
        text: 'Hakem ataması yapılırken bir hata oluştu. Lütfen tekrar deneyin.' 
      });
    }
  };
  
  // Hakem Modalı
  const HakemModal = () => {
    // Modalın içinde useEffect ile tüm hakemler için expertise bilgisi konsola yazdıralım
    React.useEffect(() => {
      if (reviewerInfo.length > 0) {
        console.log('🟢🟢🟢 HAKEM MODAL AÇILDI - TÜM HAKEM LİSTESİ 🟢🟢🟢');
        reviewerInfo.forEach(reviewer => {
          console.log(`Hakem: ${reviewer.name}, ID: ${reviewer.id}`);
          console.log(`  Expertise Değeri:`, reviewer.expertise);
          console.log(`----------------------------------------`);
        });
      }
    }, []);

    // Arama terimine göre filtrelenmiş hakemler listesi
    const filteredAvailableReviewers = availableReviewers.filter(
      reviewer => reviewer.toLowerCase().includes(reviewerSearchTerm.toLowerCase())
    );

    // Hakem arama işlemini yönet
    const handleReviewerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = e.target.value;
      setReviewerSearchTerm(searchValue);
    };

    // Input için referans oluştur
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Modal açıldığında search inputuna otomatik focus sağla
    React.useEffect(() => {
      // Timeout kullanarak DOM'un hazır olmasını bekle
      const focusTimeout = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(focusTimeout);
    }, []);

    // Hakem bilgisini hazırlayan yardımcı fonksiyon
    const prepareExpertiseInfo = (reviewerName: string) => {
      const reviewer = reviewerInfo.find(r => r.name === reviewerName);
      if (!reviewer) return { expertise: [] };

      // Expertise bilgisini hazırlayalım
      const isExpertiseArray = Array.isArray(reviewer.expertise);
      let expertise = [];

      try {
        if (reviewer.expertise) {
          if (isExpertiseArray) {
            expertise = reviewer.expertise;
          } else if (typeof reviewer.expertise === 'string') {
            try {
              // TypeScript hatası burada - string[] as string olarak cast edilemiyor
              // as unknown ekleyerek düzeltelim
              expertise = JSON.parse(reviewer.expertise as unknown as string);
            } catch (e) {
              expertise = [reviewer.expertise as unknown as string];
            }
          } else if (typeof reviewer.expertise === 'object' && reviewer.expertise !== null) {
            expertise = Object.values(reviewer.expertise);
          } else {
            expertise = [String(reviewer.expertise)];
          }
        }
      } catch (e) {
        console.error("Expertise hazırlama hatası:", e);
        expertise = [];
      }

      return { expertise };
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Hakem Ata</h3>
          </div>
          
          <div className="px-6 py-4">
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Bildiri Bilgileri:</h4>
              <p className="text-gray-700">{selectedPaper?.title}</p>
              <p className="text-sm text-gray-500">Yazar: {selectedPaper?.authors.join(', ')}</p>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Mevcut Hakemler:</h4>
              {selectedReviewers && selectedReviewers.length > 0 ? (
                <div className="space-y-2">
                  {selectedReviewers.map((reviewer: string, index: number) => {
                    // Expertise bilgisini hazırla
                    const { expertise } = prepareExpertiseInfo(reviewer);

                    return (
                      <div key={index} className="flex items-start justify-between bg-blue-50 p-3 rounded">
                        <div className="flex-1">
                          <div className="font-medium">{reviewer}</div>
                          {expertise && expertise.length > 0 ? (
                            <div className="mt-2 text-xs">
                              <span className="font-medium text-gray-600 block mb-1">Uzmanlık Alanları:</span>
                              <div className="flex flex-wrap gap-1">
                                {expertise.map((exp: any, i: number) => (
                                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {typeof exp === 'object' ? JSON.stringify(exp) : String(exp)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 text-xs italic text-gray-500">Uzmanlık alanı belirtilmemiş</div>
                          )}
                        </div>
                        <button 
                          onClick={() => toggleReviewer(reviewer)}
                          className="text-red-600 hover:text-red-800 ml-2 mt-1"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic">Henüz hakem atanmamış.</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {reviewerInfo.length === 0 ? "Hakem Durumu" : "Hakem Ekle:"}
              </h4>
              
              {/* Hakem Arama */}
              <div className="mb-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Hakem adına göre ara..."
                    value={reviewerSearchTerm}
                    onChange={handleReviewerSearch}
                    onClick={(e) => e.currentTarget.focus()}
                    autoFocus={true}
                  />
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                {filteredAvailableReviewers.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredAvailableReviewers.map((reviewer, index) => {
                      // Expertise bilgisini hazırla
                      const { expertise } = prepareExpertiseInfo(reviewer);
                      
                      return (
                        <div 
                          key={index} 
                          className="p-3 hover:bg-gray-50 cursor-pointer flex items-start"
                          onClick={() => toggleReviewer(reviewer)}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedReviewers.includes(reviewer)}
                            onChange={() => {}}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-3 mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{reviewer}</div>
                            {expertise && expertise.length > 0 ? (
                              <div className="mt-1 text-xs">
                                <span className="font-medium text-gray-600">Uzmanlık Alanları:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {expertise.map((exp: any, i: number) => (
                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                      {typeof exp === 'object' ? JSON.stringify(exp) : String(exp)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-1 text-xs italic text-gray-500">Uzmanlık alanı belirtilmemiş</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : reviewerSearchTerm ? (
                  <p className="p-3 text-gray-500 italic">Arama kriterine uygun hakem bulunamadı.</p>
                ) : reviewerInfo.length === 0 ? (
                  <div className="p-3">
                    <p className="text-red-500 font-medium mb-1">Sistemde kayıtlı hakem bulunamadı!</p>
                    <p className="text-gray-500 text-sm">Lütfen önce sisteme hakem ekleyin.</p>
                  </div>
                ) : (
                  <p className="p-3 text-gray-500 italic">Tüm hakemler zaten bu bildiriye atanmış.</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={closeReviewerModal}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={saveReviewerAssignment}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Önizleme modalını açmadan önce revizyon detaylarını yükle
  const handlePreviewPaper = async (paper: Paper) => {
    setPreviewPaper(paper);
    setIsPreviewModalOpen(true);
    
    // Tüm bildiriler için değerlendirme detaylarını yükle
    try {
      setRevizyonYukleniyor(true);
      setRevizyonDetaylari([]); // Yükleme başladığında mevcut verileri temizle
      
      // RevizeGecmisi tablosundan verileri çek
      const revizeGecmisiListesi = await revizeGecmisiService.getByBildiriId(parseInt(paper.id));
      console.log('Bildiriye ait revize geçmişi detayları (Ham):', JSON.stringify(revizeGecmisiListesi));
      
      // API'den bir veri geldi mi kontrol et
      if (!revizeGecmisiListesi || !Array.isArray(revizeGecmisiListesi)) {
        console.error('Revize geçmişi listesi geçerli bir dizi değil:', revizeGecmisiListesi);
        setRevizyonDetaylari([]);
        return;
      }
      
      // API'den dönen alanları kontrol et ve log bilgisi yaz
      if (revizeGecmisiListesi.length > 0) {
        console.log('İlk revize geçmişi kaydının tüm alanları:', Object.keys(revizeGecmisiListesi[0]));
        console.log('Örnek revize geçmişi verisi:', JSON.stringify(revizeGecmisiListesi[0], null, 2));
        
        // Değerlendirmeleri tarihe göre sırala (en yenisi en üstte)
        const siraliRevizeler = [...revizeGecmisiListesi].sort((a, b) => {
          // Önce revizeTarihi alanı varsa onu kullan, yoksa createdAt
          const dateA = a.revizeTarihi ? new Date(a.revizeTarihi).getTime() : new Date(a.createdAt || '').getTime();
          const dateB = b.revizeTarihi ? new Date(b.revizeTarihi).getTime() : new Date(b.createdAt || '').getTime();
          return dateB - dateA; // En yeniden en eskiye
        });
        
        // Hakem isimlerini ekleyerek değerlendirme detaylarını oluştur
        const detayliRevizeler = await Promise.all(siraliRevizeler.map(async (revize) => {
          // Hakem adını bul
          let hakemAdi = "";
          if (revize.hakemId) {
            const hakem = reviewerInfo.find(r => r.id === revize.hakemId);
            hakemAdi = hakem ? hakem.name : `Hakem #${revize.hakemId}`;
          } else {
            hakemAdi = "Bilinmeyen Hakem";
          }
          
          // Tüm alanları, hem mevcut hem de yeni eklenenler dahil olmak üzere kopyala
          return {
            ...revize,
            id: revize.id || Math.random(), // ID yoksa random ID ata (UI için gerekli)
            hakemAdi,
            hakemId: revize.hakemId || 0,
            durum: (revize.durum || 'REVIZE').toUpperCase(), // Durum yoksa default değer ata ve büyük harfe çevir
            // Yeni alanlar için null veya undefined kontrolü
            gucluYonler: revize.gucluYonler || '',
            zayifYonler: revize.zayifYonler || '',
            genelYorum: revize.genelYorum || '',
            guvenSeviyesi: revize.guvenSeviyesi || 0,
            makaleTuru: revize.makaleTuru || '',
            makaleBasligi: revize.makaleBasligi || '',
            soyut: revize.soyut || '',
            anahtarKelimeler: revize.anahtarKelimeler || '',
            giris: revize.giris || '',
            gerekcelerVeYontemler: revize.gerekcelerVeYontemler || '',
            sonuclarVeTartismalar: revize.sonuclarVeTartismalar || '',
            referanslar: revize.referanslar || '',
            guncellikVeOzgunluk: revize.guncellikVeOzgunluk || '',
            createdAt: revize.createdAt || new Date().toISOString(),
            updatedAt: revize.updatedAt || new Date().toISOString(),
            revizeTarihi: revize.revizeTarihi || revize.createdAt || new Date().toISOString(),
            sempozyumId: revize.sempozyumId,
            bildiriId: revize.bildiriId
          };
        }));
        
        console.log('İşlenmiş revize geçmişi detayları:', detayliRevizeler);
        setRevizyonDetaylari(detayliRevizeler);
      } else {
        console.log('Bildiri için revize geçmişi bulunamadı');
        setRevizyonDetaylari([]);
      }
    } catch (error) {
      console.error('Revize geçmişi detayları yüklenirken hata:', error);
      setRevizyonDetaylari([]);
    } finally {
      setRevizyonYukleniyor(false);
    }
  };

  // Admin olmayan kullanıcılar için yükleme ekranı
  if (!user || !isAdmin || loading) {
    return (
      <div className="min-h-screen bg-white py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Bildiri Yönetimi</h1>
            <div className="flex space-x-2">
              <Link 
                href="/admin/dashboard" 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition duration-200"
              >
                Dashboard'a Dön
              </Link>
            </div>
          </div>
          
          {/* Başarı/Hata Mesajı */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}
          
          {/* Arama ve Filtreleme */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Bildiri Ara</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Başlık veya yazar ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  id="category"
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category.id}>{category.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                <select
                  id="status"
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">Tüm Durumlar</option>
                  {availableStatuses.map((status, index) => (
                    <option key={index} value={status}>{getStatusDisplay(status).text}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg transition duration-200"
                onClick={() => {
                  // Filtreleri uygula butonu tıklandığında otomatik olarak filtreleme yapar
                  // Bu fonksiyon boş olabilir çünkü filtreleme zaten otomatik olarak yapılıyor
                  // Ancak kullanıcıya görsel olarak bir geri bildirim vermek iyi olur
                  setMessage({ type: 'success', text: 'Filtreler uygulandı' });
                  
                  // 2 saniye sonra mesajı temizle
                  setTimeout(() => {
                    setMessage({ type: '', text: '' });
                  }, 2000);
                }}
              >
                Filtreleri Uygula
              </button>
            </div>
          </div>
          
          {/* Bildiri Tablosu */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bildiri
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hakemler
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPapers.map((paper) => (
                    <tr key={paper.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{paper.title}</div>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Yazar:</span> {paper.authors.join(', ')}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Gönderim:</span> {paper.submissionDate}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {paper.paperTopicTitle}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusDisplay(paper.status).classes}`}>
                          {getStatusDisplay(paper.status).text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {paper.reviewers?.map((reviewer, index) => (
                            <div key={index} className="mb-1 last:mb-0">
                              {reviewer}
                            </div>
                          ))}
                          {(!paper.reviewers || paper.reviewers.length === 0) && (
                            <span className="text-gray-400 italic">Hakem atanmadı</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900" 
                            title="Görüntüle"
                            onClick={() => handlePreviewPaper(paper)}
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                          </button>
                          {paper.dokuman && (
                            <button 
                              className="text-red-600 hover:text-red-900" 
                              title="PDF Görüntüle"
                              onClick={() => {
                                window.open(paper.dokuman, '_blank');
                              }}
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                            </button>
                          )}
                          <button 
                            className="text-green-600 hover:text-green-900" 
                            title="Hakem Ata"
                            onClick={() => openReviewerModal(paper)}
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M17 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Toplam <span className="font-medium">{filteredPapers.length}</span> bildiri
              </div>
              <div className="flex space-x-2">
                <button className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition duration-200 text-sm">
                  Önceki
                </button>
                <button className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition duration-200 text-sm">
                  Sonraki
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hakem Atama Modalı */}
      {isReviewerModalOpen && selectedPaper && <HakemModal />}
      
      {/* Bildiri Önizleme Modalı */}
      {isPreviewModalOpen && previewPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Bildiri Detayları</h3>
              <button 
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Başlık ve Yazarlar */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 border-b pb-2">{previewPaper.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previewPaper.authors.map((author, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {author}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Durum ve Tarih */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Durum</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusDisplay(previewPaper.status).classes}`}>
                        {getStatusDisplay(previewPaper.status).text}
                      </span>
                      <div className="mt-2 text-sm font-semibold">
                        {previewPaper.reviewers && previewPaper.reviewers.length > 0 
                          ? <span className="text-blue-600">Hakem Atandı</span> 
                          : <span className="text-amber-600">Hakem Bekleniyor</span>}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Gönderim Tarihi</span>
                    <p className="mt-1 text-sm font-medium text-gray-900">{previewPaper.submissionDate}</p>
                  </div>
                </div>
                
                {/* Revize Geçmişi */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Revize Geçmişi</h3>
                  
                  {revizyonYukleniyor ? (
                    <div className="py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Değerlendirme detayları yükleniyor...</p>
                    </div>
                  ) : revizyonDetaylari.length > 0 ? (
                    <div className="space-y-6">
                      {/* Değerlendirme özeti - sayılar ve durumlar */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-900">
                          <span className="text-blue-600">{Array.from(new Set(revizyonDetaylari.map(r => r.hakemId))).length}</span> hakem tarafından toplam <span className="text-blue-600">{revizyonDetaylari.length}</span> değerlendirme yapılmış:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {revizyonDetaylari.some(r => r.durum === 'KABUL') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Kabul: {revizyonDetaylari.filter(r => r.durum === 'KABUL').length}
                            </span>
                          )}
                          {revizyonDetaylari.some(r => r.durum === 'RED') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Red: {revizyonDetaylari.filter(r => r.durum === 'RED').length}
                            </span>
                          )}
                          {revizyonDetaylari.some(r => r.durum === 'REVIZE') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Revize: {revizyonDetaylari.filter(r => r.durum === 'REVIZE').length}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Hakemlere göre grupla */}
                      <div>
                        {/* Benzersiz hakem ID'lerini bul */}
                        {Array.from(new Set(revizyonDetaylari
                          .filter(r => r.hakemId !== undefined && r.hakemId !== null) // null ya da undefined olan hakem ID'lerini filtrele
                          .map(r => r.hakemId)
                        )).map(hakemId => {
                          if (!hakemId) return null;
                          
                          // Hakem adını bul
                          const ilkRevize = revizyonDetaylari.find(r => r.hakemId === hakemId);
                          const hakemAdi = ilkRevize?.hakemAdi || `Hakem #${hakemId}`;
                          
                          // Bu hakemin tüm değerlendirmelerini bul
                          const hakemDeğerlendirmeleri = revizyonDetaylari
                            .filter(r => r.hakemId === hakemId)
                            .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
                          
                          if (hakemDeğerlendirmeleri.length === 0) return null;
                          
                          // Hakeme ait en güncel değerlendirmeyi bul
                          const sonDegerlendirme = hakemDeğerlendirmeleri[0];
                          
                          return (
                            <div key={hakemId} className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium text-gray-900">{hakemAdi}</h4>
                                  <p className="text-sm text-gray-500">
                                    {hakemDeğerlendirmeleri.length > 1 
                                      ? `${hakemDeğerlendirmeleri.length} değerlendirme yapmış` 
                                      : '1 değerlendirme yapmış'}
                                  </p>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  sonDegerlendirme.durum === 'KABUL' ? 'bg-green-100 text-green-800' : 
                                  sonDegerlendirme.durum === 'RED' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  Son Karar: {sonDegerlendirme.durum === 'KABUL' ? 'Kabul' : 
                                             sonDegerlendirme.durum === 'RED' ? 'Red' : 'Revize'}
                                </span>
                              </div>
                              
                              <div className="divide-y divide-gray-200">
                                {hakemDeğerlendirmeleri.map((revize, index) => (
                                  <div key={revize.id || index} className="p-4 hover:bg-gray-50">
                                    <div className="flex justify-between mb-2">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        revize.durum === 'KABUL' ? 'bg-green-100 text-green-800' : 
                                        revize.durum === 'RED' ? 'bg-red-100 text-red-800' : 
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {revize.durum === 'KABUL' ? 'Kabul' : 
                                         revize.durum === 'RED' ? 'Red' : 'Revize'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(revize.createdAt || '').toLocaleDateString('tr-TR', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    
                                    <div className="space-y-3 mt-3">
                                      {/* Güven Seviyesi */}
                                      {revize.guvenSeviyesi && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 mb-1">Güven Seviyesi:</div>
                                          <div className="text-sm">{revize.guvenSeviyesi}/5</div>
                                        </div>
                                      )}
                                      
                                      {/* Güçlü Yönler */}
                                      {revize.gucluYonler && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 mb-1">Güçlü Yönler:</div>
                                          <div className="text-sm whitespace-pre-wrap">{revize.gucluYonler}</div>
                                        </div>
                                      )}
                                      
                                      {/* Zayıf Yönler */}
                                      {revize.zayifYonler && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 mb-1">Zayıf Yönler:</div>
                                          <div className="text-sm whitespace-pre-wrap">{revize.zayifYonler}</div>
                                        </div>
                                      )}
                                      
                                      {/* Genel Yorum */}
                                      {revize.genelYorum && (
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 mb-1">Genel Yorum:</div>
                                          <div className="text-sm whitespace-pre-wrap">{revize.genelYorum}</div>
                                        </div>
                                      )}
                                      
                                      {/* Detaylı değerlendirme alanları - buton ile açılır kapanır */}
                                      {(revize.makaleTuru || revize.makaleBasligi || revize.soyut || 
                                        revize.anahtarKelimeler || revize.giris || revize.gerekcelerVeYontemler || 
                                        revize.sonuclarVeTartismalar || revize.referanslar || revize.guncellikVeOzgunluk) && (
                                        <div className="mt-4">
                                          <button 
                                            onClick={() => {
                                              const detayDiv = document.getElementById(`revize-detay-${revize.id}`);
                                              if (detayDiv) {
                                                detayDiv.classList.toggle('hidden');
                                              }
                                            }}
                                            className="text-blue-600 hover:text-blue-900 text-sm flex items-center"
                                          >
                                            <span>Detaylı Değerlendirmeyi Göster</span>
                                            <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                          </button>
                                          
                                          <div id={`revize-detay-${revize.id}`} className="hidden mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* Makale Türü */}
                                            {revize.makaleTuru && (
                                              <div className="bg-white p-2 rounded border border-gray-200">
                                                <div className="text-xs font-medium text-gray-500 mb-1">Makale Türü:</div>
                                                <div className="text-sm">{revize.makaleTuru}</div>
                                              </div>
                                            )}
                                            
                                            {/* Makale Başlığı */}
                                            {revize.makaleBasligi && (
                                              <div className="bg-white p-2 rounded border border-gray-200">
                                                <div className="text-xs font-medium text-gray-500 mb-1">Makale Başlığı:</div>
                                                <div className="text-sm">{revize.makaleBasligi}</div>
                                              </div>
                                            )}
                                            
                                            {/* Soyut */}
                                            {revize.soyut && (
                                              <div className="bg-white p-2 rounded border border-gray-200">
                                                <div className="text-xs font-medium text-gray-500 mb-1">Özet:</div>
                                                <div className="text-sm">{revize.soyut}</div>
                                              </div>
                                            )}
                                            
                                            {/* Anahtar Kelimeler */}
                                            {revize.anahtarKelimeler && (
                                              <div className="bg-white p-2 rounded border border-gray-200">
                                                <div className="text-xs font-medium text-gray-500 mb-1">Anahtar Kelimeler:</div>
                                                <div className="text-sm">{revize.anahtarKelimeler}</div>
                                              </div>
                                            )}
                                            
                                            {/* Giriş */}
                                            {revize.giris && (
                                              <div className="bg-white p-2 rounded border border-gray-200">
                                                <div className="text-xs font-medium text-gray-500 mb-1">Giriş:</div>
                                                <div className="text-sm">{revize.giris}</div>
                                              </div>
                                            )}
                                            
                                            {/* Gerekçeler ve Yöntemler */}
                                            {revize.gerekcelerVeYontemler && (
                                              <div className="bg-white p-2 rounded border border-gray-200">
                                                <div className="text-xs font-medium text-gray-500 mb-1">Gerekçeler ve Yöntemler:</div>
                                                <div className="text-sm">{revize.gerekcelerVeYontemler}</div>
                                              </div>
                                            )}
                                            
                                            {/* Sonuçlar ve Tartışmalar */}
                                            {revize.sonuclarVeTartismalar && (
                                              <div className="bg-white p-2 rounded border border-gray-200">
                                                <div className="text-xs font-medium text-gray-500 mb-1">Sonuçlar ve Tartışmalar:</div>
                                                <div className="text-sm">{revize.sonuclarVeTartismalar}</div>
                                              </div>
                                            )}
                                            
                                            {/* Referanslar */}
                                            {revize.referanslar && (
                                              <div className="bg-white p-2 rounded border border-gray-200">
                                                <div className="text-xs font-medium text-gray-500 mb-1">Referanslar:</div>
                                                <div className="text-sm">{revize.referanslar}</div>
                                              </div>
                                            )}
                                            
                                            {/* Güncellik ve Özgünlük */}
                                            {revize.guncellikVeOzgunluk && (
                                              <div className="bg-white p-2 rounded border border-gray-200">
                                                <div className="text-xs font-medium text-gray-500 mb-1">Güncellik ve Özgünlük:</div>
                                                <div className="text-sm">{revize.guncellikVeOzgunluk}</div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-500">Bu bildiri için henüz değerlendirme yapılmamış.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}