import { apiClient } from './api.client';

export interface RevizeGecmisi {
  id: number;
  sempozyumId: number;
  bildiriId: number;
  hakemId?: number;
  durum: string;
  gucluYonler?: string;
  zayifYonler?: string;
  genelYorum?: string;
  guvenSeviyesi?: number;
  makaleTuru?: string;
  makaleBasligi?: string;
  soyut?: string;
  anahtarKelimeler?: string;
  giris?: string;
  gerekcelerVeYontemler?: string;
  sonuclarVeTartismalar?: string;
  referanslar?: string;
  guncellikVeOzgunluk?: string;
  revizeTarihi: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * RevizeGecmisi için API servisleri
 */
export const revizeGecmisiService = {
  /**
   * Bildiri ID'sine göre RevizeGecmisi kayıtlarını getirir
   * @param bildiriId Bildiri ID
   * @returns RevizeGecmisi listesi
   */
  getByBildiriId: async (bildiriId: number): Promise<RevizeGecmisi[]> => {
    try {
      console.log(`Bildiri ID:${bildiriId} için revize geçmişi alınıyor...`);
      const response = await apiClient.get(`/revize-gecmisi?bildiriId=${bildiriId}`);
      console.log(`Revize geçmişi alındı:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Revize geçmişi alma hatası:`, error);
      
      // Detaylı hata mesajları
      if (error.response) {
        if (error.response.status === 404) {
          console.warn(`Bildiri ID:${bildiriId} için revize geçmişi bulunamadı.`);
          return [];
        } else if (error.response.status === 500) {
          throw new Error(`Sunucu hatası: Revize geçmişi alınamadı. Sistem yöneticisi ile iletişime geçin.`);
        } else if (error.response.data && error.response.data.error) {
          throw new Error(`API Hatası: ${error.response.data.error}`);
        }
      }
      
      // Hata varsa boş dizi dön
      return [];
    }
  },
  
  /**
   * Belirli bir bildiri ve hakem için RevizeGecmisi kayıtlarını getirir
   * @param bildiriId Bildiri ID
   * @param hakemId Hakem ID
   * @returns RevizeGecmisi listesi
   */
  getByBildiriAndHakem: async (bildiriId: number, hakemId: number): Promise<RevizeGecmisi[]> => {
    try {
      console.log(`Bildiri ID:${bildiriId}, Hakem ID:${hakemId} için revize geçmişi alınıyor...`);
      const response = await apiClient.get(`/revize-gecmisi?bildiriId=${bildiriId}&hakemId=${hakemId}`);
      console.log(`Bildiri ve hakem için revize geçmişi alındı:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Revize geçmişi alma hatası:`, error);
      
      // Hata varsa boş dizi dön
      return [];
    }
  }
}; 