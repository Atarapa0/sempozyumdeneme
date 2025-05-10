import { apiClient } from './api.client';

// Komite üyesi interface
export interface KomiteUyesi {
  id: number;
  sempozyumId: number;
  ad: string;
  soyad: string;
  unvan: string;
  kurum: string;
  komiteTur: string;
  rol?: string;
}

// Komite üyesi ekleme için interface
export interface KomiteUyesiEkle {
  sempozyumId: number;
  ad: string;
  soyad: string;
  unvan?: string;
  kurum?: string;
  komiteTur: string;
}

// Komite üyesi güncelleme için interface
export interface KomiteUyesiGuncelle extends Partial<KomiteUyesiEkle> {
  id: number;
}

// API endpoint base URL
const BASE_URL = '/komite';

/**
 * Tüm komite üyelerini getirir
 */
export const getKomiteUyeleri = async (): Promise<KomiteUyesi[]> => {
  try {
    console.log('getKomiteUyeleri API isteği gönderiliyor:', BASE_URL);
    const response = await apiClient.get<KomiteUyesi[]>(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Komite üyeleri getirilirken hata oluştu:', error);
    return [];
  }
};

/**
 * Belirli bir sempozyuma ait komite üyelerini getirir
 * @param sempozyumId Sempozyum ID
 */
export const getKomiteUyeleriBySymposium = async (sempozyumId: number): Promise<KomiteUyesi[]> => {
  try {
    const response = await apiClient.get<KomiteUyesi[]>(`${BASE_URL}?sempozyumId=${sempozyumId}`);
    return response.data;
  } catch (error) {
    console.error(`${sempozyumId} ID'li sempozyumun komite üyeleri getirilirken hata oluştu:`, error);
    return [];
  }
};

/**
 * Belirli bir komite türüne ait üyeleri getirir
 * @param komiteTur Komite türü
 */
export const getKomiteUyeleriByType = async (komiteTur: string): Promise<KomiteUyesi[]> => {
  try {
    const response = await apiClient.get<KomiteUyesi[]>(`${BASE_URL}?komiteTur=${komiteTur}`);
    return response.data;
  } catch (error) {
    console.error(`${komiteTur} türündeki komite üyeleri getirilirken hata oluştu:`, error);
    return [];
  }
};

/**
 * ID'ye göre komite üyesini getirir
 * @param id Komite üyesi ID
 */
export const getKomiteUyesiById = async (id: number): Promise<KomiteUyesi | null> => {
  try {
    const response = await apiClient.get<KomiteUyesi>(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`${id} ID'li komite üyesi getirilirken hata oluştu:`, error);
    return null;
  }
};

/**
 * Yeni bir komite üyesi ekler
 * @param komiteUyesi Eklenecek komite üyesi bilgileri
 */
export const createKomiteUyesi = async (komiteUyesi: KomiteUyesiEkle): Promise<KomiteUyesi> => {
  try {
    console.log('createKomiteUyesi API isteği başlatılıyor');
    console.log('BASE_URL:', BASE_URL);
    console.log('Full API URL:', `${apiClient.defaults.baseURL}/${BASE_URL}`);
    console.log('Gönderilen veri:', komiteUyesi);
    
    // Veritabanı şemasında bulunmayan alanları kaldır
    // Komite API'si rol almıyor, bu alanı artık göndermeye gerek yok
    const payload = {
      sempozyumId: komiteUyesi.sempozyumId,
      ad: komiteUyesi.ad,
      soyad: komiteUyesi.soyad,
      unvan: komiteUyesi.unvan || '',
      kurum: komiteUyesi.kurum || '',
      komiteTur: komiteUyesi.komiteTur
    };
    
    console.log('Temizlenmiş ve gönderilecek veri:', payload);
    
    // API isteği yap
    const response = await apiClient.post<KomiteUyesi>(BASE_URL, payload);
    console.log('API yanıtı başarılı:', response.status);
    console.log('Dönen veri:', response.data);
    
    // Dönen veride komiteUyesi alanı varsa onu döndür
    // API'nin yapısına göre yanıt formatı değişebilir
    if (response.data && typeof response.data === 'object' && 'komiteUyesi' in response.data) {
      return response.data.komiteUyesi as KomiteUyesi;
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Komite üyesi eklenirken hata oluştu:', error);
    console.error('Hata mesajı:', error.message);
    
    // Hata detaylarını yazdır
    if (error.response) {
      console.error('API yanıt detayları:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      console.error('API yanıt başlıkları:', error.response.headers);
      
      // Sunucunun hata mesajını kontrol et ve potansiyel çözüm öner
      if (error.response.status === 500) {
        console.error('Sunucu hatası: Backend tarafında bir sorun var, API yanıtını kontrol edin');
        if (error.response.data?.error) {
          console.error('Sunucu hata mesajı:', error.response.data.error);
          if (error.response.data?.detay) {
            console.error('Hata detayı:', error.response.data.detay);
          }
        }
      } else if (error.response.status === 404) {
        console.error('404 Not Found: API endpoint bulunamadı. URL doğru mu?');
      } else if (error.response.status === 403) {
        console.error('403 Forbidden: Bu işlem için yetkiniz yok veya oturum açmanız gerekiyor');
      }
    } else if (error.request) {
      console.error('API yanıtı alınamadı. Sunucu çalışıyor mu?', error.request);
    }
    
    // Hatayı üst katmana ilet
    throw error;
  }
};

/**
 * Mevcut bir komite üyesini günceller
 * @param komiteUyesi Güncellenecek komite üyesi bilgileri
 */
export const updateKomiteUyesi = async (komiteUyesi: KomiteUyesiGuncelle): Promise<KomiteUyesi> => {
  try {
    const response = await apiClient.put<KomiteUyesi>(`${BASE_URL}/${komiteUyesi.id}`, komiteUyesi);
    return response.data;
  } catch (error) {
    console.error(`${komiteUyesi.id} ID'li komite üyesi güncellenirken hata oluştu:`, error);
    throw error;
  }
};

/**
 * Bir komite üyesini siler
 * @param id Silinecek komite üyesi ID
 */
export const deleteKomiteUyesi = async (id: number): Promise<void> => {
  try {
    console.log(`deleteKomiteUyesi API isteği gönderiliyor: ${BASE_URL}/${id}`);
    await apiClient.delete(`${BASE_URL}/${id}`);
    console.log('Komite üyesi başarıyla silindi');
  } catch (error: any) {
    console.error(`${id} ID'li komite üyesi silinirken hata oluştu:`, error);
    
    if (error.response) {
      console.error('API yanıt detayları:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    throw error;
  }
}; 