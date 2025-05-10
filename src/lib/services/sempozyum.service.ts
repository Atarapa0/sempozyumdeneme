import { apiClient } from './api.client';

export interface Sempozyum {
  id: number;
  title: string;
  aktiflik: boolean;
  tarih: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenelBilgiler {
  id: number;
  sempozyumId: number;
  title: string;
  altbaslik: string;
  tariharaligi: string;
  geriSayimBitimTarihi: string;
  yer: string;
  organizator: string;
  kisaaciklama: string;
  uzunaciklama: string;
  docentlikbilgisi?: string;
  yil: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sempozyum için API servisleri
 */
export const sempozyumService = {
  /**
   * Tüm sempozyumları getirir
   * @returns Sempozyum listesi
   */
  getAllSempozyumlar: async (): Promise<Sempozyum[]> => {
    try {
      console.log('Tüm sempozyumlar için API isteği yapılıyor:', '/sempozyum');
      const response = await apiClient.get('/sempozyum');
      console.log('Tüm sempozyumlar API yanıtı:', response.data);
      
      if (!response.data || response.data.length === 0) {
        console.warn('Veritabanında hiç sempozyum bulunamadı!');
      } else {
        console.log(`Veritabanında ${response.data.length} sempozyum bulundu`);
        
        // Aktif sempozyum var mı kontrol et
        const aktifVar = response.data.some((s: Sempozyum) => s.aktiflik === true);
        console.log('Aktif sempozyum var mı?', aktifVar);
        
        if (!aktifVar) {
          console.warn('Dikkat: Veritabanında aktif (aktiflik=true) sempozyum bulunamadı!');
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Sempozyum listesi alınırken hata:', error);
      // Artık sahte veri dönmüyoruz, hatayı fırlatıyoruz
      throw new Error('Sempozyum verilerine erişilemedi.');
    }
  },
  
  /**
   * ID'ye göre sempozyum bilgilerini getirir
   * @param id Sempozyum ID
   * @returns Sempozyum bilgileri
   */
  getSempozyum: async (id: number): Promise<Sempozyum & { genelBilgiler: GenelBilgiler[] }> => {
    try {
      const response = await apiClient.get(`/sempozyum/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Sempozyum (ID: ${id}) alınırken hata:`, error);
      throw error;
    }
  },
  
  /**
   * Aktif sempozyum bilgilerini getirir
   * @returns Aktif sempozyum
   */
  getAktifSempozyum: async (): Promise<Sempozyum | null> => {
    try {
      console.log('Aktif sempozyum alınıyor...');
      
      // Circular dependency sorununu çözmek için doğrudan apiClient kullan
      const response = await apiClient.get('/sempozyum');
      const sempozyumlar = response.data || [];
      
      console.log('Tüm sempozyumlar:', sempozyumlar);
      
      // Aktif sempozyum bilgisi logla
      console.log('Aktif sempozyum aranıyor. Veritabanında toplam:', sempozyumlar.length);
      console.log('Mevcut sempozyum ID\'leri:', sempozyumlar.map((s: Sempozyum) => s.id).join(', '));
      
      // Aktiflik değerine göre aktif sempozyumu bul
      const aktifSempozyum = sempozyumlar.find((s: { aktiflik: boolean; }) => s.aktiflik === true);
      
      if (!aktifSempozyum) {
        console.warn('⚠️ DİKKAT: Veritabanında aktif sempozyum bulunamadı!');
        console.warn('Lütfen bir sempozyumu aktif yapın veya yeni bir sempozyum ekleyin.');
        return null;
      } else {
        console.log('✅ Aktif sempozyum bulundu:', aktifSempozyum.id);
      }
      
      return aktifSempozyum;
    } catch (error) {
      console.error('Aktif sempozyum alınırken hata:', error);
      return null;
    }
  },
  
  /**
   * Yeni bir sempozyum ekler
   * @param data Sempozyum bilgileri
   * @returns Eklenen sempozyum
   */
  createSempozyum: async (data: { title: string; tarih: string; aktiflik?: boolean }): Promise<Sempozyum> => {
    try {
      const response = await apiClient.post('/sempozyum', data);
      return response.data.sempozyum;
    } catch (error) {
      console.error('Sempozyum oluşturulurken hata:', error);
      throw error;
    }
  },
  
  /**
   * Sempozyum bilgilerini günceller
   * @param id Sempozyum ID
   * @param data Güncellenecek veriler
   * @returns Güncellenmiş sempozyum
   */
  updateSempozyum: async (id: number, data: { title?: string; tarih?: string; aktiflik?: boolean }): Promise<Sempozyum> => {
    try {
      console.log(`🔄 Sempozyum güncelleme isteği başlatılıyor - ID: ${id}`);
      console.log('Gönderilecek veriler:', data);
      
      // Kullanıcının token bilgisini kontrol et
      const token = localStorage.getItem('token');
      console.log('Token var mı?', !!token);
      
      // API isteği yap
      const response = await apiClient.put(`/sempozyum/${id}`, data);
      console.log('Sempozyum güncelleme yanıtı:', response.data);
      
      return response.data.sempozyum;
    } catch (error: any) {
      console.error(`❌ Sempozyum (ID: ${id}) güncellenirken hata:`, error);
      
      // Response detayları
      if (error.response) {
        console.error('API yanıt detayları:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // 401 veya 403 hatası için özel işlem
        if (error.response.status === 401) {
          console.error('Yetkilendirme hatası: Token geçersiz veya eksik');
        } else if (error.response.status === 403) {
          console.error('Yetki hatası: Bu işlem için admin rolü gerekiyor');
        }
      }
      
      throw error;
    }
  },
  
  /**
   * Sempozyum sil
   * @param id Sempozyum ID
   */
  deleteSempozyum: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/sempozyum/${id}`);
    } catch (error) {
      console.error(`Sempozyum (ID: ${id}) silinirken hata:`, error);
      throw error;
    }
  }
}; 