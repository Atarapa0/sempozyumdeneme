import { apiClient } from './api.client';
import { PaperTopic } from '@/lib/database';
import { sempozyumService } from './sempozyum.service';

interface BildiriKonusuAPI {
  id: number;
  sempozyumId: number;
  anaKonuId: number;
  baslik: string;
  aciklama: string;
  createdAt: string;
  updatedAt: string;
  anaKonu?: {
    baslik: string;
    aciklama?: string;
  };
  sempozyum?: {
    title?: string;
  };
  _count?: {
    bildiriler: number;
  };
}

// API'den gelen veriyi frontend için gerekli formata dönüştür
const mapToPaperTopic = (data: BildiriKonusuAPI): PaperTopic & { bildiriKonusuId: number; anaKonuId: number } => {
  console.log('Dönüştürülen bildiri konusu verisi:', data);
  
  return {
    id: data.id.toString(),
    title: data.baslik,
    description: data.aciklama,
    mainTopicId: data.anaKonuId.toString(),
    symposiumId: data.sempozyumId.toString(),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    bildiriKonusuId: data.id,
    anaKonuId: data.anaKonuId
  };
};

// Frontend formatından API formatına dönüştür
const mapToBildiriKonusu = (data: Partial<PaperTopic>, anaKonuId: number, sempozyumId: number): Partial<BildiriKonusuAPI> => {
  const bildiriKonusu: Partial<BildiriKonusuAPI> = {};
  
  if (data.title !== undefined) bildiriKonusu.baslik = data.title;
  if (data.description !== undefined) bildiriKonusu.aciklama = data.description;
  
  bildiriKonusu.anaKonuId = anaKonuId;
  bildiriKonusu.sempozyumId = sempozyumId;
  
  console.log('Dönüştürülen bildiri konusu verisi:', bildiriKonusu);
  return bildiriKonusu;
};

// Aktif sempozyum ID'sini almak için yardımcı fonksiyon
const getAktifSempozyumId = async (): Promise<number | null> => {
  try {
    const aktifSempozyum = await sempozyumService.getAktifSempozyum();
    if (!aktifSempozyum) {
      console.warn('⚠️ Aktif sempozyum bulunamadı!');
      return null;
    }
    return aktifSempozyum.id;
  } catch (error) {
    console.error('Aktif sempozyum bilgisi alınırken hata:', error);
    return null;
  }
};

// Tüm bildiri konularını getir
export const getBildiriKonulari = async (): Promise<(PaperTopic & { bildiriKonusuId: number })[]> => {
  try {
    console.log('Tüm bildiri konuları getiriliyor...');
    
    // Aktif sempozyumu al
    const sempozyumId = await getAktifSempozyumId();
    
    // Aktif sempozyum yoksa boş array döndür
    if (sempozyumId === null) {
      console.warn('Aktif sempozyum olmadığı için bildiri konuları getirilemedi');
      return [];
    }
    
    console.log(`Aktif sempozyum ID: ${sempozyumId} için bildiri konuları getiriliyor`);
    
    // API'ye istek at
    const response = await apiClient.get('/bildiri-konusu', {
      params: {
        sempozyumId: sempozyumId
      }
    });
    
    console.log('API yanıtı:', response.data);
    
    // API'den gelen verileri frontend formatına dönüştür
    const bildiriKonulari = Array.isArray(response.data) 
      ? response.data.map(mapToPaperTopic)
      : [];
    
    console.log('Dönüştürülen bildiri konuları:', bildiriKonulari);
    
    // Daha detaylı log ekleyelim
    if (bildiriKonulari.length > 0) {
      console.log('İlk bildiri konusu detayları:');
      console.log('- bildiriKonusuId:', bildiriKonulari[0].bildiriKonusuId, 'type:', typeof bildiriKonulari[0].bildiriKonusuId);
      console.log('- id:', bildiriKonulari[0].id, 'type:', typeof bildiriKonulari[0].id);
      console.log('- title:', bildiriKonulari[0].title);
    } else {
      console.log('UYARI: Hiç bildiri konusu döndürülmedi!');
    }
    
    return bildiriKonulari;
  } catch (error: any) {
    console.error('Bildiri konuları getirilemedi:', error);
    
    // Yetkilendirme hatası kontrolü
    if (error === 'Yetkilendirme gerekli' || (error.response && error.response.status === 401)) {
      console.warn('Yetkilendirme hatası: Kullanıcı giriş yapmamış olabilir');
      // Boş dizi döndür, kullanıcı zaten login sayfasına yönlendirildi
      return [];
    }
    
    return [];
  }
};

// Ana konuya göre bildiri konularını getir
export const getBildiriKonulariByAnaKonu = async (anaKonuId: number): Promise<(PaperTopic & { bildiriKonusuId: number })[]> => {
  try {
    console.log('Ana konuya göre bildiri konuları getiriliyor...', anaKonuId);
    
    // Aktif sempozyumu al
    const sempozyumId = await getAktifSempozyumId();
    
    // Aktif sempozyum yoksa boş array döndür
    if (sempozyumId === null) {
      console.warn('Aktif sempozyum olmadığı için bildiri konuları getirilemedi');
      return [];
    }
    
    console.log(`Aktif sempozyum ID: ${sempozyumId}, Ana Konu ID: ${anaKonuId} için bildiri konuları getiriliyor`);
    
    // API'ye istek at
    const response = await apiClient.get('/bildiri-konusu', {
      params: {
        sempozyumId: sempozyumId,
        anaKonuId: anaKonuId
      }
    });
    
    console.log('API yanıtı:', response.data);
    
    // API'den gelen verileri frontend formatına dönüştür
    const bildiriKonulari = Array.isArray(response.data) 
      ? response.data.map(mapToPaperTopic)
      : [];
    
    console.log('Dönüştürülen bildiri konuları:', bildiriKonulari);
    
    return bildiriKonulari;
  } catch (error: any) {
    console.error('Bildiri konuları getirilemedi:', error);
    
    // Yetkilendirme hatası kontrolü
    if (error === 'Yetkilendirme gerekli' || (error.response && error.response.status === 401)) {
      console.warn('Yetkilendirme hatası: Kullanıcı giriş yapmamış olabilir');
      // Boş dizi döndür, kullanıcı zaten login sayfasına yönlendirildi
      return [];
    }
    
    return [];
  }
};

// Bildiri konusu güncelle
export const updateBildiriKonusu = async (
  bildiriKonusuId: number, 
  data: Partial<PaperTopic>
): Promise<PaperTopic & { bildiriKonusuId: number }> => {
  try {
    console.log('Bildiri konusu güncelleniyor...', bildiriKonusuId);
    
    // Aktif sempozyumu al
    const sempozyumId = await getAktifSempozyumId();
    
    // Aktif sempozyum yoksa hata fırlat
    if (sempozyumId === null) {
      throw new Error('Aktif sempozyum olmadığı için bildiri konusu güncellenemedi');
    }
    
    // Ana konu ID'sini sayıya çevir
    const anaKonuId = parseInt(data.mainTopicId || '0');
    
    // API'ye gönderilecek veriyi hazırla
    const apiData = mapToBildiriKonusu(data, anaKonuId, sempozyumId);
    
    // API'ye istek at
    const response = await apiClient.put(`/bildiri-konusu/${bildiriKonusuId}`, apiData);
    
    console.log('API yanıtı:', response.data);
    
    // API'den gelen veriyi frontend formatına dönüştür
    return mapToPaperTopic(response.data.bildiriKonusu);
  } catch (error) {
    console.error('Bildiri konusu güncellenirken hata:', error);
    throw error;
  }
};

// Yeni bildiri konusu ekle
export const createBildiriKonusu = async (
  data: Partial<PaperTopic>
): Promise<PaperTopic & { bildiriKonusuId: number }> => {
  try {
    console.log('Yeni bildiri konusu ekleniyor...', data);
    
    // Aktif sempozyumu al
    const sempozyumId = await getAktifSempozyumId();
    
    // Aktif sempozyum yoksa hata fırlat
    if (sempozyumId === null) {
      throw new Error('Aktif sempozyum olmadığı için yeni bildiri konusu eklenemedi');
    }
    
    // Ana konu ID'sini sayıya çevir
    const anaKonuId = parseInt(data.mainTopicId || '0');
    
    // API'ye gönderilecek veriyi hazırla
    const apiData = mapToBildiriKonusu(data, anaKonuId, sempozyumId);
    
    // API'ye istek at
    const response = await apiClient.post('/bildiri-konusu', apiData);
    
    console.log('API yanıtı:', response.data);
    
    // API'den gelen veriyi frontend formatına dönüştür
    return mapToPaperTopic(response.data.bildiriKonusu);
  } catch (error) {
    console.error('Bildiri konusu eklenirken hata:', error);
    throw error;
  }
};

// Bildiri konusu sil
export const deleteBildiriKonusu = async (bildiriKonusuId: number): Promise<boolean> => {
  try {
    console.log('Bildiri konusu siliniyor...', bildiriKonusuId);
    
    // API'ye istek at
    await apiClient.delete(`/bildiri-konusu/${bildiriKonusuId}`);
    
    return true;
  } catch (error) {
    console.error('Bildiri konusu silinirken hata:', error);
    throw error;
  }
}; 