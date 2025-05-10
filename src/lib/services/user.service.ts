import { apiClient } from './api.client';

export interface User {
  id: number;
  ad: string;
  soyad: string;
  eposta: string;
  unvan: string;
  bolum?: string;
  universite: string;
  kurum: string;
  kongreKatilimSekli: string;
  fakulte?: string;
  cepTel: string;
  rol: {
    id: number;
    ad: string;
  };
  hakem_yetenekleri?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserData {
  ad?: string;
  soyad?: string;
  unvan?: string;
  universite?: string;
  kurum?: string;
  kongreKatilimSekli?: string;
  bolum?: string;
  fakulte?: string;
  cepTel?: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

/**
 * Kullanıcı işlemleri için API servisleri
 */
export const userService = {
  /**
   * Mevcut kullanıcının profilini getirir
   * @returns Kullanıcı bilgileri
   */
  getProfile: async (): Promise<User> => {
    try {
      // Önce token kontrolü yapalım
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token bulunamadı, kullanıcı girişi gerekiyor');
          throw new Error('Oturum açmanız gerekiyor');
        }
      }
      
      console.log('Profil bilgileri alınıyor...');
      const response = await apiClient.get('/kullanici/profil');
      console.log('Profil bilgileri başarıyla alındı:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Profil bilgisi alma hatası:', error);
      
      // Daha detaylı hata mesajları sağlayalım
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          console.error('Yetkilendirme hatası, token geçersiz olabilir');
          
          // Yerel depolama verisini temizle
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          
          throw new Error('Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.');
        } else if (error.response.status === 500) {
          throw new Error('Sunucu hatası: Profil bilgileri alınırken bir hata oluştu');
        } else if (error.response.data && error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      }
      
      throw new Error('Profil bilgileri alınamadı');
    }
  },
  
  /**
   * Kullanıcı profilini günceller
   * @param data Güncellenecek kullanıcı verileri
   * @returns Güncellenmiş kullanıcı bilgileri
   */
  updateProfile: async (data: UpdateUserData): Promise<User> => {
    try {
      // Önce token kontrolü yapalım
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token bulunamadı, kullanıcı girişi gerekiyor');
          throw new Error('Oturum açmanız gerekiyor');
        }
      }
      
      console.log('Profil güncelleniyor, gönderilen veriler:', data);
      const response = await apiClient.put('/kullanici/profil', data);
      console.log('Profil başarıyla güncellendi:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Profil güncelleme hatası:', error);
      
      // Daha detaylı hata mesajları sağlayalım
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          console.error('Yetkilendirme hatası, token geçersiz olabilir');
          
          // Yerel depolama verisini temizle
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          
          throw new Error('Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.');
        } else if (error.response.status === 500) {
          throw new Error('Sunucu hatası: Profil güncellenirken bir hata oluştu');
        } else if (error.response.data && error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      }
      
      throw new Error('Profil güncellenemedi');
    }
  },
  
  /**
   * Kullanıcı şifresini değiştirir
   * @param data Eski ve yeni şifre bilgileri
   * @returns İşlem sonucu
   */
  changePassword: async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
    try {
      // Önce token kontrolü yapalım
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token bulunamadı, kullanıcı girişi gerekiyor');
          throw new Error('Oturum açmanız gerekiyor');
        }
      }
      
      // Şifre doğruluğunu kontrol et
      if (!data.oldPassword || !data.newPassword) {
        throw new Error('Mevcut şifre ve yeni şifre zorunludur');
      }
      
      if (data.newPassword.length < 6) {
        throw new Error('Yeni şifre en az 6 karakter olmalıdır');
      }
      
      console.log('Şifre değiştirme isteği yapılıyor...');
      const response = await apiClient.post('/kullanici/sifre-degistir', data);
      console.log('Şifre başarıyla değiştirildi');
      return response.data;
    } catch (error: any) {
      console.error('Şifre değiştirme hatası:', error);
      
      // Daha detaylı hata mesajları sağlayalım
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          console.error('Yetkilendirme hatası, token geçersiz olabilir');
          
          // Yerel depolama verisini temizle
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          
          throw new Error('Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.');
        } else if (error.response.status === 400) {
          // 400 Bad Request - Genellikle mevcut şifre hatalı
          throw new Error(error.response.data?.error || 'Mevcut şifreniz hatalı');
        } else if (error.response.status === 500) {
          throw new Error('Sunucu hatası: Şifre değiştirme işlemi sırasında bir hata oluştu');
        } else if (error.response.data && error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      }
      
      throw new Error('Şifre değiştirilemedi');
    }
  },
  
  /**
   * Tüm kullanıcıları getirir (Admin için)
   * @returns Kullanıcı listesi
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      console.error('Kullanıcı listesi alma hatası:', error);
      throw new Error('Kullanıcı listesi alınamadı');
    }
  },
  
  /**
   * ID'ye göre kullanıcı bilgilerini getirir
   * @param id Kullanıcı ID
   * @returns Kullanıcı bilgileri
   */
  getUserById: async (id: number): Promise<User> => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Kullanıcı bilgisi alma hatası:', error);
      throw new Error('Kullanıcı bilgileri alınamadı');
    }
  },
  
  /**
   * Kullanıcı rolünü değiştirir (Admin için)
   * @param id Kullanıcı ID
   * @param rolId Yeni rol ID
   * @returns Güncellenmiş kullanıcı bilgileri
   */
  updateUserRole: async (id: number, rolId: number): Promise<User> => {
    try {
      const response = await apiClient.patch(`/users/${id}/role`, { rolId });
      return response.data;
    } catch (error) {
      console.error('Kullanıcı rolü güncelleme hatası:', error);
      throw new Error('Kullanıcı rolü güncellenemedi');
    }
  },

  /**
   * Yeni bir hakem kaydı oluşturur (Admin için)
   * @param data Hakem bilgileri
   * @returns Kaydedilen hakem bilgileri
   */
  registerReviewer: async (data: {
    ad: string;
    soyad: string;
    eposta: string;
    unvan: string;
    bolum?: string;
    universite: string;
    kurum: string;
    fakulte?: string;
    cepTel: string;
    uzmanlıkAlanları: string[];
    sifre: string;
  }): Promise<User> => {
    try {
      // Servis API'sine uygun forma dönüştür
      const reviewerData = {
        ad: data.ad,
        soyad: data.soyad,
        eposta: data.eposta,
        sifre: data.sifre,
        unvan: data.unvan,
        universite: data.universite,
        kurum: data.kurum,
        fakulte: data.fakulte,
        bolum: data.bolum,
        cepTel: data.cepTel,
        kongreKatilimSekli: 'Online', // Varsayılan değer
        rolId: 3, // Hakem rolü (Reviewer) - rol tablosunda ID=3
        uzmanlıkAlanları: data.uzmanlıkAlanları
      };

      const response = await apiClient.post('/kullanici', reviewerData);
      return response.data;
    } catch (error: any) {
      console.error('Hakem kaydı hatası:', error);
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Hakem kaydedilemedi');
    }
  },

  /**
   * Yeni bir editör kaydı oluşturur (Admin için)
   * @param data Editör bilgileri
   * @returns Kaydedilen editör bilgileri
   */
  registerEditor: async (data: {
    ad: string;
    soyad: string;
    eposta: string;
    unvan: string;
    bolum?: string;
    universite: string;
    kurum: string;
    fakulte?: string;
    cepTel: string;
    sifre: string;
  }): Promise<User> => {
    try {
      // Servis API'sine uygun forma dönüştür
      const editorData = {
        ad: data.ad,
        soyad: data.soyad,
        eposta: data.eposta,
        sifre: data.sifre,
        unvan: data.unvan,
        universite: data.universite,
        kurum: data.kurum,
        fakulte: data.fakulte,
        bolum: data.bolum,
        cepTel: data.cepTel,
        kongreKatilimSekli: 'Online', // Varsayılan değer
        rolId: 5 // Editör rolü - rol tablosunda ID=5
      };

      const response = await apiClient.post('/kullanici', editorData);
      return response.data;
    } catch (error: any) {
      console.error('Editör kaydı hatası:', error);
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Editör kaydedilemedi');
    }
  },

  /**
   * Hakemleri getirir
   * @returns Hakem listesi
   */
  getReviewers: async (): Promise<User[]> => {
    try {
      // Token kontrolü
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token');
        console.log('✅ Token geçerli:', token ? {
          length: token.length,
          prefix: token.substring(0, 15) + '...',
          userId: "bilinmiyor",
          role: "bilinmiyor",
          rolId: "bilinmiyor"
        } : 'Bulunamadı');
        
        // Kullanıcı bilgilerini kontrol et
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
          try {
            const userObj = JSON.parse(userInfo);
            console.log('👤 Kullanıcı lokal bilgileri:', {
              id: userObj.id,
              email: userObj.email,
              role: userObj.role,
              rolId: userObj.rolId
            });
          } catch (e) {
            console.warn('⚠️ Kullanıcı bilgileri JSON parse hatası');
          }
        }
        
        if (!token) {
          console.warn('⚠️ Token bulunamadı. Bu, API isteklerinin başarısız olmasına neden olabilir.');
          throw new Error('Oturum açmanız gerekiyor. Lütfen giriş yapın.');
        }
        
        // Token'ı header'a ekle
        console.log('🔑 Authorization header eklendi: Bearer ' + token.substring(0, 15) + '...');
      }
      
      // Tüm kullanıcıları getirerek filtreleyelim
      console.log('API isteği gönderiliyor: /kullanici');
      
      const allUsersResponse = await apiClient.get('/kullanici', {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : undefined
      });
      
      // Yanıt formatını kontrol et
      const allUsers = Array.isArray(allUsersResponse.data) ? allUsersResponse.data : 
                       allUsersResponse.data.kullanicilar ? allUsersResponse.data.kullanicilar : [];
      
      console.log(`✅ Toplam ${allUsers.length} kullanıcı alındı, hakem filtreleniyor...`);
      
      // rolId = 3 (Hakem) olanları filtrele
      const hakemler = allUsers.filter((user: any) => {
        if (!user) return false;
        
        // rol bilgisi kontrolü
        const userRolId = user.rolId || (user.rol && user.rol.id);
        const userRolAd = user.rol && user.rol.ad ? user.rol.ad.toLowerCase() : '';
        
        // Eğer rolId 3 ise veya rol adı 'reviewer' veya 'hakem' ise bu bir hakemdir
        return (
          (userRolId === 3) || 
          (userRolAd === 'reviewer') || 
          (userRolAd === 'hakem')
        );
      });
      
      console.log('✅ Filtreden sonra bulunan hakem sayısı:', hakemler.length);
      
      if (hakemler.length === 0) {
        console.warn('⚠️ Hiç hakem bulunamadı. Lütfen önce hakem ekleyin.');
        throw new Error('Veritabanında hakem rolüne sahip kullanıcı bulunamadı! Lütfen önce hakem ekleyin.');
      }
      
      return hakemler;
    } catch (error: any) {
      console.error('❌ Hakem listesi alma hatası:', error);
      
      // API yanıt detayları
      if (error.response) {
        console.error('🔴 API HATA:', error.response.config?.url, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        if (error.response.status === 401) {
          throw new Error('Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.');
        }
      }
      
      // Diğer hatalar için bildiriyi göster
      const errorMessage = error.message || 'Hakem listesi alınamadı';
      throw new Error(`Hakemler yüklenirken bir hata oluştu. Detaylı hata: ${errorMessage}`);
    }
  }
}; 