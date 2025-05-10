import { apiClient } from './api.client';

export interface LoginResponse {
  token: string;
  kullanici: {
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
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

export interface LoginError {
  error: string;
  status?: number;
}

// Geçici bir in-memory token deposu (gerçek uygulamada veritabanı kullanılmalıdır)
// Format: { [token]: { kullaniciId, expireDate } }
const resetTokens: Record<string, { kullaniciId: number, expireDate: Date }> = {};

// Token doğrulama işlevi
export function validateResetToken(token: string) {
  const tokenData = resetTokens[token];
  
  if (!tokenData) {
    return null;
  }
  
  // Token'ın süresi dolmuş mu kontrol et
  if (tokenData.expireDate < new Date()) {
    delete resetTokens[token]; // Süresi dolmuş token'ı temizle
    return null;
  }
  
  return tokenData;
}

// Token'ı tüket
export function consumeResetToken(token: string) {
  const tokenData = resetTokens[token];
  
  if (tokenData) {
    delete resetTokens[token];
  }
  
  return tokenData;
}

// Token oluştur ve sakla
export function createResetToken(kullaniciId: number, expireDate: Date): string {
  const { v4: uuidv4 } = require('uuid');
  const resetToken = uuidv4();
  
  // Token'ı bellekte sakla
  resetTokens[resetToken] = {
    kullaniciId,
    expireDate
  };
  
  return resetToken;
}

/**
 * Kimlik doğrulama ile ilgili API servislerini içerir
 */
export const authService = {
  /**
   * Kullanıcı girişi yapar
   * @param eposta Kullanıcı e-posta adresi
   * @param sifre Kullanıcı şifresi
   * @returns Promise<LoginResponse> Başarılı login yanıtı
   * @throws Geçersiz kimlik bilgileri veya sunucu hatası
   */
  login: async (eposta: string, sifre: string): Promise<LoginResponse> => {
    try {
      console.log('Login API isteği gönderiliyor:', { eposta });
      const response = await apiClient.post('/auth/login', { eposta, sifre });
      return response.data;
    } catch (error: any) {
      console.error('Login hatası:', error);
      
      // Axios'dan gelen hataları işle
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        // Hata detaylarını logla
        console.error('Hata durumu:', status);
        console.error('Hata verisi:', errorData);
        
        // Spesifik hata mesajları
        if (status === 401) {
          throw { error: errorData.error || 'Geçersiz e-posta veya şifre', status };
        } else if (status === 500) {
          throw { error: errorData.error || 'Sunucu hatası', status };
        }
        
        // Diğer hatalar için
        throw { error: errorData.error || 'Giriş yapılırken bir hata oluştu', status };
      }
      
      // Ağ veya diğer hatalar
      throw { error: error.message || 'Bilinmeyen bir hata oluştu' };
    }
  },
  
  /**
   * Kullanıcı kaydı yapar
   * @param kullaniciData Kullanıcı kayıt bilgileri
   * @returns Promise<any> Başarılı kayıt yanıtı
   */
  register: async (kullaniciData: {
    ad: string;
    soyad: string;
    unvan: string;
    universite: string;
    kongreKatilimSekli: string;
    kurum: string;
    fakulte?: string;
    bolum?: string;
    yazismaAdresi?: string;
    kurumTel?: string;
    cepTel: string;
    eposta: string;
    sifre: string;
  }) => {
    try {
      console.log('Register API isteği gönderiliyor. Parametreler:', {
        ad: kullaniciData.ad,
        soyad: kullaniciData.soyad,
        eposta: kullaniciData.eposta,
        kongreKatilimSekli: kullaniciData.kongreKatilimSekli,
        cepTel: kullaniciData.cepTel,
        // Şifreyi loglamıyoruz
      });
      
      // Register API'sine istek gönder
      const response = await apiClient.post('/auth/register', kullaniciData);
      
      console.log('Register API yanıtı alındı:', response.status);
      return response.data;
    } catch (error: any) {
      console.error('Register hatası:', error);
      
      // Axios'dan gelen hataları işle
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        // Hata detaylarını logla
        console.error('Hata durumu:', status);
        console.error('Hata verisi:', errorData);
        
        // Spesifik hata mesajları
        if (status === 400) {
          console.error('Formdan gönderilen veri:', kullaniciData);
          throw new Error(errorData.error || 'Geçersiz kayıt bilgileri');
        } else if (status === 500) {
          throw new Error(errorData.error || 'Sunucu hatası');
        }
        
        throw new Error(errorData.error || 'Kayıt işlemi başarısız oldu');
      }
      
      // Ağ veya diğer hatalar
      throw new Error(error.message || 'Bilinmeyen bir hata oluştu');
    }
  },
  
  /**
   * JWT Token'dan kullanıcı bilgilerini çözümler
   * @param token JWT token
   * @returns Çözümlenmiş token yükü
   */
  parseToken: (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token çözümleme hatası:', error);
      return null;
    }
  },
  
  /**
   * Token'ın geçerli olup olmadığını kontrol eder
   * @param token JWT token
   * @returns Token geçerli mi
   */
  isTokenValid: (token: string) => {
    try {
      const payload = authService.parseToken(token);
      if (!payload || !payload.exp) return false;
      
      // Token süresi geçmiş mi kontrol et
      const expirationTime = payload.exp * 1000; // saniyeden milisaniyeye çevir
      return Date.now() < expirationTime;
    } catch (error) {
      console.error('Token geçerlilik kontrolü hatası:', error);
      return false;
    }
  },
  
  /**
   * Şifre sıfırlama isteği gönderir
   * @param eposta Kullanıcı e-posta adresi
   * @returns Promise<any> Başarılı şifre sıfırlama isteği yanıtı
   */
  requestPasswordReset: async (eposta: string) => {
    try {
      console.log('Şifre sıfırlama isteği gönderiliyor:', { eposta });
      const response = await apiClient.post('/auth/forgot-password', { eposta });
      return response.data;
    } catch (error: any) {
      console.error('Şifre sıfırlama isteği hatası:', error);
      
      // Axios'dan gelen hataları işle
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        // Hata detaylarını logla
        console.error('Hata durumu:', status);
        console.error('Hata verisi:', errorData);
        
        // Spesifik hata mesajları
        if (status === 404) {
          throw { error: errorData.error || 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı', status };
        } else if (status === 500) {
          throw { error: errorData.error || 'Sunucu hatası', status };
        }
        
        throw { error: errorData.error || 'Şifre sıfırlama isteği sırasında bir hata oluştu', status };
      }
      
      // Ağ veya diğer hatalar
      throw { error: error.message || 'Bilinmeyen bir hata oluştu' };
    }
  },
  
  /**
   * Şifre sıfırlama işlemini tamamlar
   * @param token Şifre sıfırlama token'ı
   * @param yeniSifre Yeni şifre
   * @returns Promise<any> Başarılı şifre sıfırlama yanıtı
   */
  resetPassword: async (token: string, yeniSifre: string) => {
    try {
      console.log('Şifre sıfırlama işlemi yapılıyor');
      const response = await apiClient.post('/auth/reset-password', { token, yeniSifre });
      return response.data;
    } catch (error: any) {
      console.error('Şifre sıfırlama hatası:', error);
      
      // Axios'dan gelen hataları işle
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        // Hata detaylarını logla
        console.error('Hata durumu:', status);
        console.error('Hata verisi:', errorData);
        
        // Spesifik hata mesajları
        if (status === 400) {
          throw { error: errorData.error || 'Geçersiz veya süresi dolmuş token', status };
        } else if (status === 500) {
          throw { error: errorData.error || 'Sunucu hatası', status };
        }
        
        throw { error: errorData.error || 'Şifre sıfırlama sırasında bir hata oluştu', status };
      }
      
      // Ağ veya diğer hatalar
      throw { error: error.message || 'Bilinmeyen bir hata oluştu' };
    }
  }
}; 