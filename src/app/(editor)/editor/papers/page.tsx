'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { userService } from '@/lib/services';
import { User } from '@/lib/services/user.service';
import apiClient from '@/lib/apiClient';
import { bildiriService } from '@/lib/services/bildiri.service';
import { revizeService } from '@/lib/services/revize.service';
import { getBildiriKonulari } from '@/lib/services/bildiri-konusu.service';
import axios from 'axios';

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
  type: 'success' | 'error' | 'warning' | '';
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

// HakemModal bileşenini ana bileşenin dışında tanımlayalım
function HakemModal({ 
  isOpen, 
  selectedPaper, 
  selectedReviewers, 
  setSelectedReviewers, 
  reviewerInfo,
  availableReviewers, 
  reviewerSearchTerm, 
  setReviewerSearchTerm,
  onClose, 
  onSave, 
  toggleReviewer,
  prepareExpertiseInfo
}: {
  isOpen: boolean;
  selectedPaper: Paper | null;
  selectedReviewers: string[];
  setSelectedReviewers: React.Dispatch<React.SetStateAction<string[]>>;
  reviewerInfo: Array<{id: number, name: string, email: string, expertise?: string[]}>;
  availableReviewers: string[];
  reviewerSearchTerm: string;
  setReviewerSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onSave: () => void;
  toggleReviewer: (reviewer: string) => void;
  prepareExpertiseInfo: (reviewerName: string) => {expertise: any[]};
}) {
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
    if (isOpen && searchInputRef.current) {
      // Timeout kullanarak DOM'un hazır olmasını bekle
      const focusTimeout = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(focusTimeout);
    }
  }, [isOpen]);
  
  // Hakem bilgisini hazırlayan fonksiyon çağırımları bırakılıyor
  // Ama bu fonksiyon artık prop olarak gelecek

  if (!isOpen) return null;

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
                  // Expertise bilgisini hazırla (ana bileşendeki prepareExpertiseInfo fonksiyonunu kullan)
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
                    // Expertise bilgisini hazırla (ana bileşendeki prepareExpertiseInfo fonksiyonunu kullan)
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
            onClick={onClose}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditorPapers() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  const [categories, setCategories] = useState<{id: string, title: string}[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
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
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewerModal, setShowReviewerModal] = useState(false);
  const [allReviewers, setAllReviewers] = useState<Array<{id: number, adSoyad: string, eposta: string}>>([]);

  // Editor kontrolü - Admin veya RolId'si 5 olan kullanıcılar editor yetkilerine sahip olacak
  const isEditor = user?.role === 'Editor' || user?.rolId === 5 || user?.role === 'admin';
  
  // Yükleme durumu kontrolü
  const shouldShowLoading = !user || !isEditor || loading;
  
  // Ana useEffect - sayfa yüklendiğinde çalışır
  useEffect(() => {
    // Browser kontrolleri
    if (typeof window === 'undefined') return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Role kontrolü
    if (!isEditor) {
      router.push('/');
      return;
    } 

    // Sayfa yükleme işlemi
    setLoading(true);
    
    // API çağrılarını tek bir toplam yükleme içinde yap
    const loadData = async () => {
      try {
        // Tüm veri API çağrılarını paralel yap ve yanıtları topla
        const [bildiriResponse, hakemResponse, konuResponse, sempozyumResponse] = await Promise.allSettled([
          bildiriService.getAll(),
          userService.getReviewers(),
          getBildiriKonulari(),
          fetch('/api/sempozyum').then(res => res.json())
        ]);
        
        // 1. Sempozyum verilerini işle
        if (sempozyumResponse.status === 'fulfilled') {
          const sempozyumlar = sempozyumResponse.value;
          const aktifSempozyum = Array.isArray(sempozyumlar) ? 
            sempozyumlar.find((s: any) => s.aktiflik === true) : null;
            
          if (aktifSempozyum && aktifSempozyum.id) {
            setAktifSempozyumId(aktifSempozyum.id);
          }
        }
        
        // 2. Bildiri verisini işle
        if (bildiriResponse.status === 'fulfilled') {
          const papers = bildiriResponse.value || [];
          
          // 3. Bildiri konularını işle
          let bildiriKonulari: any[] = [];
          if (konuResponse.status === 'fulfilled') {
            bildiriKonulari = konuResponse.value || [];
    }
          
          // Konu map'i oluştur
          const konuMap = new Map();
          bildiriKonulari.forEach((konu: any) => {
            konuMap.set(Number(konu.bildiriKonusuId), konu);
          });
      
          // 4. Hakemleri işle
          let hakemler: any[] = [];
          let reviewerNames: string[] = [];
          let reviewerInfo: any[] = [];
          let allReviewersList: any[] = [];
      
          if (hakemResponse.status === 'fulfilled') {
            hakemler = hakemResponse.value || [];
            console.log('Ham hakem verileri:', hakemler); // Debug log eklendi
            
            // Hakem bilgilerini düzenle
            reviewerInfo = hakemler.map(reviewer => {
              if (!reviewer || !reviewer.ad || !reviewer.soyad) return null;
        
              // Hakem yeteneklerini işle (admin sayfasındaki gibi)
              const hakemYetenekleri = 
                  reviewer.hakem_yetenekleri || 
                  reviewer.yetenekler || 
                  reviewer.expertise || 
                  reviewer.hakem?.yetenekler || 
                               null;
        
              console.log(`${reviewer.ad} ${reviewer.soyad} için ham yetenek:`, hakemYetenekleri);
                  
              // Yetenekleri işle
        let expertiseArray: string[] = [];
        try {
          if (hakemYetenekleri) {
            if (typeof hakemYetenekleri === 'string') {
              try {
                      // JSON olarak parse etmeyi dene
                expertiseArray = JSON.parse(hakemYetenekleri);
                      console.log(`${reviewer.ad} için JSON parse sonrası:`, expertiseArray);
              } catch (parseError) {
                      // Virgülle ayrılmış olarak algıla
                      expertiseArray = hakemYetenekleri.split(',').map((item: string) => item.trim());
                      console.log(`${reviewer.ad} için virgülle ayrılmış:`, expertiseArray);
              }
            } else if (Array.isArray(hakemYetenekleri)) {
              // Zaten dizi ise doğrudan kullan
              expertiseArray = hakemYetenekleri;
                    console.log(`${reviewer.ad} için array:`, expertiseArray);
                  } else if (typeof hakemYetenekleri === 'object' && hakemYetenekleri !== null) {
                    // Obje ise değerlerini al
              expertiseArray = Object.values(hakemYetenekleri);
                    console.log(`${reviewer.ad} için object:`, expertiseArray);
            }
            
                  // Boş geliyorsa, string olarak al
            if (expertiseArray.length === 0 && hakemYetenekleri) {
              expertiseArray = [String(hakemYetenekleri)];
                    console.log(`${reviewer.ad} için string:`, expertiseArray);
            }
          }
        } catch (e) {
                console.error(`Hakem yetenekleri işleme hatası:`, e);
          expertiseArray = [];
        }
              
              console.log(`${reviewer.ad} ${reviewer.soyad} için işlenmiş yetenekler:`, expertiseArray);
        
        return {
          id: reviewer.id,
          name: `${reviewer.unvan || ''} ${reviewer.ad} ${reviewer.soyad}`.trim(),
          email: reviewer.eposta,
          expertise: expertiseArray
        };
            }).filter(Boolean);
      
            reviewerNames = reviewerInfo.map(r => r.name);
      
            allReviewersList = hakemler.map(reviewer => ({
        id: reviewer.id,
        adSoyad: `${reviewer.unvan || ''} ${reviewer.ad} ${reviewer.soyad}`.trim(),
              eposta: reviewer.eposta,
              expertise: reviewerInfo.find(r => r.id === reviewer.id)?.expertise || []
            }));
            
            // Her hakem için expertise detaylarını logla
            allReviewersList.forEach(reviewer => {
              console.log(`Hakem: ${reviewer.adSoyad}, Expertise:`, reviewer.expertise);
            });
      }
      
          // Hakem ID'leri ve adları için bir map oluştur
          const hakemMap = new Map();
          hakemler.forEach(hakem => {
            hakemMap.set(hakem.id, `${hakem.unvan || ''} ${hakem.ad} ${hakem.soyad}`.trim());
          });
          
          // 5. Bildirileri formatla
          const formattedPapers = papers.map(bildiri => {
            // Hakemler için
            let hakemIds: number[] = [];
            try {
        if (bildiri.hakemler) {
            if (typeof bildiri.hakemler === 'string') {
                  hakemIds = JSON.parse(bildiri.hakemler);
                } else if (Array.isArray(bildiri.hakemler)) {
                  // Hakem dizisi, element tipini kontrol et ve numaraya dönüştür
                  hakemIds = bildiri.hakemler.map(hakem => {
                    if (typeof hakem === 'number') {
                      return hakem;
                    } else if (typeof hakem === 'object' && hakem.id) {
                      return hakem.id;
                    } else {
                      return 0;
                    }
                  }).filter(id => id > 0); // Sadece geçerli ID'leri kabul et
                }
            }
          } catch (e) {
              hakemIds = [];
        }

            // Hakem adlarını bul
            const reviewersList = hakemIds.map(id => hakemMap.get(id) || `Hakem #${id}`);
            
            // Konu bilgisini bul
            const konuId = Number(bildiri.bildiriKonusuId);
            const konu = konuMap.get(konuId);
            const konuTitle = bildiri.bildiriKonusu?.baslik || (konu ? konu.title : '');
        
        return {
              id: bildiri.id?.toString() || 'unknown',
              title: bildiri.baslik || 'Başlık Yok',
          authors: bildiri.yazarlar || [],
              abstract: bildiri.ozet || '',
          paperTopicId: bildiri.bildiriKonusuId?.toString() || '',
              paperTopicTitle: konuTitle || 'Kategori Bulunamadı',
          mainTopicId: bildiri.anaKonuId?.toString() || '',
          status: bildiri.durum || 'pending',
              submissionDate: bildiri.createdAt ? new Date(bildiri.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor',
              hakemIds: hakemIds,
              reviewers: reviewersList,
              dokuman: bildiri.dokuman
        };
      });
      
          // 6. State'leri güncelle
          setPapers(formattedPapers);
          setReviewers(reviewerNames);
          setReviewerInfo(reviewerInfo);
          setAllReviewers(allReviewersList);
          }
        } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, isEditor, router]);
  
  // Bildirileri filtrele
  useEffect(() => {
    // Kategorileri hesapla
    const uniqueCategories = papers.reduce((acc, paper) => {
      if (!acc.some(cat => cat.id === paper.paperTopicId)) {
        acc.push({ id: paper.paperTopicId, title: paper.paperTopicTitle });
      }
      return acc;
    }, [] as { id: string, title: string }[]);
    
    // Kategorileri sırala
    const sortedCategories = uniqueCategories.sort((a, b) => a.title.localeCompare(b.title));
    setCategories(sortedCategories);
    
    // Mevcut durumları hesapla
    const statuses = papers.reduce((acc, paper) => {
      const status = paper.status;
      if (!acc.includes(status)) {
        acc.push(status);
      }
      return acc;
    }, [] as string[]);
    setAvailableStatuses(statuses);
    
    // Temel filtrelemeyi yap
    const newFilteredPapers = papers.filter(currentPaper => {
      const matchesSearch = 
        currentPaper.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        currentPaper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = selectedStatus === '' || currentPaper.status === selectedStatus;
      const matchesCategory = selectedCategory === '' || currentPaper.paperTopicId === selectedCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Filtrelenmiş bildirileri güncelle
    setFilteredPapers(newFilteredPapers);

    // Debug log
    if (papers.length > 0) {
      console.log(`Filtreleme: ${papers.length} bildiriden ${newFilteredPapers.length} bildiri filtrelendi`);
      console.log(`Filtreler: Arama=${searchTerm}, Durum=${selectedStatus}, Kategori=${selectedCategory}`);
    }
  }, [searchTerm, selectedStatus, selectedCategory, papers]);
  
  // Hakem atama modalını aç
  const openReviewerModal = (paper: Paper) => {
    setSelectedPaper(paper);
    const currentReviewers = paper.reviewers || [];
    setSelectedReviewers(currentReviewers);
    setReviewerSearchTerm(''); // Arama terimini sıfırla
    
    // Konsola log ekleyelim
    console.log('Mevcut hakemler:', currentReviewers);
    console.log('Tüm hakemler:', allReviewers.map(r => r.adSoyad));
    
    // Eğer reviewerInfo boşsa, uyarı mesajı göster
    if (allReviewers.length === 0) {
      console.warn('Hakem bilgileri bulunamadı - Kullanıcıya bildiri gösterilecek');
      setMessage({
        type: 'error',
        text: 'Sistemde kayıtlı hakem bulunamadı. Lütfen önce hakem ekleyin.'
      });
      // Boş hakem listelerini ayarla
      setAvailableReviewers([]);
    } else {
      // Mevcut allReviewers kullanarak kullanılabilir hakemleri belirle
      const allReviewerNames = allReviewers.map(r => r.adSoyad);
      
      // Seçilmemiş olan hakemleri göster
      const notAssignedReviewers = allReviewerNames.filter(
        name => !currentReviewers.includes(name)
      );
      
      // Kullanılabilir hakemleri ayarla
      setAvailableReviewers(notAssignedReviewers);
      
      console.log('Mevcut hakemler:', currentReviewers);
      console.log('Tüm hakemler:', allReviewerNames);
      console.log('Seçilebilir hakemler:', notAssignedReviewers);
      
      // Hakemlerin uzmanlık alanlarını kontrol et
      allReviewers.forEach(reviewer => {
        const info = reviewerInfo.find(r => r.id === reviewer.id);
        console.log(`Hakem ${reviewer.adSoyad} uzmanlık alanları:`, info?.expertise);
      });
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
  
  // Hakem atama öncesi yetki kontrolü
  const checkEditorPermission = () => {
    // LocalStorage'dan token ve user bilgilerini kontrol et
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      console.error('Token bulunamadı, işlem yapılamaz');
      return false;
    }
    
    // Token geçerlilik kontrolü
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Token formatı geçersiz');
        return false;
      }
      
      // Base64'ten decode edelim
      const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64Payload));
      
      // Roller ve ID'leri kontrol et
      console.log('Token içindeki rol bilgileri:', { 
        role: payload.role,
        rolId: payload.rolId,
        userId: payload.userId || payload.sub
      });
      
      // User bilgilerini de kontrol et
      let hasEditorRole = false;
      
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.log('LocalStorage\'daki kullanıcı bilgileri:', { 
            role: userData.role,
            rolId: userData.rolId,
            id: userData.id
          });
          
          // Editör rolünü doğrula
          if (userData.role === 'Editor' || userData.rolId === 5 || userData.role === 'admin') {
            hasEditorRole = true;
            console.log('Kullanıcı editör/admin yetkilerine sahip');
          }
          
          // Rol bilgileri bulunamadıysa veya hatalıysa, elle düzeltmeyi dene
          if (!hasEditorRole && userData.role) {
            // Rol adı 'Editor' değilse ve rolId 5 değilse, manuel düzeltme dene
            const fixedUser = {...userData};
            
            // Düzeltmeler yap
            if (userData.role.toLowerCase() === 'editor' && !userData.rolId) {
              console.log('Rol bilgisi düzeltiliyor: "editor" -> "Editor", rolId: 5');
              fixedUser.role = 'Editor';
              fixedUser.rolId = 5;
              
              // Düzeltilmiş kullanıcıyı localStorage'a kaydet
              localStorage.setItem('user', JSON.stringify(fixedUser));
              hasEditorRole = true;
            }
          }
          
          // Token ve localStorage bilgilerini karşılaştır
          if (userData.role !== payload.role || userData.rolId !== payload.rolId) {
            console.warn('Token ve localStorage kullanıcı bilgileri eşleşmiyor, yetkilendirme düzeltiliyor');
            
            // Hangisi Editor yetkisine sahipse onu kullan
            if (payload.role === 'Editor' || payload.rolId === 5 || payload.role === 'admin') {
              hasEditorRole = true;
            }
          }
        } catch (userError) {
          console.error('Kullanıcı bilgileri işlenirken hata:', userError);
        }
      }
      
      // Süre kontrolü
      const expiryDate = payload.exp ? new Date(payload.exp * 1000) : null;
      const now = new Date();
      
      if (expiryDate && expiryDate < now) {
        console.error('Token süresi dolmuş');
        return false;
      }
      
      // Rol kontrolü - token veya localStorage'dan editor yetkisi varsa izin ver
      if (hasEditorRole || payload.role === 'Editor' || payload.rolId === 5 || payload.role === 'admin') {
        console.log('Yetki kontrolü başarılı - işlem yapılabilir');
        return true;
      } else {
        console.error('Kullanıcı editör veya admin değil');
        return false;
      }
    } catch (e) {
      console.error('Token işlenirken hata:', e);
      return false;
    }
  };
  
  // Hakem atamalarını kaydet
  const saveReviewerAssignment = async () => {
    try {
      setIsLoading(true);

      if (!selectedPaper) {
        console.error('Seçili bildiri bulunamadı');
        setMessage({ type: 'error', text: 'Seçili bildiri bulunamadı.' });
        setIsLoading(false);
        return;
      }

      console.log('Seçilen hakemler:', selectedReviewers);
      console.log('Mevcut tüm hakemler:', allReviewers.map(r => `${r.adSoyad} (${r.id})`));

      // Seçilen hakemlerin ID'lerini al
      const selectedReviewerIds = selectedReviewers
        .map(reviewer => {
          const user = allReviewers.find(r => r.adSoyad === reviewer);
          if (!user) {
            console.error(`${reviewer} adlı hakem bulunamadı!`);
          }
          return user?.id || null;
        })
        .filter(id => id !== null) as number[];

      console.log('İşlenen hakem ID\'leri:', selectedReviewerIds);

      if (selectedReviewerIds.length === 0 && selectedReviewers.length > 0) {
        setMessage({ type: 'error', text: 'Seçilen hakemler tanımlanamadı. Lütfen tekrar deneyin.' });
        setIsLoading(false);
        return;
      }

      console.log('Atanacak hakem ID\'leri:', selectedReviewerIds);
      console.log('Bildiri ID:', selectedPaper.id);

      // Güncellenmiş bildiriService ile hakem atama
      try {
        const result = await bildiriService.assignReviewers(selectedPaper.id, selectedReviewerIds);
        
        console.log('Hakem atama sonucu:', result);
        
        if (!result.success) {
          throw new Error(result.error || 'Hakem atama işlemi başarısız oldu.');
        }
        
        setMessage({ type: 'success', text: 'Hakemler başarıyla atandı.' });
        setIsReviewerModalOpen(false);
        
        // Bildiri listesini yeniden yükle
        const reloadData = async () => {
          setLoading(true);
          try {
            // Tüm veri API çağrılarını paralel yap ve yanıtları topla
            const [bildiriResponse, hakemResponse, konuResponse, sempozyumResponse] = await Promise.allSettled([
              bildiriService.getAll(),
              userService.getReviewers(),
              getBildiriKonulari(),
              fetch('/api/sempozyum').then(res => res.json())
            ]);
            
            // 1. Sempozyum verilerini işle
            if (sempozyumResponse.status === 'fulfilled') {
              const sempozyumlar = sempozyumResponse.value;
              const aktifSempozyum = Array.isArray(sempozyumlar) ? 
                sempozyumlar.find((s: any) => s.aktiflik === true) : null;
                
              if (aktifSempozyum && aktifSempozyum.id) {
                setAktifSempozyumId(aktifSempozyum.id);
              }
            }
            
            // 2. Bildiri verisini işle
            if (bildiriResponse.status === 'fulfilled') {
              const papers = bildiriResponse.value || [];
              
              // 3. Bildiri konularını işle
              let bildiriKonulari: any[] = [];
              if (konuResponse.status === 'fulfilled') {
                bildiriKonulari = konuResponse.value || [];
              }
              
              // Konu map'i oluştur
              const konuMap = new Map();
              bildiriKonulari.forEach((konu: any) => {
                konuMap.set(Number(konu.bildiriKonusuId), konu);
              });
              
              // 4. Hakemleri işle
              let hakemler: any[] = [];
              let reviewerNames: string[] = [];
              let reviewerInfo: any[] = [];
              let allReviewersList: any[] = [];
              
              if (hakemResponse.status === 'fulfilled') {
                hakemler = hakemResponse.value || [];
                console.log('Yeniden yükleme: Ham hakem verileri:', hakemler);
                
                // Hakem bilgilerini düzenle
                reviewerInfo = hakemler.map(reviewer => {
                  if (!reviewer || !reviewer.ad || !reviewer.soyad) return null;
                  
                  // Hakem yeteneklerini işle (admin sayfasındaki gibi)
                  const hakemYetenekleri = 
                      reviewer.hakem_yetenekleri || 
                      reviewer.yetenekler || 
                      reviewer.expertise || 
                      reviewer.hakem?.yetenekler || 
                      null;
                      
                  // Yetenekleri işle
                  let expertiseArray: string[] = [];
                  try {
                    if (hakemYetenekleri) {
                      if (typeof hakemYetenekleri === 'string') {
                        try {
                          expertiseArray = JSON.parse(hakemYetenekleri);
                        } catch (parseError) {
                          expertiseArray = hakemYetenekleri.split(',').map((item: string) => item.trim());
                        }
                      } else if (Array.isArray(hakemYetenekleri)) {
                        expertiseArray = hakemYetenekleri;
                      } else if (typeof hakemYetenekleri === 'object') {
                        expertiseArray = Object.values(hakemYetenekleri);
                      }
                      
                      if (expertiseArray.length === 0 && hakemYetenekleri) {
                        expertiseArray = [String(hakemYetenekleri)];
                      }
                    }
                  } catch (e) {
                    console.error(`Hakem yetenekleri işleme hatası:`, e);
                    expertiseArray = [];
                  }
                  
                  return {
                    id: reviewer.id,
                    name: `${reviewer.unvan || ''} ${reviewer.ad} ${reviewer.soyad}`.trim(),
                    email: reviewer.eposta,
                    expertise: expertiseArray
                  };
                }).filter(Boolean);
                
                reviewerNames = reviewerInfo.map(r => r.name);
                
                allReviewersList = hakemler.map(reviewer => ({
                  id: reviewer.id,
                  adSoyad: `${reviewer.unvan || ''} ${reviewer.ad} ${reviewer.soyad}`.trim(),
                  eposta: reviewer.eposta,
                  expertise: reviewerInfo.find(r => r.id === reviewer.id)?.expertise || []
                }));
              }
              
              // Hakem ID'leri ve adları için bir map oluştur
              const hakemMap = new Map();
              hakemler.forEach(hakem => {
                hakemMap.set(hakem.id, `${hakem.unvan || ''} ${hakem.ad} ${hakem.soyad}`.trim());
              });
              
              // 5. Bildirileri formatla
              const formattedPapers = papers.map(bildiri => {
                // Hakemler için
                let hakemIds: number[] = [];
                try {
                  if (bildiri.hakemler) {
                    if (typeof bildiri.hakemler === 'string') {
                      hakemIds = JSON.parse(bildiri.hakemler);
                    } else if (Array.isArray(bildiri.hakemler)) {
                      // Hakem dizisi, element tipini kontrol et ve numaraya dönüştür
                      hakemIds = bildiri.hakemler.map(hakem => {
                        if (typeof hakem === 'number') {
                          return hakem;
                        } else if (typeof hakem === 'object' && hakem.id) {
                          return hakem.id;
                        } else {
                          return 0;
                        }
                      }).filter(id => id > 0); // Sadece geçerli ID'leri kabul et
                    }
                  }
                } catch (e) {
                  hakemIds = [];
                }
                
                // Hakem adlarını bul
                const reviewersList = hakemIds.map(id => hakemMap.get(id) || `Hakem #${id}`);
                
                // Konu bilgisini bul
                const konuId = Number(bildiri.bildiriKonusuId);
                const konu = konuMap.get(konuId);
                const konuTitle = bildiri.bildiriKonusu?.baslik || (konu ? konu.title : '');
                
                return {
                  id: bildiri.id?.toString() || 'unknown',
                  title: bildiri.baslik || 'Başlık Yok',
                  authors: bildiri.yazarlar || [],
                  abstract: bildiri.ozet || '',
                  paperTopicId: bildiri.bildiriKonusuId?.toString() || '',
                  paperTopicTitle: konuTitle || 'Kategori Bulunamadı',
                  mainTopicId: bildiri.anaKonuId?.toString() || '',
                  status: bildiri.durum || 'pending',
                  submissionDate: bildiri.createdAt ? new Date(bildiri.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor',
                  hakemIds: hakemIds,
                  reviewers: reviewersList,
                  dokuman: bildiri.dokuman
                };
              });
              
              // 6. State'leri güncelle
              setPapers(formattedPapers);
              setReviewers(reviewerNames);
              setReviewerInfo(reviewerInfo);
              setAllReviewers(allReviewersList);
            }
          } catch (error) {
            console.error('Veri yükleme hatası:', error);
          } finally {
            setLoading(false);
          }
        };
        
        // Veri yeniden yükleme
        reloadData();
        
      } catch (error: any) {
        console.error('Hakem atama hatası:', error);
        const errorMessage = error.message || 'Hakem atama işlemi sırasında bir hata oluştu.';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('API çağrısı başarısız:', error);
      
      // Daha detaylı hata mesajı göster
      let errorMessage = error.message || 'Hakem atama işlemi sırasında bir hata oluştu.';
      
      // API'den dönen spesifik hata mesajlarını göster
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Önizleme modalını açmadan önce revizyon detaylarını yükle
  const handlePreviewPaper = async (paper: Paper) => {
    setPreviewPaper(paper);
    setIsPreviewModalOpen(true);
    
    try {
      setRevizyonYukleniyor(true);
      const revizeListesi = await revizeService.getRevizesByBildiriId(parseInt(paper.id));
      console.log('Bildiriye ait değerlendirme detayları:', revizeListesi);
      
      // API'den dönen alanları kontrol et ve log bilgisi yaz
      if (revizeListesi && revizeListesi.length > 0) {
        console.log('İlk değerlendirmenin tüm alanları:', Object.keys(revizeListesi[0]));
        console.log('Yeni değerlendirme alanlarının durumu:', {
          makaleTuru: revizeListesi[0].makaleTuru !== undefined,
          makaleBasligi: revizeListesi[0].makaleBasligi !== undefined,
          soyut: revizeListesi[0].soyut !== undefined,
          anahtarKelimeler: revizeListesi[0].anahtarKelimeler !== undefined,
          giris: revizeListesi[0].giris !== undefined,
          gerekcelerVeYontemler: revizeListesi[0].gerekcelerVeYontemler !== undefined,
          sonuclarVeTartismalar: revizeListesi[0].sonuclarVeTartismalar !== undefined,
          referanslar: revizeListesi[0].referanslar !== undefined,
          guncellikVeOzgunluk: revizeListesi[0].guncellikVeOzgunluk !== undefined
        });
        
        // Değerlendirmeleri tarihe göre sırala (en yenisi en üstte)
        const siraliRevizeler = revizeListesi.sort((a, b) => {
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        });
        
        // Hakem isimlerini ekleyerek değerlendirme detaylarını oluştur
        // Promise.all kullanımı kaldırıldı, senkron işleme dönüştürüldü
        const detayliRevizeler = siraliRevizeler.map((revize) => {
          // Hakem adını bul
          let hakemAdi = "";
          if (revize.hakemId) {
            const hakem = reviewerInfo.find(r => r.id === revize.hakemId);
            hakemAdi = hakem ? hakem.name : `Hakem #${revize.hakemId}`;
          }
          
          // Tüm alanları, hem mevcut hem de yeni eklenenler dahil olmak üzere kopyala
          return {
            ...revize,
            hakemAdi,
            // Yeni alanları kontrol et ve varsayılan değer ata
            makaleTuru: revize.makaleTuru || undefined,
            makaleBasligi: revize.makaleBasligi || undefined,
            soyut: revize.soyut || undefined,
            anahtarKelimeler: revize.anahtarKelimeler || undefined,
            giris: revize.giris || undefined,
            gerekcelerVeYontemler: revize.gerekcelerVeYontemler || undefined,
            sonuclarVeTartismalar: revize.sonuclarVeTartismalar || undefined,
            referanslar: revize.referanslar || undefined,
            guncellikVeOzgunluk: revize.guncellikVeOzgunluk || undefined
          };
        });
        
        setRevizyonDetaylari(detayliRevizeler);
      } else {
        setRevizyonDetaylari([]);
      }
    } catch (error) {
      console.error('Değerlendirme detayları yüklenirken hata:', error);
      setRevizyonDetaylari([]);
    } finally {
      setRevizyonYukleniyor(false);
    }
  };

  // Durum görüntüleme fonksiyonu
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Beklemede', classes: 'bg-yellow-100 text-yellow-800' };
      case 'under-review':
      case 'under_review':
      case 'incelemede':
        return { text: 'İncelemede', classes: 'bg-blue-100 text-blue-700' };
      case 'revision-needed':
      case 'revision_needed':
      case 'revizyon_gerekli':
        return { text: 'Revizyon Gerekli', classes: 'bg-orange-100 text-orange-800' };
      case 'accepted':
      case 'kabul_edildi':
        return { text: 'Kabul Edildi', classes: 'bg-green-100 text-green-800' };
      case 'rejected':
      case 'reddedildi':
        return { text: 'Reddedildi', classes: 'bg-red-100 text-red-800' };
      case 'published':
      case 'yayinlandi':
        return { text: 'Yayınlandı', classes: 'bg-purple-100 text-purple-800' };
      default:
        return { text: status, classes: 'bg-gray-100 text-gray-800' };
    }
  };

  // Hakem bilgisini hazırlayan yardımcı fonksiyon
  const prepareExpertiseInfo = (reviewerName: string) => {
    // allReviewers dizisinden hakem adına göre hakemi bul
    const reviewer = allReviewers.find(r => r.adSoyad === reviewerName);
    if (!reviewer) return { expertise: [] };
    
    // Reviewer info içinden id'ye göre hakemi bul
    const reviewerDetail = reviewerInfo.find(r => r.id === reviewer.id);
    if (!reviewerDetail) return { expertise: [] };
    
    // Expertise bilgisini hazırla
    let expertise: any[] = [];
    try {
      if (reviewerDetail.expertise) {
        if (Array.isArray(reviewerDetail.expertise)) {
          expertise = reviewerDetail.expertise;
        } else if (typeof reviewerDetail.expertise === 'string') {
          try {
            expertise = JSON.parse(reviewerDetail.expertise as unknown as string);
          } catch (e) {
            expertise = [reviewerDetail.expertise as unknown as string];
          }
        } else if (typeof reviewerDetail.expertise === 'object' && reviewerDetail.expertise !== null) {
          expertise = Object.values(reviewerDetail.expertise);
        } else {
          expertise = [String(reviewerDetail.expertise)];
        }
      }
    } catch (e) {
      console.error("Expertise hazırlama hatası:", e);
      expertise = [];
    }
    
    return { expertise };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Bildiri Yönetimi</h1>
            <div className="flex space-x-2">
              <Link 
                href="/editor/dashboard" 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition duration-200"
              >
                Dashboard'a Dön
              </Link>
            </div>
          </div>
          
          {/* Başarı/Hata Mesajı */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 
              message.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
          
          {/* Hata ve Yükleme Durumları için Fallback */}
          {loading ? (
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 mb-8">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mr-4"></div>
                <p className="text-gray-600">Bildiriler yükleniyor...</p>
              </div>
            </div>
          ) : papers.length === 0 ? (
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 mb-8">
              <div className="text-center py-8">
                <div className="text-4xl text-gray-400 mb-3">📝</div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Bildiri Bulunamadı</h3>
                <p className="text-gray-500">Henüz bildiri bulunmamaktadır veya seçtiğiniz filtrelere uygun bildiri yoktur.</p>
              </div>
            </div>
          ) : (
            <>
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
                  setMessage({ type: 'success', text: 'Filtreler uygulandı' });
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
                              {paper.paperTopicTitle || "Kategori Belirsiz"}
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
            </>
          )}
        </div>
      </div>
      
      {/* Hakem Atama Modalı */}
      <HakemModal 
        isOpen={isReviewerModalOpen}
        selectedPaper={selectedPaper}
        selectedReviewers={selectedReviewers}
        setSelectedReviewers={setSelectedReviewers}
        reviewerInfo={reviewerInfo}
        availableReviewers={availableReviewers}
        reviewerSearchTerm={reviewerSearchTerm} 
        setReviewerSearchTerm={setReviewerSearchTerm}
        onClose={closeReviewerModal}
        onSave={saveReviewerAssignment}
        toggleReviewer={toggleReviewer}
        prepareExpertiseInfo={prepareExpertiseInfo}
      />
      
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
                
                {/* Değerlendirme Detayları - Tüm bildiriler için göster */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Değerlendirme Detayları</h4>
                  
                  {revizyonYukleniyor ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                  ) : revizyonDetaylari.length > 0 ? (
                    <div className="space-y-6">
                      {revizyonDetaylari.map((revize, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-gray-700">
                              {revize.hakemAdi || "Hakem"}
                              {revize.durum && (
                                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  revize.durum === 'KABUL' ? 'bg-green-100 text-green-800' : 
                                  revize.durum === 'RED' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {revize.durum === 'KABUL' ? 'Kabul' : 
                                   revize.durum === 'RED' ? 'Red' : 
                                   'Revizyon'}
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-gray-500">
                              {revize.createdAt ? new Date(revize.createdAt).toLocaleDateString('tr-TR') : ""}
                            </span>
                          </div>

                          {/* Güçlü Yönler */}
                          {revize.gucluYonler && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-green-700 mb-1">Güçlü Yönler:</h5>
                              <div className="text-sm text-gray-700 bg-green-50 p-2 rounded border border-green-100">
                                {revize.gucluYonler}
                              </div>
                            </div>
                          )}

                          {/* Zayıf Yönler */}
                          {revize.zayifYonler && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-red-700 mb-1">Zayıf Yönler:</h5>
                              <div className="text-sm text-gray-700 bg-red-50 p-2 rounded border border-red-100">
                                {revize.zayifYonler}
                              </div>
                            </div>
                          )}

                          {/* Genel Yorum */}
                          {revize.genelYorum && (
                            <div>
                              <h5 className="text-sm font-medium text-blue-700 mb-1">Genel Yorum:</h5>
                              <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded border border-blue-100">
                                {revize.genelYorum}
                              </div>
                            </div>
                          )}

                          {/* Makale Türü */}
                          {revize.makaleTuru && (
                            <div className="mb-3 mt-3">
                              <h5 className="text-sm font-medium text-purple-700 mb-1">Makale Türü:</h5>
                              <div className="text-sm text-gray-700 bg-purple-50 p-2 rounded border border-purple-100">
                                {revize.makaleTuru}
                              </div>
                            </div>
                          )}

                          {/* Makale Başlığı */}
                          {revize.makaleBasligi && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-indigo-700 mb-1">Makale Başlığı:</h5>
                              <div className="text-sm text-gray-700 bg-indigo-50 p-2 rounded border border-indigo-100">
                                {revize.makaleBasligi}
                              </div>
                            </div>
                          )}

                          {/* Özet Değerlendirmesi */}
                          {revize.soyut && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-cyan-700 mb-1">Özet Değerlendirmesi:</h5>
                              <div className="text-sm text-gray-700 bg-cyan-50 p-2 rounded border border-cyan-100">
                                {revize.soyut}
                              </div>
                            </div>
                          )}

                          {/* Anahtar Kelimeler */}
                          {revize.anahtarKelimeler && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-teal-700 mb-1">Anahtar Kelimeler:</h5>
                              <div className="text-sm text-gray-700 bg-teal-50 p-2 rounded border border-teal-100">
                                {revize.anahtarKelimeler}
                              </div>
                            </div>
                          )}

                          {/* Giriş */}
                          {revize.giris && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-emerald-700 mb-1">Giriş:</h5>
                              <div className="text-sm text-gray-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                                {revize.giris}
                              </div>
                            </div>
                          )}

                          {/* Gerekçeler ve Yöntemler */}
                          {revize.gerekcelerVeYontemler && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-amber-700 mb-1">Gerekçeler ve Yöntemler:</h5>
                              <div className="text-sm text-gray-700 bg-amber-50 p-2 rounded border border-amber-100">
                                {revize.gerekcelerVeYontemler}
                              </div>
                            </div>
                          )}

                          {/* Sonuçlar ve Tartışmalar */}
                          {revize.sonuclarVeTartismalar && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-orange-700 mb-1">Sonuçlar ve Tartışmalar:</h5>
                              <div className="text-sm text-gray-700 bg-orange-50 p-2 rounded border border-orange-100">
                                {revize.sonuclarVeTartismalar}
                              </div>
                            </div>
                          )}

                          {/* Referanslar */}
                          {revize.referanslar && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-lime-700 mb-1">Referanslar:</h5>
                              <div className="text-sm text-gray-700 bg-lime-50 p-2 rounded border border-lime-100">
                                {revize.referanslar}
                              </div>
                            </div>
                          )}

                          {/* Güncellik ve Özgünlük */}
                          {revize.guncellikVeOzgunluk && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-fuchsia-700 mb-1">Güncellik ve Özgünlük:</h5>
                              <div className="text-sm text-gray-700 bg-fuchsia-50 p-2 rounded border border-fuchsia-100">
                                {revize.guncellikVeOzgunluk}
                              </div>
                            </div>
                          )}

                          {/* Güven Seviyesi gösterimi */}
                          {revize.guvenSeviyesi && (
                            <div className="mt-3 flex items-center">
                              <span className="text-xs text-gray-500 mr-2">Hakem Güven Seviyesi:</span>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <svg 
                                    key={level} 
                                    className={`h-4 w-4 ${level <= revize.guvenSeviyesi! ? 'text-yellow-400' : 'text-gray-300'}`} 
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                  >
                                    <path fillRule="evenodd" d="M10 15.934l6.18 3.285a.5.5 0 0 0 .728-.527l-1.18-6.873 5-4.874a.5.5 0 0 0-.277-.853l-6.909-1.003-3.09-6.259a.5.5 0 0 0-.894 0l-3.09 6.26-6.91 1.002a.5.5 0 0 0-.276.853l5 4.874-1.18 6.873a.5.5 0 0 0 .729.527L10 15.934z" clipRule="evenodd" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm">Bu bildiri için değerlendirme bilgileri bulunamadı.</p>
                  )}
                </div>
                
                {/* Kategoriler */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Kategori</h4>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      {previewPaper.paperTopicTitle}
                    </span>
                  </div>
                </div>
                
                {/* Özet */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Özet</h4>
                  <div className="mt-1 bg-gray-50 p-4 rounded-md text-sm text-gray-700">
                    {previewPaper.abstract}
                  </div>
                </div>
                
                {/* PDF Görüntüleyici */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Bildiri Dosyası</h4>
                  {previewPaper.dokuman ? (
                    <div className="mt-2">
                      <div className="border border-gray-200 rounded-md overflow-hidden">
                        <iframe 
                          src={previewPaper.dokuman}
                          className="w-full h-96 border-0"
                          title={`${previewPaper.title} - PDF Dokümanı`}
                        ></iframe>
                      </div>
                      <div className="mt-2 flex justify-end space-x-3">
                        <a 
                          href={previewPaper.dokuman} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                          download
                        >
                          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                          </svg>
                          PDF İndir
                        </a>
                        <a 
                          href={previewPaper.dokuman}
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
                    </div>
                  ) : (
                    <div className="mt-2 p-4 bg-gray-50 rounded-md text-sm text-gray-500 italic">
                      Bu bildiri için henüz yüklenmiş bir PDF dosyası bulunmamaktadır.
                    </div>
                  )}
                </div>
                
                {/* Atanan Hakemler */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Atanan Hakemler</h4>
                  <div className="mt-1">
                    {previewPaper.reviewers && previewPaper.reviewers.length > 0 ? (
                      <ul className="space-y-2">
                        {previewPaper.reviewers.map((reviewer, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            {reviewer}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Henüz hakem atanmamış.</p>
                    )}
                  </div>
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