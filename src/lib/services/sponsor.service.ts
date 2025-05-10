import { apiClient } from './api.client';
import { Sponsor } from '@/lib/database';
import { sempozyumService } from './sempozyum.service';

interface SponsorAPI {
  id: number;
  sempozyumId: number;
  ad: string;
  logoUrl: string;
  link: string;
  createdAt: string;
  updatedAt: string;
  sempozyum?: {
    title?: string;
  };
}

// API'den gelen veriyi frontend için gerekli formata dönüştür
const mapToSponsor = (data: SponsorAPI): Sponsor & { sponsorId: number } => {
  return {
    id: data.id.toString(),
    name: data.ad,
    logo: data.logoUrl,
    website: data.link,
    symposiumId: data.sempozyumId.toString(),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    sponsorId: data.id
  };
};

// Frontend formatından API formatına dönüştür
const mapToSponsorAPI = (data: Partial<Sponsor>, sempozyumId: number): Partial<SponsorAPI> => {
  const sponsorData: Partial<SponsorAPI> = {};
  
  if (data.name !== undefined) sponsorData.ad = data.name;
  if (data.logo !== undefined) sponsorData.logoUrl = data.logo;
  if (data.website !== undefined) sponsorData.link = data.website;
  
  sponsorData.sempozyumId = sempozyumId;
  
  console.log('Dönüştürülen sponsor verisi:', sponsorData);
  return sponsorData;
};

// Aktif sempozyuma ait sponsorları getir
export const getAktifSponsorlar = async (): Promise<(Sponsor & { sponsorId: number })[]> => {
  try {
    console.log('Aktif sempozyuma ait sponsorlar getiriliyor...');
    // Önce aktif sempozyumu al
    const aktifSempozyum = await sempozyumService.getAktifSempozyum();
    
    if (!aktifSempozyum) {
      throw new Error('Aktif sempozyum bulunamadı');
    }
    
    console.log('Aktif sempozyum ID:', aktifSempozyum.id);
    
    // Sonra bu sempozyuma ait sponsorları al
    const sponsorlarResponse = await apiClient.get(`/sponsor?sempozyumId=${aktifSempozyum.id}`);
    const sponsorlarList = sponsorlarResponse.data;
    
    console.log('Sponsorlar cevap:', sponsorlarList);
    
    if (!sponsorlarList) {
      throw new Error('Sponsorlar bulunamadı');
    }
    
    // Tüm sponsorları dönüştür ve döndür
    return sponsorlarList.map((sponsor: SponsorAPI) => mapToSponsor(sponsor));
  } catch (error) {
    console.error('Sponsorlar getirilemedi:', error);
    // Hata durumunda, database.ts'deki simüle edilmiş verilere dönüş yapalım
    console.log('API hatası - Simüle edilmiş verilere dönülüyor');
    
    const { getSponsors } = await import('@/lib/database');
    const simuleVeriler = await getSponsors();
    // Simüle verilere sponsorId ekleyelim
    return simuleVeriler.map((sponsor, index) => ({ ...sponsor, sponsorId: index + 1 }));
  }
};

// Sponsor güncelle
export const updateSponsorAPI = async (
  sponsorId: number, 
  data: Partial<Sponsor>, 
  sempozyumId: number
): Promise<Sponsor & { sponsorId: number }> => {
  try {
    console.log('Sponsor güncelleniyor...', sponsorId);
    const apiData = mapToSponsorAPI(data, sempozyumId);
    
    console.log('API\'ye gönderilecek veri:', apiData);
    
    const response = await apiClient.put(`/sponsor/${sponsorId}`, apiData);
    const updatedData = response.data.sponsor;
    
    return mapToSponsor(updatedData);
  } catch (error) {
    console.error('Sponsor güncellenirken hata oluştu:', error);
    
    // Hata durumunda, database.ts'deki simüle edilmiş verilere dönüş yapalım
    console.log('API hatası - Simüle edilmiş verilere dönülüyor');
    const { updateSponsor } = await import('@/lib/database');
    const simuleVeri = await updateSponsor(data.id || '', data);
    return { ...simuleVeri, sponsorId };
  }
};

// Yeni sponsor oluştur
export const createSponsorAPI = async (
  data: Partial<Sponsor>, 
  sempozyumId: number
): Promise<Sponsor & { sponsorId: number }> => {
  try {
    console.log('Yeni sponsor oluşturuluyor...');
    
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
    
    const apiData = mapToSponsorAPI(data, sempozyumId);
    
    console.log('API\'ye gönderilecek veri:', JSON.stringify(apiData, null, 2));
    
    const response = await apiClient.post('/sponsor', apiData);
    console.log('API yanıtı:', response.data);
    
    const createdData = response.data.sponsor;
    if (!createdData) {
      console.error('API yanıtında sponsor verisi bulunamadı:', response.data);
      throw new Error('API yanıtında beklenen veri bulunamadı');
    }
    
    return mapToSponsor(createdData);
  } catch (error: any) {
    console.error('Sponsor oluşturulurken hata oluştu:', error);
    if (error.response) {
      console.error('API yanıt detayları:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    // Hata durumunda, database.ts'deki simüle edilmiş verilere dönüş yapalım
    console.log('API hatası - Simüle edilmiş verilere dönülüyor');
    const { addSponsor } = await import('@/lib/database');
    const simuleVeri = await addSponsor(data as any);
    // Yeni oluşturulmuş gibi bir ID verelim
    return { ...simuleVeri, sponsorId: Date.now() };
  }
};

// Sponsor sil
export const deleteSponsorAPI = async (sponsorId: number): Promise<boolean> => {
  try {
    console.log('Sponsor siliniyor...', sponsorId);
    
    const response = await apiClient.delete(`/sponsor/${sponsorId}`);
    return true;
  } catch (error) {
    console.error('Sponsor silinirken hata oluştu:', error);
    
    // Hata durumunda, database.ts'deki simüle edilmiş verilere dönüş yapalım
    console.log('API hatası - Simüle edilmiş verilere dönülüyor');
    const { deleteSponsor } = await import('@/lib/database');
    await deleteSponsor(sponsorId.toString());
    return true;
  }
}; 