import { MainTopic } from '../database';
import { apiClient } from './api.client';
import { sempozyumService } from './sempozyum.service';

// Frontend için Türkçe alan adları ile genişletilmiş MainTopic tipi
export interface AnaKonuFrontend extends MainTopic {
  baslik: string;
  aciklama: string;
  sempozyumId: string;
  anaKonuId?: number; // API'den gelen ID'yi saklamak için
}

// API'den gelen veriyi frontend'e uygun formata dönüştürme
const mapApiToFrontend = (data: any): AnaKonuFrontend => {
  console.log('API\'den gelen veri:', data);
  
  return {
    id: data.id.toString(),
    title: data.baslik,
    description: data.aciklama,
    icon: data.icon || '',
    symposiumId: data.sempozyumId.toString(),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    baslik: data.baslik,
    aciklama: data.aciklama,
    sempozyumId: data.sempozyumId.toString(),
    anaKonuId: data.id // API'den gelen ID'yi saklıyoruz
  };
};

// Frontend'den API'ye uygun formata dönüştürme
const mapFrontendToApi = (data: Partial<AnaKonuFrontend>): any => {
  console.log('API\'ye gönderilen veri:', data);
  
  return {
    baslik: data.baslik || data.title,
    aciklama: data.aciklama || data.description,
    icon: data.icon,
    sempozyumId: parseInt(data.sempozyumId || data.symposiumId || '0')
  };
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

// Aktif sempozyumun ana konularını getir
export const getAktifAnaKonular = async (): Promise<AnaKonuFrontend[]> => {
  try {
    console.log('Ana konular getiriliyor...');
    
    // Aktif sempozyumu al
    const sempozyumId = await getAktifSempozyumId();
    
    // Aktif sempozyum yoksa boş array döndür
    if (sempozyumId === null) {
      console.warn('Aktif sempozyum olmadığı için ana konular getirilemedi');
      return [];
    }
    
    console.log(`Aktif sempozyum ID: ${sempozyumId} için ana konular getiriliyor`);
    
    // API'ye istek at
    const response = await apiClient.get('/ana-konu', {
      params: {
        sempozyumId: sempozyumId
      }
    });
    
    console.log('API yanıtı:', response.data);
    
    // API'den gelen verileri frontend formatına dönüştür
    const anaKonular = Array.isArray(response.data) 
      ? response.data.map(mapApiToFrontend)
      : [];
    
    console.log('Dönüştürülen ana konular:', anaKonular);
    
    return anaKonular;
  } catch (error) {
    console.error('Ana konular getirilirken hata:', error);
    return [];
  }
};

// Ana konu güncelle
export const updateAnaKonu = async (id: string, data: Partial<AnaKonuFrontend>): Promise<AnaKonuFrontend> => {
  try {
    console.log('Ana konu güncelleniyor:', id, data);
    
    // Aktif sempozyumu al
    const sempozyumId = await getAktifSempozyumId();
    
    // Aktif sempozyum yoksa hata fırlat
    if (sempozyumId === null) {
      throw new Error('Aktif sempozyum olmadığı için ana konu güncellenemedi');
    }
    
    // API'ye gönderilecek veriyi hazırla
    const apiData = {
      ...mapFrontendToApi(data),
      sempozyumId: sempozyumId // Aktif sempozyum ID'sini kullan
    };
    
    // API'ye istek at
    const response = await apiClient.put(`/ana-konu/${id}`, apiData);
    
    console.log('API yanıtı:', response.data);
    
    // API'den gelen veriyi frontend formatına dönüştür
    return mapApiToFrontend(response.data.anaKonu);
  } catch (error) {
    console.error('Ana konu güncellenirken hata:', error);
    throw error;
  }
};

// Yeni ana konu ekle
export const createAnaKonu = async (data: Omit<MainTopic, 'id' | 'createdAt' | 'updatedAt'> | Omit<AnaKonuFrontend, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnaKonuFrontend> => {
  try {
    console.log('Yeni ana konu ekleniyor:', data);
    
    // Aktif sempozyumu al
    const sempozyumId = await getAktifSempozyumId();
    
    // Aktif sempozyum yoksa hata fırlat
    if (sempozyumId === null) {
      throw new Error('Aktif sempozyum olmadığı için yeni ana konu eklenemedi');
    }
    
    // API'ye gönderilecek veriyi hazırla
    const apiData = {
      ...mapFrontendToApi(data),
      sempozyumId: sempozyumId // Aktif sempozyum ID'sini kullan
    };
    
    // API'ye istek at
    const response = await apiClient.post('/ana-konu', apiData);
    
    console.log('API yanıtı:', response.data);
    
    // API'den gelen veriyi frontend formatına dönüştür
    return mapApiToFrontend(response.data.anaKonu);
  } catch (error) {
    console.error('Ana konu eklenirken hata:', error);
    throw error;
  }
};

// Ana konu sil
export const deleteAnaKonu = async (id: string): Promise<boolean> => {
  try {
    console.log('Ana konu siliniyor:', id);
    
    // API'ye istek at
    await apiClient.delete(`/ana-konu/${id}`);
    
    return true;
  } catch (error) {
    console.error('Ana konu silinirken hata:', error);
    throw error;
  }
}; 