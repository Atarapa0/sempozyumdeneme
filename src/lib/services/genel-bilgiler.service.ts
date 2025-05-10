import { apiClient } from './api.client';
import { SymposiumInfo } from '@/lib/database';
import { sempozyumService } from './sempozyum.service';

interface GenelBilgiler {
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
  docentlikbilgisi: string;
  yil: number;
  createdAt: string;
  updatedAt: string;
  sempozyum?: {
    title?: string;
  };
}

// API'den gelen veriyi frontend için gerekli formata dönüştür
const mapToSymposiumInfo = (data: GenelBilgiler): SymposiumInfo & { genelBilgilerId: number } => {
  return {
    id: data.sempozyumId.toString(),
    title: data.title,
    subtitle: data.altbaslik,
    dates: data.tariharaligi,
    countdownDate: data.geriSayimBitimTarihi,
    description: data.kisaaciklama,
    longDescription: data.uzunaciklama,
    venue: data.yer,
    organizer: data.organizator, 
    year: data.yil,
    isActive: true, // API'den gelen veride aktiflik bilgisi yok, varsayılan olarak true
    docentlikInfo: data.docentlikbilgisi,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    genelBilgilerId: data.id // API'deki genel bilgiler ID'sini ekle
  };
};

// Frontend formatından API formatına dönüştür
const mapToGenelBilgiler = (data: Partial<SymposiumInfo>, sempozyumId: number): Partial<GenelBilgiler> => {
  const genelBilgiler: Partial<GenelBilgiler> = {};
  
  if (data.title !== undefined) genelBilgiler.title = data.title;
  if (data.subtitle !== undefined) genelBilgiler.altbaslik = data.subtitle;
  if (data.dates !== undefined) genelBilgiler.tariharaligi = data.dates;
  if (data.countdownDate !== undefined) genelBilgiler.geriSayimBitimTarihi = data.countdownDate;
  if (data.description !== undefined) genelBilgiler.kisaaciklama = data.description;
  if (data.longDescription !== undefined) genelBilgiler.uzunaciklama = data.longDescription;
  if (data.venue !== undefined) genelBilgiler.yer = data.venue;
  if (data.organizer !== undefined) genelBilgiler.organizator = data.organizer;
  if (data.year !== undefined) genelBilgiler.yil = data.year;
  if (data.docentlikInfo !== undefined) genelBilgiler.docentlikbilgisi = data.docentlikInfo;
  
  genelBilgiler.sempozyumId = sempozyumId;
  
  return genelBilgiler;
};

// Aktif sempozyuma ait genel bilgileri getir
export const getAktifGenelBilgiler = async (): Promise<SymposiumInfo & { genelBilgilerId: number }> => {
  try {
    console.log('Aktif sempozyuma ait genel bilgiler getiriliyor...');
    
    // Zaman damgası ekleyerek önbelleği bypass edelim
    const timestamp = Date.now();
    console.log(`Önbellek bypass timestamp: ${timestamp}`);
    
    // Tarayıcı önbelleğinden önce temizlik yapalım
    if (typeof window !== 'undefined') {
      console.log('LocalStorage önbelleği temizleniyor...');
      localStorage.removeItem('cached_symposium_data');
      localStorage.removeItem('cached_general_info');
      localStorage.removeItem('last_fetch_time');
    }
    
    // Önce aktif sempozyumu al
    const aktifSempozyum = await sempozyumService.getAktifSempozyum();
    
    if (!aktifSempozyum) {
      console.warn('Aktif sempozyum bulunamadı, simüle edilmiş verilere dönülüyor');
      return useSimulatedData();
    }
    
    console.log('Aktif sempozyum ID:', aktifSempozyum.id);
    
    // API isteği detayını yazdır
    // URL'yi timestamp ile oluşturalım (Önbelleği bypass etmek için)
    const apiUrl = `/genel-bilgiler?sempozyumId=${aktifSempozyum.id}&_nocache=${timestamp}`;
    console.log('Genel bilgiler için API isteği yapılıyor:', apiUrl);
    
    // Özel header'lar ekleyelim (Önbelleği bypass etmek için)
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    // doğrudan axios ile istek yapalım (apiclient üzerinden gitmeden)
    // bu sayede tüm önbellek mekanizmalarını bypass edebiliriz
    try {
      console.log('Doğrudan axios isteği yapılıyor (apiClient bypass)...');
      const axios = await import('axios');
      
      // Axios isteği başlatılıyor
      console.log('Axios isteği: GET', '/api' + apiUrl);
      
      // Token varsa ekleyelim
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Token isteğe eklendi');
      }
      
      // Axios ile doğrudan istek
      const directResponse = await axios.default.get('/api' + apiUrl, { 
        headers,
        timeout: 10000 // 10 saniye
      });
      
      console.log('Axios yanıt durumu:', directResponse.status);
      console.log('Axios yanıt başlıkları:', directResponse.headers);
      
      if (directResponse.status === 200) {
        console.log('Axios yanıtı başarılı!');
        const genelBilgilerList = directResponse.data;
        
        if (!genelBilgilerList) {
          console.warn('Axios yanıtı null veya tanımsız döndü');
          throw new Error('Genel bilgiler verisi boş');
        }
        
        console.log('Axios yanıt verisi tipi:', typeof genelBilgilerList);
        console.log('Axios yanıt verisi:', JSON.stringify(genelBilgilerList).substring(0, 200) + '...');
        
        // JSON verisiyle devam et
        if (!Array.isArray(genelBilgilerList)) {
          // Tek bir nesne olabilir
          if (typeof genelBilgilerList === 'object' && genelBilgilerList !== null && 'sempozyumId' in genelBilgilerList) {
            console.log('Tek bir genel bilgi nesnesi döndü, bunu kullanıyoruz');
            const mappedData = mapToSymposiumInfo(genelBilgilerList as GenelBilgiler);
            console.log('Dönüştürülmüş veri:', JSON.stringify(mappedData, null, 2));
            return mappedData;
          }
        } else {
          // Dizi kontrolü
          if (genelBilgilerList.length === 0) {
            console.warn(`Sempozyum ID ${aktifSempozyum.id} için genel bilgiler bulunamadı`);
            throw new Error(`Sempozyum ID ${aktifSempozyum.id} için genel bilgiler bulunamadı`);
          }
          
          console.log(`${genelBilgilerList.length} adet genel bilgi bulundu, ilkini kullanıyoruz`);
          const genelBilgiler = genelBilgilerList[0];
          const mappedData = mapToSymposiumInfo(genelBilgiler);
          console.log('Dönüştürülmüş veri:', JSON.stringify(mappedData, null, 2));
          return mappedData;
        }
      } else {
        console.error('Axios isteği başarısız:', directResponse.status);
        throw new Error(`HTTP hatası: ${directResponse.status}`);
      }
    } catch (axiosError: any) {
      console.error('Axios ile doğrudan istek yapılırken hata:', axiosError);
      
      // Alternatif olarak apiClient ile tekrar deneyelim
      console.log('Alternatif olarak apiClient ile deneniyor...');
    }
    
    // Sonra bu sempozyuma ait genel bilgileri al
    console.log('ApiClient ile istek yapılıyor:', apiUrl);
    const genelBilgilerResponse = await apiClient.get(apiUrl, { headers });
    console.log('Genel bilgiler API yanıt durumu:', genelBilgilerResponse.status);
    console.log('Genel bilgiler API yanıt başlıkları:', genelBilgilerResponse.headers);
    
    const genelBilgilerList = genelBilgilerResponse.data;
    console.log('Genel bilgiler API yanıt verisi:', genelBilgilerList);
    
    if (!genelBilgilerList) {
      console.warn('Genel bilgiler API yanıtı null veya tanımsız döndü, simüle edilmiş verilere dönülüyor');
      return useSimulatedData();
    }
    
    if (!Array.isArray(genelBilgilerList)) {
      console.warn('Genel bilgiler API yanıtı bir dizi değil:', typeof genelBilgilerList);
      
      // Eğer tek bir nesne döndüyse ve sempozyumId alanı varsa kullanabiliriz
      if (typeof genelBilgilerList === 'object' && genelBilgilerList !== null && 'sempozyumId' in genelBilgilerList) {
        console.log('Tek bir genel bilgi nesnesi döndü, bunu kullanıyoruz');
        
        // Veriyi saf haliyle logla
        console.log('API yanıtı (raw):', JSON.stringify(genelBilgilerList, null, 2));
        
        const mappedData = mapToSymposiumInfo(genelBilgilerList as GenelBilgiler);
        // Dönüştürülmüş veriyi de logla
        console.log('Dönüştürülmüş veri:', JSON.stringify(mappedData, null, 2));
        
        return mappedData;
      }
      
      console.warn('Genel bilgiler API yanıtı beklenen formatta değil, simüle edilmiş verilere dönülüyor');
      return useSimulatedData();
    }
    
    if (genelBilgilerList.length === 0) {
      console.warn(`Sempozyum ID ${aktifSempozyum.id} için genel bilgiler bulunamadı, simüle edilmiş verilere dönülüyor`);
      console.warn('Lütfen bu sempozyum için genel bilgileri veritabanına ekleyin');
      return useSimulatedData();
    }
    
    console.log(`${genelBilgilerList.length} adet genel bilgi bulundu, ilkini kullanıyoruz`);
    
    // En son eklenen genel bilgiyi al (createdAt'e göre sıralı geliyor)
    const genelBilgiler = genelBilgilerList[0];
    
    // Veriyi saf haliyle logla
    console.log('API yanıtı (ilk öğe):', JSON.stringify(genelBilgiler, null, 2));
    
    const mappedData = mapToSymposiumInfo(genelBilgiler);
    // Dönüştürülmüş veriyi de logla
    console.log('Dönüştürülmüş veri:', JSON.stringify(mappedData, null, 2));
    
    return mappedData;
  } catch (error: any) {
    console.error('Genel bilgiler getirilemedi:', error);
    
    // Hata detaylarını kapsamlı olarak logla
    if (error.response) {
      console.error('API yanıt hatası detayları:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    
    // Browser ise sayfayı yenilemeyi deneyelim
    if (typeof window !== 'undefined') {
      console.log('Tarayıcıda hata durumu - Sayfayı yenilemeye hazırlanıyor...');
      const lastRefresh = localStorage.getItem('last_auto_refresh');
      const now = Date.now();
      
      // Son yenilemeden en az 10 saniye geçtiyse yenile
      if (!lastRefresh || (now - parseInt(lastRefresh)) > 10000) {
        console.log('Sayfa yenileniyor...');
        localStorage.setItem('last_auto_refresh', now.toString());
        localStorage.removeItem('cached_symposium_data'); // Önbelleği temizle
        
        // Temiz URL ile yenileme
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('refresh', now.toString());
        
        // 1 saniye sonra yenile
        setTimeout(() => {
          window.location.href = currentUrl.toString();
        }, 1000);
      } else {
        console.log('Son yenileme çok yakın, tekrar yenilemeden simüle verilere dönülüyor.');
      }
    }
    
    // Hata durumunda, database.ts'deki simüle edilmiş verilere dönüş yapalım
    console.warn('API hatası - Simüle edilmiş verilere dönülüyor. ARAYÜZ TESTİ AMAÇLIDIR, VERİTABANINA KAYDOLMAZ!');
    return useSimulatedData();
  }
};

// Simüle edilmiş verileri kullanmak için yardımcı fonksiyon
const useSimulatedData = () => {
  return {
    id: '1',
    title: '',
    subtitle: '',
    dates: '',
    countdownDate: new Date().toISOString(),
    description: '',
    longDescription: '',
    venue: '',
    organizer: '',
    year: new Date().getFullYear(),
    isActive: true,
    docentlikInfo: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    genelBilgilerId: 0
  };
};

// Genel bilgileri güncelle
export const updateGenelBilgiler = async (
  genelBilgilerId: number, 
  data: Partial<SymposiumInfo>, 
  sempozyumId: number
): Promise<SymposiumInfo & { genelBilgilerId: number }> => {
  try {
    console.log('Genel bilgiler güncelleniyor... ID:', genelBilgilerId);
    console.log('Gönderilecek veriler:', data);
    console.log('Sempozyum ID:', sempozyumId);
    
    // SempozyumId kontrolü
    if (isNaN(sempozyumId)) {
      console.error('Geçersiz sempozyumId (NaN). Varsayılan değer kullanılıyor...');
      // Varsayılan olarak 1 kullanacağız
      sempozyumId = 1;
    }
    
    // Token kontrolü
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    console.log('Token mevcut mu?', !!token);
    
    // API data formatına dönüştür
    const apiData = mapToGenelBilgiler(data, sempozyumId);
    console.log('API formatına dönüştürülen veriler:', apiData);
    
    // API isteği yap
    const endpoint = `/genel-bilgiler/${genelBilgilerId}`;
    console.log('İstek yapılacak endpoint:', endpoint);
    console.log('Tam URL:', '/api' + endpoint);
    
    const response = await apiClient.put(endpoint, apiData);
    console.log('API yanıt durumu:', response.status);
    console.log('API yanıt verisi:', response.data);
    
    // Yanıt verisi detaylı kontrol
    if (!response.data) {
      console.error('API yanıtı boş veya tanımsız');
      throw new Error('API yanıtı boş veya tanımsız');
    }
    
    const updatedData = response.data.genelBilgi;
    if (!updatedData) {
      console.error('API yanıtında genelBilgi verisi bulunamadı. Tam yanıt:', JSON.stringify(response.data, null, 2));
      
      // Eğer API farklı bir formatta yanıt döndüyse, doğrudan response.data'yı kullanmayı deneyelim
      if (response.data.id && response.data.sempozyumId) {
        console.log('API doğrudan güncellenmiş veriyi döndü. Bunu kullanıyoruz.');
        return mapToSymposiumInfo(response.data);
      }
      
      throw new Error('API yanıtı beklenen formatta değil.');
    }
    
    // Client formatına dönüştürüp döndür
    const result = mapToSymposiumInfo(updatedData);
    console.log('Güncellenen ve dönüştürülen veri:', result);
    
    return result;
  } catch (error: any) {
    console.error('Genel bilgiler güncellenirken hata oluştu:', error);
    
    // Hata detaylarını yazdır
    if (error.response) {
      console.error('API yanıt detayları:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Özel hata durumu: validasyon hatası
      if (error.response.status === 400 && error.response.data) {
        console.error('API validasyon hatası:', error.response.data);
        
        // Hatayı fırlat, simüle veri kullanma
        throw new Error(`API Validasyon Hatası: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    // Hata durumunda, database.ts'deki simüle edilmiş verilere dönüş yapalım
    console.log('API hatası - Simüle edilmiş verilere dönülüyor');
    const { updateSymposiumInfo } = await import('@/lib/database');
    const simuleVeri = await updateSymposiumInfo(data);
    
    // Eğer simuleVeri null ise, varsayılan bir değer oluştur
    if (!simuleVeri) {
      return {
        id: '1', // Varsayılan ID
        title: data.title || 'Sempozyum',
        subtitle: data.subtitle || '',
        dates: data.dates || '',
        countdownDate: data.countdownDate || new Date().toISOString(),
        description: data.description || '',
        longDescription: data.longDescription || '',
        venue: data.venue || '',
        organizer: data.organizer || '',
        year: data.year || new Date().getFullYear(),
        isActive: data.isActive !== undefined ? data.isActive : true,
        docentlikInfo: data.docentlikInfo || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        genelBilgilerId: Date.now()
      };
    }
    
    // simuleVeri'yi SymposiumInfo tipine dönüştür ve genelBilgilerId ekle
    return { 
      ...simuleVeri, 
      id: simuleVeri.id || '1', // Eğer id undefined ise varsayılan değer kullan
      genelBilgilerId: Date.now() 
    };
  }
};

// Yeni genel bilgiler oluştur
export const createGenelBilgiler = async (
  data: Partial<SymposiumInfo>, 
  sempozyumId: number
): Promise<SymposiumInfo & { genelBilgilerId: number }> => {
  try {
    console.log('Yeni genel bilgiler oluşturuluyor...');
    console.log('Gönderilecek veriler:', data);
    console.log('Sempozyum ID:', sempozyumId);
    
    // SempozyumId kontrolü
    if (isNaN(sempozyumId)) {
      console.error('Geçersiz sempozyumId (NaN). Varsayılan değer kullanılıyor...');
      // Varsayılan olarak 1 kullanacağız
      sempozyumId = 1;
    }
    
    // Token kontrolü
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    console.log('Token mevcut mu?', !!token);
    
    // API data formatına dönüştür
    const apiData = mapToGenelBilgiler(data, sempozyumId);
    console.log('API formatına dönüştürülen veriler:', apiData);
    
    // API isteği yap
    const endpoint = '/genel-bilgiler';
    console.log('İstek yapılacak endpoint:', endpoint);
    console.log('Tam URL:', '/api' + endpoint);
    
    const response = await apiClient.post(endpoint, apiData);
    console.log('API yanıt durumu:', response.status);
    console.log('API yanıt verisi:', response.data);
    
    // Yanıt verisi detaylı kontrol
    if (!response.data) {
      console.error('API yanıtı boş veya tanımsız');
      throw new Error('API yanıtı boş veya tanımsız');
    }
    
    const createdData = response.data.genelBilgi;
    if (!createdData) {
      console.error('API yanıtında genelBilgi verisi bulunamadı. Tam yanıt:', JSON.stringify(response.data, null, 2));
      
      // Eğer API farklı bir formatta yanıt döndüyse, doğrudan response.data'yı kullanmayı deneyelim
      if (response.data.id && response.data.sempozyumId) {
        console.log('API doğrudan oluşturulan veriyi döndü. Bunu kullanıyoruz.');
        return mapToSymposiumInfo(response.data);
      }
      
      throw new Error('API yanıtı beklenen formatta değil.');
    }
    
    // Client formatına dönüştürüp döndür
    const result = mapToSymposiumInfo(createdData);
    console.log('Oluşturulan ve dönüştürülen veri:', result);
    
    return result;
  } catch (error: any) {
    console.error('Genel bilgiler oluşturulurken hata oluştu:', error);
    
    // Hata detaylarını yazdır
    if (error.response) {
      console.error('API yanıt detayları:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Özel hata durumu: validasyon hatası
      if (error.response.status === 400 && error.response.data) {
        console.error('API validasyon hatası:', error.response.data);
        
        // Hatayı fırlat, simüle veri kullanma
        throw new Error(`API Validasyon Hatası: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    // Hata durumunda, database.ts'deki simüle edilmiş verilere dönüş yapalım
    console.log('API hatası - Simüle edilmiş verilere dönülüyor');
    const { updateSymposiumInfo } = await import('@/lib/database');
    const simuleVeri = await updateSymposiumInfo(data);
    
    // Eğer simuleVeri null ise, varsayılan bir değer oluştur
    if (!simuleVeri) {
      return {
        id: '1', // Varsayılan ID
        title: data.title || 'Sempozyum',
        subtitle: data.subtitle || '',
        dates: data.dates || '',
        countdownDate: data.countdownDate || new Date().toISOString(),
        description: data.description || '',
        longDescription: data.longDescription || '',
        venue: data.venue || '',
        organizer: data.organizer || '',
        year: data.year || new Date().getFullYear(),
        isActive: data.isActive !== undefined ? data.isActive : true,
        docentlikInfo: data.docentlikInfo || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        genelBilgilerId: Date.now()
      };
    }
    
    // simuleVeri'yi SymposiumInfo tipine dönüştür ve genelBilgilerId ekle
    return { 
      ...simuleVeri, 
      id: simuleVeri.id || '1', // Eğer id undefined ise varsayılan değer kullan
      genelBilgilerId: Date.now() 
    };
  }
};

// Genel bilgileri kontrol et, yoksa oluştur, varsa güncelle
export const saveGenelBilgiler = async (
  data: Partial<SymposiumInfo>, 
  sempozyumId: number
): Promise<SymposiumInfo & { genelBilgilerId: number }> => {
  try {
    console.log('Sempozyum ID için genel bilgiler kontrol ediliyor:', sempozyumId);
    
    // SempozyumId kontrolü
    if (isNaN(sempozyumId)) {
      console.error('Geçersiz sempozyumId (NaN). Varsayılan değer kullanılıyor...');
      sempozyumId = 1;
    }
    
    // Önce bu sempozyum için genel bilgiler var mı kontrol et
    try {
      const apiUrl = `/genel-bilgiler?sempozyumId=${sempozyumId}`;
      console.log('Genel bilgiler sorgulanıyor:', apiUrl);
      
      const response = await apiClient.get(apiUrl);
      const genelBilgilerList = response.data;
      
      console.log('Sorgu sonucu:', Array.isArray(genelBilgilerList) ? `${genelBilgilerList.length} adet kayıt bulundu` : 'Dizi döndürülmedi');
      
      // Eğer bu sempozyuma ait genel bilgiler varsa, güncelle
      if (Array.isArray(genelBilgilerList) && genelBilgilerList.length > 0) {
        const mevcut = genelBilgilerList[0];
        console.log('Bu sempozyum için mevcut genel bilgiler bulundu. ID:', mevcut.id);
        
        // Mevcut kaydı güncelle
        return await updateGenelBilgiler(mevcut.id, data, sempozyumId);
      } else {
        console.log('Bu sempozyum için genel bilgiler bulunamadı. Yeni kayıt oluşturuluyor...');
        
        // Zorunlu alanları kontrol et ve eksikleri tamamla
        const requiredFields = [
          'title', 'subtitle', 'dates', 'countdownDate', 
          'description', 'longDescription', 'venue', 
          'organizer', 'year'
        ];
        
        const currentYear = new Date().getFullYear();
        const completeData = { ...data };
        
        // Eksik alanları varsayılan değerlerle doldur
        if (!completeData.title) completeData.title = `Sempozyum ${currentYear}`;
        if (!completeData.subtitle) completeData.subtitle = `${currentYear} Sempozyumu`;
        if (!completeData.dates) completeData.dates = `${new Date().toLocaleDateString('tr-TR')}`;
        if (!completeData.countdownDate) completeData.countdownDate = new Date().toISOString();
        if (!completeData.description) completeData.description = `${completeData.title} açıklaması`;
        if (!completeData.longDescription) completeData.longDescription = `${completeData.title} detaylı açıklaması`;
        if (!completeData.venue) completeData.venue = "Belirlenecek";
        if (!completeData.organizer) completeData.organizer = "Sempozyum Organizasyon Komitesi";
        if (!completeData.year) completeData.year = currentYear;
        if (!completeData.docentlikInfo) completeData.docentlikInfo = "";
        
        console.log('Tamamlanmış veri ile yeni genel bilgiler oluşturuluyor:', completeData);
        
        // Yeni kayıt oluştur
        return await createGenelBilgiler(completeData, sempozyumId);
      }
    } catch (queryError) {
      console.error('Genel bilgiler sorgulanırken hata oluştu:', queryError);
      console.log('Doğrudan yeni kayıt oluşturmaya geçiliyor...');
      
      // Sorgulama hatası durumunda yeni oluştur (yokmuş gibi davran)
      return await createGenelBilgiler(data, sempozyumId);
    }
  } catch (error: any) {
    console.error('Genel bilgiler kayıt/güncelleme işlemi sırasında hata:', error);
    
    // Hata detaylarını yazdır
    if (error.response) {
      console.error('API yanıt hata detayları:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    throw error;
  }
}; 