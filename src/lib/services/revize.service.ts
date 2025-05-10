import { apiClient } from './api.client';
import { sempozyumService } from './sempozyum.service';

// Revize modeli
export interface Revize {
  id?: number;
  sempozyumId: number;
  bildiriId: number;
  hakemId?: number;  // Hakem ID
  hakemAdi?: string; // Hakem adı (ad + soyad)
  durum: 'KABUL' | 'RED' | 'REVIZE';
  gucluYonler?: string;
  zayifYonler?: string;
  genelYorum?: string;
  guvenSeviyesi?: number;
  createdAt?: string;
  updatedAt?: string;
  bildiri?: {
    baslik: string;
    durum: string;
  };
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

/**
 * Revize için API servisleri
 */
export const revizeService = {
  /**
   * Bildiri için revize değerlendirmesi ekle
   * @param revizeData Revize verileri
   * @returns Eklenen revize
   */
  createRevize: async (revizeData: Omit<Revize, 'id' | 'createdAt' | 'updatedAt'>): Promise<Revize> => {
    try {
      console.log('Revize ekleniyor:', revizeData);
      
      // Token kontrolü
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      // Kullanıcı bilgilerini al
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user || !user.id) {
        throw new Error('Kullanıcı bilgisi bulunamadı.');
      }
      
      // Birden çok olası rol formatını kontrol et
      const isReviewer = 
        user.role === 'reviewer' || 
        user.rolId === 3 || 
        user.rol === 'reviewer' || 
        user.rol === 3 ||
        (user.roller && Array.isArray(user.roller) && user.roller.includes('reviewer'));
      
      if (!isReviewer) {
        throw new Error('Bu işlemi sadece hakem rolündeki kullanıcılar yapabilir.');
      }
      
      // BE'nin beklediği durumu ayarla
      const backendDurum = revizeData.durum === 'KABUL' ? 'kabul_edildi' :
                          revizeData.durum === 'RED' ? 'reddedildi' :
                          revizeData.durum === 'REVIZE' ? 'revizyon_istendi' : 'incelemede';
      
      // API'ye gönderilecek nihai payload
      const apiPayload = {
        sempozyumId: revizeData.sempozyumId,
        bildiriId: revizeData.bildiriId,
        durum: revizeData.durum,
        bildiriDurum: backendDurum,
        gucluYonler: revizeData.gucluYonler || '',
        zayifYonler: revizeData.zayifYonler || '',
        genelYorum: revizeData.genelYorum || '',
        guvenSeviyesi: revizeData.guvenSeviyesi || 3,
        // Yeni değerlendirme alanları
        makaleTuru: revizeData.makaleTuru || '',
        makaleBasligi: revizeData.makaleBasligi || '',
        soyut: revizeData.soyut || '',
        anahtarKelimeler: revizeData.anahtarKelimeler || '',
        giris: revizeData.giris || '',
        gerekcelerVeYontemler: revizeData.gerekcelerVeYontemler || '',
        sonuclarVeTartismalar: revizeData.sonuclarVeTartismalar || '',
        referanslar: revizeData.referanslar || '',
        guncellikVeOzgunluk: revizeData.guncellikVeOzgunluk || ''
      };
      
      console.log('API gönderilecek veri:', apiPayload);
      
      // Revize ekleme isteği
      const response = await apiClient.post('/revize', apiPayload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Bildiri durumunu otomatik değiştirmiyoruz artık
      // Her hakeme değerlendirme şansı vermek için bildiri durumunu sadece admin değiştirecek
      // ya da tüm hakemler değerlendirme yaptığında otomatik değişecek
      
      console.log('Revize başarıyla eklendi:', response.data);
      return response.data.revize;
    } catch (error: any) {
      console.error('Revize ekleme hatası:', error);
      console.error('Hata detayları:', {
        message: error.message,
        responseData: error.response?.data,
        responseStatus: error.response?.status,
        responseHeaders: error.response?.headers
      });
      
      // Detaylı hata mesajları
      if (error.response) {
        if (error.response.status === 401) {
          const errorMessage = error.response.data?.error || 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.';
          console.error('401 Yetkilendirme hatası:', errorMessage);
          
          // Token hatasını kullanıcıya bildir ve localStorage'dan temizle
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          
          throw new Error(errorMessage);
        } else if (error.response.status === 403) {
          throw new Error('Bu işlemi yapmak için yetkiniz bulunmuyor.');
        } else if (error.response.status === 500) {
          const errorMessage = error.response.data?.error || 'Sunucu hatası: Değerlendirme eklenemedi. Sistem yöneticisi ile iletişime geçin.';
          throw new Error(errorMessage);
        } else if (error.response.data && error.response.data.error) {
          throw new Error(`API Hatası: ${error.response.data.error}`);
        }
      }
      
      throw new Error(error.message || 'Revize eklenemedi. Lütfen daha sonra tekrar deneyin.');
    }
  },
  
  /**
   * Belirli bir bildiriye ait revizeleri getirir
   * @param bildiriId Bildiri ID
   * @returns Revize listesi
   */
  getRevizesByBildiriId: async (bildiriId: number): Promise<Revize[]> => {
    try {
      // Önce aktif sempozyumu al
      const aktifSempozyum = await sempozyumService.getAktifSempozyum();
      
      if (!aktifSempozyum) {
        console.warn('Aktif sempozyum bulunamadı, revize listesi boş dönecek');
        return [];
      }
      
      console.log(`Bildiri ID ${bildiriId} için revizeler alınıyor...`);
      
      // Token kontrolü
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      const response = await apiClient.get(`/revize?bildiriId=${bildiriId}&sempozyumId=${aktifSempozyum.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("API'dan gelen revizeler:", response.data);
      
      // API'dan gelen verilerin ayrıntılı analizi
      if (Array.isArray(response.data) && response.data.length > 0) {
        const ornekRevize = response.data[0];
        console.log("Örnek revize veri yapısı:", {
          alanlar: Object.keys(ornekRevize),
          yeniAlanlarMevcut: {
            makaleTuru: ornekRevize.makaleTuru !== undefined,
            makaleBasligi: ornekRevize.makaleBasligi !== undefined,
            soyut: ornekRevize.soyut !== undefined,
            anahtarKelimeler: ornekRevize.anahtarKelimeler !== undefined,
            giris: ornekRevize.giris !== undefined,
            gerekcelerVeYontemler: ornekRevize.gerekcelerVeYontemler !== undefined,
            sonuclarVeTartismalar: ornekRevize.sonuclarVeTartismalar !== undefined,
            referanslar: ornekRevize.referanslar !== undefined,
            guncellikVeOzgunluk: ornekRevize.guncellikVeOzgunluk !== undefined
          }
        });
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Revize listesi alma hatası:', error);
      
      // Detaylı hata mesajları
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.');
        } else if (error.response.status === 403) {
          throw new Error('Bu revizeleri görüntülemek için yetkiniz bulunmuyor.');
        } else if (error.response.status === 500) {
          throw new Error('Sunucu hatası: Revizeler alınamadı. Sistem yöneticisi ile iletişime geçin.');
        }
      }
      
      throw new Error(error.message || 'Revizeler alınamadı. Lütfen daha sonra tekrar deneyin.');
    }
  },
  
  /**
   * Belirli bir revizenin detaylarını getirir
   * @param revizeId Revize ID
   * @returns Revize detayları
   */
  getRevizeById: async (revizeId: number): Promise<Revize> => {
    try {
      console.log(`Revize ID:${revizeId} için veri çekiliyor...`);
      
      // Token kontrolü
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      const response = await apiClient.get(`/revize/${revizeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`Revize ID:${revizeId} verileri başarıyla alındı:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Revize detayı alma hatası:', error);
      
      // Detaylı hata mesajları
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.');
        } else if (error.response.status === 404) {
          throw new Error('Revize bulunamadı.');
        } else if (error.response.status === 403) {
          throw new Error('Bu revizeyi görüntülemek için yetkiniz bulunmuyor.');
        } else if (error.response.status === 500) {
          throw new Error('Sunucu hatası: Revize detayları alınamadı. Sistem yöneticisi ile iletişime geçin.');
        }
      }
      
      throw new Error(error.message || 'Revize detayları alınamadı. Lütfen daha sonra tekrar deneyin.');
    }
  },
  
  /**
   * Belirli bir hakeme ait revizeleri getirir
   * @param hakemId Hakem ID
   * @returns Revize listesi
   */
  getRevizesByHakemId: async (hakemId: number): Promise<Revize[]> => {
    try {
      console.log(`Hakem ID ${hakemId} için değerlendirmeler alınıyor...`);
      
      // Önce aktif sempozyumu al
      const aktifSempozyum = await sempozyumService.getAktifSempozyum();
      
      if (!aktifSempozyum) {
        console.warn('Aktif sempozyum bulunamadı, revize listesi boş dönecek');
        return [];
      }
      
      // Token kontrolü
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      // API isteği - Özel endpoint varsa onu kullan, yoksa filtreleme yap
      try {
        // Önce özel endpointi dene
        const response = await apiClient.get(`/revize/hakem/${hakemId}?sempozyumId=${aktifSempozyum.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return response.data;
      } catch (err) {
        // Özel endpoint yoksa, tüm revizeleri getir ve filtrele
        console.log('Özel endpoint bulunamadı, tüm revizeler üzerinden filtreleme yapılıyor');
        const response = await apiClient.get(`/revize?sempozyumId=${aktifSempozyum.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Sadece ilgili hakeme ait olanları filtrele
        if (Array.isArray(response.data)) {
          return response.data.filter((revize: Revize) => revize.hakemId === hakemId);
        }
        return [];
      }
    } catch (error: any) {
      console.error('Hakem revizeleri alınırken hata:', error);
      throw new Error(error.message || 'Hakem değerlendirmeleri alınamadı. Lütfen daha sonra tekrar deneyin.');
    }
  },
  
  /**
   * Belirli bir hakeme ve bildiriye ait revizeleri getirir
   * @param bildiriId Bildiri ID
   * @param hakemId Hakem ID
   * @returns Revize listesi
   */
  getRevizesByHakemAndBildiriId: async (bildiriId: number, hakemId: number): Promise<Revize[]> => {
    try {
      // Önce aktif sempozyumu al
      const aktifSempozyum = await sempozyumService.getAktifSempozyum();
      
      if (!aktifSempozyum) {
        console.warn('Aktif sempozyum bulunamadı, revize listesi boş dönecek');
        return [];
      }
      
      console.log(`Bildiri ID ${bildiriId} ve Hakem ID ${hakemId} için revizeler alınıyor...`);
      
      // Token kontrolü
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      const response = await apiClient.get(`/revize?bildiriId=${bildiriId}&hakemId=${hakemId}&sempozyumId=${aktifSempozyum.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`Hakem ID ${hakemId} ve Bildiri ID ${bildiriId} için revizeler:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Hakem revizeleri alma hatası:', error);
      
      // Detaylı hata mesajları
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.');
        } else if (error.response.status === 403) {
          throw new Error('Bu revizeleri görüntülemek için yetkiniz bulunmuyor.');
        } else if (error.response.status === 500) {
          throw new Error('Sunucu hatası: Revizeler alınamadı. Sistem yöneticisi ile iletişime geçin.');
        }
      }
      
      throw new Error(error.message || 'Revizeler alınamadı. Lütfen daha sonra tekrar deneyin.');
    }
  }
}; 