import { apiClient } from './api.client';
import axios from 'axios';

export interface Bildiri {
  id: number;
  baslik: string;
  baslikEn: string;
  ozet: string;
  ozetEn: string;
  yazarlar: string[];
  anahtarKelimeler: string[];
  anahtarKelimelerEn: string[];
  sunumTipi: string;
  sunumYeri?: string;
  kongreyeMesaj?: string;
  intihalPosterDosya?: string;
  anaKonuId: number;
  bildiriKonusuId: number;
  dokuman?: string;
  kullaniciId: number;
  durum: string;
  revizeNotu?: string;
  createdAt: string;
  updatedAt: string;
  sempozyum?: {
    id: number;
    title: string;
  };
  anaKonu?: {
    baslik: string;
  };
  bildiriKonusu?: {
    baslik: string;
  };
  kullanici?: {
    ad: string;
    soyad: string;
    unvan: string;
    eposta: string;
  };
  hakemler?: Array<{
    id: number;
    ad: string;
    soyad: string;
    unvan?: string;
    eposta: string;
  }>;
  _count?: {
    revizeler: number;
  };
}

export interface BildiriDurum {
  id: number;
  ad: string;
}

/**
 * Bildiri için API servisleri
 */
export const bildiriService = {
  /**
   * Tüm bildirileri getirir
   * @returns Bildiri listesi
   */
  getAll: async (): Promise<Bildiri[]> => {
    try {
      // Önce aktif sempozyumu al
      const { sempozyumService } = await import('./sempozyum.service');
      const aktifSempozyum = await sempozyumService.getAktifSempozyum();
      
      if (!aktifSempozyum) {
        console.warn('Aktif sempozyum bulunamadı, bildiri listesi boş dönecek');
        return [];
      }
      
      console.log(`Aktif sempozyumdan (ID: ${aktifSempozyum.id}) tüm bildiriler alınıyor...`);
      
      // Aktif sempozyum ID'si ile tüm bildirileri al
      const response = await apiClient.get(`/bildiri?sempozyumId=${aktifSempozyum.id}`);
      console.log('Bildiriler başarıyla alındı:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Bildiri alma hatası:', error);
      
      if (error.response && error.response.status === 401) {
        throw new Error('Oturumunuz sonlanmış olabilir. Lütfen tekrar giriş yapın.');
      }
      
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      
      throw new Error('Bildiriler alınamadı. Lütfen daha sonra tekrar deneyin.');
    }
  },
  
  /**
   * Kullanıcıya ait bildirileri getirir
   * @param kullaniciId Kullanıcı ID
   * @returns Kullanıcının bildirileri
   */
  getByKullanici: async (kullaniciId: number): Promise<Bildiri[]> => {
    try {
      // Önce aktif sempozyumu al
      const { sempozyumService } = await import('./sempozyum.service');
      const aktifSempozyum = await sempozyumService.getAktifSempozyum();
      
      if (!aktifSempozyum) {
        console.warn('Aktif sempozyum bulunamadı, bildiri listesi boş dönecek');
        return [];
      }
      
      console.log(`Kullanıcı ID ${kullaniciId} için aktif sempozyumdan (ID: ${aktifSempozyum.id}) bildiriler alınıyor...`);
      
      // Aktif sempozyum ID'si ile kullanıcının bildirilerini al
      const response = await apiClient.get(`/bildiri?kullaniciId=${kullaniciId}&sempozyumId=${aktifSempozyum.id}`);
      return response.data;
    } catch (error) {
      console.error('Kullanıcı bildirileri alma hatası:', error);
      throw new Error('Kullanıcı bildirileri alınamadı');
    }
  },
  
  /**
   * Hakeme atanan bildirileri getirir
   * @param hakemId Hakem ID
   * @returns Hakeme atanan bildiriler
   */
  getByHakem: async (hakemId: number): Promise<Bildiri[]> => {
    try {
      console.log(`Hakem ID ${hakemId} için bildiriler alınıyor...`);
      
      // Önce aktif sempozyumu al
      const { sempozyumService } = await import('./sempozyum.service');
      const aktifSempozyum = await sempozyumService.getAktifSempozyum();
      
      if (!aktifSempozyum) {
        console.warn('Aktif sempozyum bulunamadı, bildiri listesi boş dönecek');
        return [];
      }
      
      console.log(`Aktif sempozyum ID: ${aktifSempozyum.id}`);
      
      // Aktif sempozyum ID'si ile hakeme atanan bildirileri al
      const response = await apiClient.get(`/bildiri?hakemId=${hakemId}&sempozyumId=${aktifSempozyum.id}`);
      console.log(`Hakem bildirileri yanıtı:`, response.data);
      
      // Eğer yanıt dizisi değilse, boş dizi döndür
      if (!Array.isArray(response.data)) {
        console.warn('API yanıtı dizi değil:', response.data);
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error('Hakem bildirileri alma hatası:', error);
      
      // API hatası durumunda boş dizi döndür
      return [];
    }
  },
  
  /**
   * ID'ye göre bildiri bilgilerini getirir
   * @param id Bildiri ID
   * @returns Bildiri bilgileri
   */
  getById: async (id: number): Promise<Bildiri> => {
    try {
      console.log(`Bildiri ID:${id} için veri çekiliyor...`);
      const response = await apiClient.get(`/bildiri/${id}`);
      
      // Yanıt kontrolü
      if (!response.data) {
        throw new Error(`Bildiri (ID:${id}) için geçerli veri alınamadı.`);
      }
      
      console.log(`Bildiri ID:${id} verileri başarıyla alındı:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Bildiri ID:${id} alma hatası:`, error);
      
      // 500 hatası durumunda, basitleştirilmiş bir yaklaşım dene
      if (error.response && error.response.status === 500) {
        try {
          console.log(`Bildiri ID:${id} için alternatif fetching yöntemi deneniyor...`);
          
          // Aktif sempozyum ID'sini al
          const { sempozyumService } = await import('./sempozyum.service');
          const aktifSempozyum = await sempozyumService.getAktifSempozyum();
          
          if (!aktifSempozyum) {
            throw new Error('Aktif sempozyum bulunamadı.');
          }
          
          // Tüm bildirileri getir ve istenen ID'yi filtrele
          const bildiriler = await apiClient.get(`/bildiri?sempozyumId=${aktifSempozyum.id}`);
          
          if (!Array.isArray(bildiriler.data)) {
            throw new Error('Bildiriler listesi alınamadı.');
          }
          
          const istenenBildiri = bildiriler.data.find((b: Bildiri) => b.id === id);
          
          if (!istenenBildiri) {
            throw new Error(`Bildiri (ID:${id}) bulunamadı.`);
          }
          
          console.log(`Bildiri ID:${id} alternatif yolla bulundu.`);
          return istenenBildiri;
        } catch (fallbackError: any) {
          console.error(`Alternatif bildiri getirme hatası:`, fallbackError);
          // Fallback de başarısız olursa, orijinal hatayı devam ettir
        }
      }
      
      // Detaylı hata mesajları
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error(`Bildiri (ID:${id}) bulunamadı.`);
        } else if (error.response.status === 500) {
          throw new Error(`Sunucu hatası: Bildiri (ID:${id}) alınamadı. Sistem yöneticisi ile iletişime geçin.`);
        } else if (error.response.data && error.response.data.error) {
          throw new Error(`API Hatası: ${error.response.data.error}`);
        }
      }
      
      throw new Error(error.message || `Bildiri (ID:${id}) alınamadı`);
    }
  },
  
  /**
   * Yeni bir bildiri ekler
   * @param data Bildiri verileri
   * @returns Eklenen bildiri
   */
  add: async (data: {
    baslik: string;
    baslikEn: string;
    ozet: string;
    ozetEn: string;
    yazarlar: string[];
    anahtarKelimeler: string[];
    anahtarKelimelerEn: string[];
    sunumTipi: string;
    sunumYeri?: string;
    kongreyeMesaj?: string;
    intihalPosterDosya?: string;
    anaKonuId: number;
    bildiriKonusuId: number;
    dokuman?: string;
    kullaniciId: number;
    sempozyumId: number;
  }): Promise<Bildiri> => {
    // Token'ı dışarıda tanımla ki tüm scope'lardan erişilebilsin
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    try {
      console.log('Token durumu:', token ? 'Mevcut' : 'Bulunamadı');
      if (token) {
        console.log('Token uzunluğu:', token.length);
        console.log('Token öneki:', token.substring(0, 15) + '...');
      }
      
      if (!token) {
        throw new Error('Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.');
      }

      console.log('📝 Bildiri verileri gönderiliyor - Doğrudan apiClient kullanılıyor');
      
      // Axios yerine apiClient kullan - bildiriler yerine bildiri endpoint'i kullan
      const response = await apiClient.post('/bildiri', data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Bildiri başarıyla gönderildi:', response.data);
      
      return response.data.bildiri || response.data;
    } catch (error: any) {
      console.error('❌ Bildiri ekleme işlemi başarısız:', error);
      
      // Detaylı hata bilgisini logla
      if (error.response) {
        console.error('Hata yanıtı:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // HTTP durum koduna göre özel hata mesajları 
        if (error.response.status === 401) {
          // Fetch API ile tekrar dene
          const currentToken = token; // Token'ı değişkene atayarak mevcut değerini koruyalım
          return await tryWithFetch(currentToken, data);
        } else if (error.response.status === 400) {
          throw new Error(error.response.data?.error || 'Geçersiz bildiri verileri. Lütfen tüm alanları kontrol ediniz.');
        } else if (error.response.status === 500) {
          throw new Error('Sunucu hatası. Lütfen daha sonra tekrar deneyin veya sistem yöneticisi ile iletişime geçin.');
        }
      }
      
      throw new Error(error.message || 'Bildiri eklenemedi');
    }
  },
  
  /**
   * Bir bildiriyi günceller
   * @param data Güncellenecek veriler
   * @returns Güncellenmiş bildiri
   */
  update: async (data: Partial<Bildiri> & { id: number } | number, updateData?: Partial<Bildiri>): Promise<Bildiri> => {
    try {
      let id: number;
      let updatePayload: Partial<Bildiri>;
      
      // İlk parametre sayı ise, eski imza kullanılıyor demektir
      if (typeof data === 'number') {
        id = data;
        updatePayload = updateData || {};
      } else {
        // İlk parametre obje ise, yeni imza kullanılıyor demektir
        id = data.id;
        updatePayload = { ...data };
        delete updatePayload.id; // ID'yi payload'dan çıkar
      }
      
      // Durum değeri kontrol ve düzeltme
      if (updatePayload.durum) {
        console.log("Orijinal durum değeri:", updatePayload.durum);
        
        // REVIZE_YAPILDI değerini kontrol et ve gerekirse düzelt
        if (updatePayload.durum === "REVIZE_YAPILDI") {
          console.log("REVIZE_YAPILDI durumu tespit edildi, backend formatına dönüştürülüyor");
          // Backend'in beklediği formata çevir
          updatePayload.durum = "revize_yapildi";
        }
        
        console.log("Düzeltilmiş durum değeri:", updatePayload.durum);
      }
      
      console.log(`Bildiri ID:${id} güncelleniyor:`, updatePayload);
      
      const response = await apiClient.put(`/bildiri/${id}`, updatePayload);
      return response.data.bildiri || response.data;
    } catch (error) {
      console.error('Bildiri güncelleme hatası:', error);
      throw new Error('Bildiri güncellenemedi');
    }
  },
  
  /**
   * Bir bildiriyi siler
   * @param id Silinecek bildiri ID
   * @returns İşlem sonucu
   */
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete(`/bildiri/${id}`);
      return response.data;
    } catch (error) {
      console.error('Bildiri silme hatası:', error);
      throw new Error('Bildiri silinemedi');
    }
  },
  
  /**
   * Bildiri durum bilgilerini getirir
   * @returns Bildiri durumları listesi
   */
  getDurumlar: async (): Promise<BildiriDurum[]> => {
    try {
      const response = await apiClient.get('/bildiri/durumlar');
      return response.data;
    } catch (error) {
      console.error('Bildiri durumları alma hatası:', error);
      throw new Error('Bildiri durumları alınamadı');
    }
  },
  
  /**
   * Bildirinin durumunu değiştirir
   * @param id Bildiri ID
   * @param durumId Yeni durum ID
   * @returns Güncellenmiş bildiri
   */
  updateDurum: async (id: number, durumId: number): Promise<Bildiri> => {
    try {
      const response = await apiClient.patch(`/bildiri/${id}/durum`, { durumId });
      return response.data;
    } catch (error) {
      console.error('Bildiri durumu güncelleme hatası:', error);
      throw new Error('Bildiri durumu güncellenemedi');
    }
  },
  
  /**
   * Bildiriye hakem atar
   * @param bildiriId Bildiri ID
   * @param hakemIds Hakem ID'leri dizisi
   * @returns İşlem sonucu
   */
  assignReviewers: async (bildiriId: number | string, hakemIds: number[]): Promise<any> => {
    try {
      // localStorage'dan token'ı al
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      console.log(`Bildiri ID:${bildiriId} için hakem atama işlemi yapılıyor`, { hakemIds });
      
      // Önce admin/assign-reviewers proxy endpoint'ini dene
      try {
        // Proxy endpoint'i kullan
        const response = await fetch(`/api/admin/assign-reviewers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            bildiriId,
            hakemIds
          })
        });
        
        // Yanıt kontrolü
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Proxy endpoint hatası:', errorData);
          
          // Proxy başarısız olursa, doğrudan endpoint'e istek yapabiliriz
          console.log('Doğrudan hakemler endpoint\'ine istek yapılıyor...');
          return await tryDirectEndpoint(bildiriId, hakemIds, token);
        }
        
        const result = await response.json();
        return result;
      } catch (proxyError) {
        console.error('Proxy endpoint hatası:', proxyError);
        
        // Proxy başarısız olursa, doğrudan endpoint'e istek yapabiliriz
        console.log('Doğrudan hakemler endpoint\'ine istek yapılıyor...');
        return await tryDirectEndpoint(bildiriId, hakemIds, token);
      }
    } catch (error: any) {
      console.error('Hakem atama hatası:', error);
      throw error;
    }
  },
  
  /**
   * Bildiriye ait revize değerlendirmelerini sıfırlar
   * @param bildiriId Bildiri ID
   * @returns Sıfırlama işlemi sonucu
   */
  resetReviews: async (bildiriId: number): Promise<any> => {
    try {
      console.log(`Bildiri ID:${bildiriId} için revize değerlendirmeleri sıfırlanıyor...`);
      const response = await apiClient.post(`/bildiri/${bildiriId}/revize-reset`);
      console.log(`Bildiri ID:${bildiriId} revizeleri sıfırlandı:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Revize sıfırlama hatası:`, error);
      
      // Detaylı hata mesajları
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error(`Bildiri (ID:${bildiriId}) bulunamadı.`);
        } else if (error.response.status === 400) {
          throw new Error(error.response.data.error || `İşlem yapılamadı: Bildiri uygun durumda değil.`);
        } else if (error.response.status === 500) {
          throw new Error(`Sunucu hatası: Revizeler sıfırlanamadı. Sistem yöneticisi ile iletişime geçin.`);
        } else if (error.response.data && error.response.data.error) {
          throw new Error(`API Hatası: ${error.response.data.error}`);
        }
      }
      
      throw new Error(error.message || `Revize değerlendirmeleri sıfırlanamadı`);
    }
  },
  
  /**
   * Bildiri için hakeme özel değerlendirme durumunu getirir
   * @param bildiriId Bildiri ID
   * @param hakemId Hakem ID
   * @returns {Promise<{durum: string|null, yapildi: boolean}>} Değerlendirme durumu ve yapılıp yapılmadığı
   */
  getHakemDegerlendirmeDurumu: async (bildiriId: number, hakemId: number): Promise<{durum: string|null, yapildi: boolean}> => {
    return getHakemDegerlendirmeDurumu(bildiriId, hakemId);
  }
};

/**
 * Axios başarısız olursa Fetch API ile tekrar dene
 */
async function tryWithFetch(token: string | null, data: any): Promise<Bildiri> {
  console.log('⚠️ Axios 401 hatası nedeniyle Fetch API ile tekrar deneniyor');
  
  if (!token) {
    throw new Error('Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.');
  }
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bildiri`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    console.log('Fetch yanıt durumu:', response.status);
    console.log('Fetch yanıt başlıkları:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Fetch API yanıt hatası:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      
      if (response.status === 401) {
        throw new Error('Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.');
      } else if (response.status === 400) {
        throw new Error(errorData?.error || 'Geçersiz bildiri verileri. Lütfen tüm alanları kontrol ediniz.');
      } else {
        throw new Error(`Sunucu yanıtı: ${response.status} ${response.statusText}`);
      }
    }
    
    const responseData = await response.json();
    console.log('✅ Fetch API ile bildiri başarıyla gönderildi:', responseData);
    
    return responseData.bildiri || responseData;
  } catch (fetchError: any) {
    console.error('❌ Fetch API ile gönderme hatası:', fetchError);
    throw new Error(fetchError.message || 'Bildiri gönderilemedi');
  }
}

/**
 * Doğrudan hakemler endpoint'ine istek yapan yardımcı fonksiyon
 */
async function tryDirectEndpoint(bildiriId: number | string, hakemIds: number[], token: string): Promise<any> {
  try {
    console.log(`Doğrudan endpoint çağrısı - Bildiri ID:${bildiriId}`, { hakemIds });
    
    const response = await fetch(`/api/bildiri/${bildiriId}/hakemler`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        hakemler: hakemIds // API'nin beklediği şekilde hakemler adıyla gönderilmeli
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Doğrudan endpoint hatası:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Doğrudan endpoint hatası:', error);
    throw new Error(error.message || 'Doğrudan hakemler endpoint\'i çağrısı başarısız oldu.');
  }
}

/**
 * Bildiri için hakeme özel değerlendirme durumunu getir
 * @param bildiriId Bildiri ID
 * @param hakemId Hakem ID
 * @returns {Promise<{durum: string|null, yapildi: boolean}>} Değerlendirme durumu ve yapılıp yapılmadığı
 */
export async function getHakemDegerlendirmeDurumu(bildiriId: number, hakemId: number): Promise<{durum: string|null, yapildi: boolean}> {
  try {
    // Token kontrolü
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
    }
    
    console.log(`[Debug] getHakemDegerlendirmeDurumu çağrıldı - bildiriId: ${bildiriId}, hakemId: ${hakemId}`);
    
    // API'den revize tablosunu sorgula
    const response = await fetch(`/api/revize?bildiriId=${bildiriId}&hakemId=${hakemId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Revize verisi alınamadı. Status: ${response.status}`);
      return { durum: null, yapildi: false };
    }
    
    const data = await response.json();
    console.log(`[Debug] Hakem (${hakemId}) için bildiri (${bildiriId}) değerlendirme yanıtı:`, data);
    
    // Revize kayıtları varsa, en son revizeyi al ve durumunu döndür
    if (Array.isArray(data) && data.length > 0) {
      const sonRevize = data[0]; // Sıralı geldiğini varsayıyoruz, ilk eleman en son revize olmalı
      console.log(`[Debug] Bulunan revize verisi:`, sonRevize);
      return { 
        durum: sonRevize.durum, 
        yapildi: true 
      };
    }
    
    console.log(`[Debug] Revize kaydı bulunamadı - bildiriId: ${bildiriId}, hakemId: ${hakemId}`);
    // Revize kaydı yoksa
    return { durum: null, yapildi: false };
  } catch (error) {
    console.error('Hakem değerlendirme durumu alınamadı:', error);
    return { durum: null, yapildi: false };
  }
} 