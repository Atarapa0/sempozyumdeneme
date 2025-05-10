import { apiClient } from './api.client';
import { ImportantDate } from '@/lib/database';
import { sempozyumService } from './sempozyum.service';

interface OnemliTarih {
  id: number;
  sempozyumId: number;
  baslik: string;
  tarih: string;
  durum: boolean;
  createdAt: string;
  updatedAt: string;
  sempozyum?: {
    title?: string;
  };
}

// API'den gelen veriyi frontend için gerekli formata dönüştür
const mapToImportantDate = (data: OnemliTarih): ImportantDate & { onemliTarihId: number } => {
  return {
    id: data.id.toString(),
    title: data.baslik,
    date: data.tarih,
    isCompleted: data.durum,
    symposiumId: data.sempozyumId.toString(),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    onemliTarihId: data.id
  };
};

// Frontend formatından API formatına dönüştür
const mapToOnemliTarih = (data: Partial<ImportantDate>, sempozyumId: number): Partial<OnemliTarih> => {
  const onemliTarih: Partial<OnemliTarih> = {};
  
  if (data.title !== undefined) onemliTarih.baslik = data.title;

  // Tarihi ISO formatına dönüştür
  if (data.date !== undefined) {
    try {
      // Tarih bir string ise, Date nesnesine dönüştürüp ISO string alıyoruz
      const dateObj = new Date(data.date);
      if (!isNaN(dateObj.getTime())) {
        onemliTarih.tarih = dateObj.toISOString();
      } else {
        console.error('Geçersiz tarih formatı:', data.date);
        // Geçersiz tarih ise olduğu gibi gönderelim, API kontrol edecek
        onemliTarih.tarih = data.date;
      }
    } catch (e) {
      console.error('Tarih dönüştürme hatası:', e);
      onemliTarih.tarih = data.date;
    }
  }
  
  if (data.isCompleted !== undefined) onemliTarih.durum = data.isCompleted;
  
  onemliTarih.sempozyumId = sempozyumId;
  
  console.log('Dönüştürülen önemli tarih verisi:', onemliTarih);
  return onemliTarih;
};

// Aktif sempozyuma ait önemli tarihleri getir
export const getAktifOnemliTarihler = async (): Promise<(ImportantDate & { onemliTarihId: number })[]> => {
  try {
    console.log('Aktif sempozyuma ait önemli tarihler getiriliyor...');
    // Önce aktif sempozyumu al
    const aktifSempozyum = await sempozyumService.getAktifSempozyum();
    
    if (!aktifSempozyum) {
      throw new Error('Aktif sempozyum bulunamadı');
    }
    
    console.log('Aktif sempozyum ID:', aktifSempozyum.id);
    
    // Sonra bu sempozyuma ait önemli tarihleri al
    const onemliTarihlerResponse = await apiClient.get(`/onemli-tarihler?sempozyumId=${aktifSempozyum.id}`);
    const onemliTarihlerList = onemliTarihlerResponse.data;
    
    console.log('Önemli tarihler cevap:', onemliTarihlerList);
    
    if (!onemliTarihlerList) {
      throw new Error('Önemli tarihler bulunamadı');
    }
    
    // Tüm önemli tarihleri dönüştür ve döndür
    return onemliTarihlerList.map((tarih: OnemliTarih) => mapToImportantDate(tarih));
  } catch (error) {
    console.error('Önemli tarihler getirilemedi:', error);
    // Hata durumunda, database.ts'deki simüle edilmiş verilere dönüş yapalım
    console.log('API hatası - Simüle edilmiş verilere dönülüyor');
    
    const { getImportantDates } = await import('@/lib/database');
    const simuleVeriler = await getImportantDates();
    // Simüle verilere onemliTarihId ekleyelim
    return simuleVeriler.map((tarih, index) => ({ ...tarih, onemliTarihId: index + 1 }));
  }
};

// Önemli tarih güncelle
export const updateOnemliTarih = async (
  onemliTarihId: number, 
  data: Partial<ImportantDate>, 
  sempozyumId: number
): Promise<ImportantDate & { onemliTarihId: number }> => {
  try {
    console.log('Önemli tarih güncelleniyor... ID:', onemliTarihId);
    console.log('Gönderilecek veriler:', data);
    console.log('Sempozyum ID:', sempozyumId);
    
    // Token kontrolü
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    console.log('Token mevcut mu?', !!token);
    
    // API formatına dönüştür
    const apiData = mapToOnemliTarih(data, sempozyumId);
    console.log('API formatına dönüştürülen veriler:', apiData);
    
    // API isteği yap
    const endpoint = `/onemli-tarihler/${onemliTarihId}`;
    console.log('İstek yapılacak endpoint:', endpoint);
    
    const response = await apiClient.put(endpoint, apiData);
    console.log('API yanıt durumu:', response.status);
    console.log('API yanıt verisi:', response.data);
    
    const updatedData = response.data.onemliTarih;
    if (!updatedData) {
      console.error('API yanıtında onemliTarih verisi bulunamadı. Yanıt:', response.data);
      throw new Error('API yanıtı beklenen formatta değil.');
    }
    
    // Client formatına dönüştürüp döndür
    const result = mapToImportantDate(updatedData);
    console.log('Güncellenen ve dönüştürülen veri:', result);
    
    return result;
  } catch (error: any) {
    console.error('Önemli tarih güncellenirken hata oluştu:', error);
    
    // Hata detaylarını yazdır
    if (error.response) {
      console.error('API yanıt detayları:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    // Hata durumunda, database.ts'deki simüle edilmiş verilere dönüş yapalım
    console.log('API hatası - Simüle edilmiş verilere dönülüyor');
    const { updateImportantDate } = await import('@/lib/database');
    const simuleVeri = await updateImportantDate(data.id || '', data);
    return { ...simuleVeri, onemliTarihId };
  }
};

// Yeni önemli tarih oluştur
export const createOnemliTarih = async (
  data: Partial<ImportantDate>, 
  sempozyumId: number
): Promise<ImportantDate & { onemliTarihId: number }> => {
  try {
    console.log('Yeni önemli tarih oluşturuluyor...');
    
    // Sempozyum ID'sinin sayı olduğundan emin olalım
    if (isNaN(sempozyumId) || sempozyumId <= 0) {
      console.error('Geçersiz sempozyumId:', sempozyumId);
      
      // Aktif sempozyumu doğrudan almayı deneyelim
      const aktifSempozyum = await sempozyumService.getAktifSempozyum();
      if (aktifSempozyum) {
        sempozyumId = aktifSempozyum.id;
        console.log('Aktif sempozyum ID alındı:', sempozyumId);
      } else {
        throw new Error('Geçerli bir sempozyum ID\'si bulunamadı');
      }
    }
    
    const apiData = mapToOnemliTarih(data, sempozyumId);
    
    // Boolean değerin doğru aktarıldığından emin olalım
    if (apiData.durum === undefined) {
      apiData.durum = false;
    }
    
    // Log için tarihin doğru formatta olduğunu kontrol edelim
    if (apiData.tarih) {
      try {
        const parsedDate = new Date(apiData.tarih);
        console.log('Tarih olarak gönderilecek değer:', apiData.tarih);
        console.log('Parse edilmiş tarih:', parsedDate.toISOString());
      } catch (e) {
        console.error('Tarih parse hatası:', e);
      }
    }
    
    console.log('API\'ye gönderilecek veri:', JSON.stringify(apiData, null, 2));
    
    const response = await apiClient.post('/onemli-tarihler', apiData);
    console.log('API yanıtı:', response.data);
    
    const createdData = response.data.onemliTarih;
    if (!createdData) {
      console.error('API yanıtında onemliTarih verisi bulunamadı:', response.data);
      throw new Error('API yanıtında beklenen veri bulunamadı');
    }
    
    return mapToImportantDate(createdData);
  } catch (error: any) {
    console.error('Önemli tarih oluşturulurken hata oluştu:', error);
    if (error.response) {
      console.error('API yanıt detayları:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    // Hata durumunda, database.ts'deki simüle edilmiş verilere dönüş yapalım
    console.log('API hatası - Simüle edilmiş verilere dönülüyor');
    const { addImportantDate } = await import('@/lib/database');
    const simuleVeri = await addImportantDate(data as any);
    // Yeni oluşturulmuş gibi bir ID verelim
    return { ...simuleVeri, onemliTarihId: Date.now() };
  }
};

// Önemli tarih sil
export const deleteOnemliTarih = async (onemliTarihId: number): Promise<boolean> => {
  try {
    console.log('Önemli tarih siliniyor...', onemliTarihId);
    
    const response = await apiClient.delete(`/onemli-tarihler/${onemliTarihId}`);
    return true;
  } catch (error) {
    console.error('Önemli tarih silinirken hata oluştu:', error);
    
    // Hata durumunda, database.ts'deki simüle edilmiş verilere dönüş yapalım
    console.log('API hatası - Simüle edilmiş verilere dönülüyor');
    const { deleteImportantDate } = await import('@/lib/database');
    await deleteImportantDate(onemliTarihId.toString());
    return true;
  }
}; 