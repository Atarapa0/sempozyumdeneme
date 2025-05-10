import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, AxiosHeaders, AxiosRequestHeaders } from 'axios';

// Sunucudan her zaman taze veri almak için önbellek kontrolü
function addTimestampToURL(url: string): string {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_nocache=${timestamp}`;
}

/**
 * API istekleri için yapılandırılmış axios instance
 */
export const apiClient = axios.create({
  baseURL: '', // Boş bırakıyoruz, böylece URL'de tekrar olmayacak
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  responseType: 'json', // JSON yanıt formatını zorunlu kılıyoruz
  timeout: 30000, // 30 saniye timeout
  validateStatus: status => {
    // Başarılı durum kodlarına ek olarak 400'ü de kabul et (ancak hata olarak işaretle)
    // Bu, 400 yanıtlarının detaylarını almamızı sağlar
    return (status >= 200 && status < 300) || status === 400;
  }
});

// Özel GET metodu oluşturalım - her seferinde taze veri almak için
const originalGet = apiClient.get;
apiClient.get = function(url: string, config?: any) {
  // URL'yi düzelt - başına /api ekle
  const apiUrl = url.startsWith('/api') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`;
  
  // URL'ye timestamp ekle
  const timestampedUrl = addTimestampToURL(apiUrl);
  
  // Token eklemesi
  let headers = { ...config?.headers };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Yapılandırmaya önbellek kontrolünü ve token'ı ekleyelim
  const newConfig = {
    ...config,
    headers: {
      ...headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  };

  console.log(`🔄 GET isteği gönderiliyor: ${timestampedUrl}`, { 
    headers: { ...newConfig.headers, Authorization: token ? `Bearer ${token.substring(0, 15)}...` : 'Yok' }
  });

  // Orijinal get metodu ile çağrı yap - this yerine apiClient kullan
  return originalGet.call(apiClient, timestampedUrl, newConfig);
} as typeof apiClient.get;

// Diğer HTTP metodları için de benzer düzeltmeler yapalım
const originalPost = apiClient.post;
apiClient.post = function(url: string, data?: any, config?: any) {
  const apiUrl = url.startsWith('/api') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`;
  
  // Token eklemesi
  let headers = { ...config?.headers };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Düzenlenmiş config
  const updatedConfig = {
    ...config,
    headers
  };
  
  console.log(`🚀 POST isteği gönderiliyor: ${apiUrl}`, { 
    headers: { ...updatedConfig.headers, Authorization: token ? `Bearer ${token.substring(0, 15)}...` : 'Yok' },
    data: data
  });
  
  return originalPost.call(apiClient, apiUrl, data, updatedConfig)
    .catch((error) => {
      // Hata ayıklama için daha fazla bilgi logla
      console.error(`❌ ${apiUrl} için POST isteği başarısız oldu:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Hata durumlarına göre işlem yap
      if (error.response?.status === 401) {
        console.error('Yetkilendirme hatası: Geçersiz token veya oturum süresi dolmuş (401 Unauthorized)');
        
        // Token ve kullanıcı bilgilerini temizle
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Login sayfasına yönlendir
          if (!url.includes('/auth/login')) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          }
        }
        
        error.message = 'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.';
      } else if (error.response?.status === 403) {
        console.error('Yetkilendirme hatası: Bu işlem için yetkiniz yok (403 Forbidden)');
        error.message = 'Bu işlemi yapma yetkiniz bulunmuyor.';
      } else if (error.response?.status === 400) {
        console.error('İstek hatası (400 Bad Request):', error.response?.data);
        error.message = error.response?.data?.error || 'Geçersiz istek: Lütfen bilgilerinizi kontrol edin.';
      } else if (error.response?.status === 500) {
        console.error('Sunucu hatası (500 Internal Server Error):', error.response?.data);
        error.message = 'Sunucu hatası: ' + (error.response?.data?.error || 'İşlem sırasında bir hata oluştu.');
      } else if (!error.response) {
        console.error('Ağ hatası veya sunucuya erişilemiyor:', error.message);
        error.message = 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.';
      }
      
      throw error;
    });
} as typeof apiClient.post;

const originalPut = apiClient.put;
apiClient.put = function(url: string, data?: any, config?: any) {
  const apiUrl = url.startsWith('/api') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`;
  
  // Token eklemesi
  let headers = { ...config?.headers };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Hakem atama işlemi için özel yetkilendirme
  if (url.includes('/hakemler') || url.includes('hakemler')) {
    console.log('⚠️ Hakem atama işlemi tespit edildi - özel yetkilendirme yapılıyor');
    
    // Kullanıcı bilgilerini kontrol et
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        // Editör/Admin kullanıcısı için özel başlıklar ekle
        if (user.role === 'Editor' || user.rolId === 5 || user.role === 'admin') {
          headers['X-User-Role'] = user.role;
          headers['X-User-RolId'] = (user.rolId || 5).toString();
          headers['X-Editor-Access'] = 'true';
          console.log('✅ Editör/Admin yetkilendirme bilgileri eklendi');
          
          // API beklentisine uygun rol bilgisini veri içine de ekle
          if (typeof data === 'object' && data !== null) {
            data = {
              ...data,
              rolBilgisi: user.role,
              rolId: user.rolId || 5
            };
          }
        } else {
          console.warn('⚠️ Kullanıcı Editor veya admin değil');
        }
      }
    } catch (error) {
      console.error('Kullanıcı bilgisi işleme hatası:', error);
    }
  }
  
  // Düzenlenmiş config
  const updatedConfig = {
    ...config,
    headers
  };
  
  console.log(`🚀 PUT isteği gönderiliyor: ${apiUrl}`, { 
    headers: { ...updatedConfig.headers, Authorization: token ? `Bearer ${token.substring(0, 15)}...` : 'Yok' },
    data: data
  });
  
  return originalPut.call(apiClient, apiUrl, data, updatedConfig)
    .catch((error) => {
      // Hata ayıklama için daha fazla bilgi logla
      console.error(`❌ ${apiUrl} için PUT isteği başarısız oldu:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Hata durumlarına göre işlem yap
      if (error.response?.status === 401) {
        console.error('Yetkilendirme hatası: Geçersiz token veya oturum süresi dolmuş (401 Unauthorized)');
        // Token yenileme veya çıkış yapma işlemi yapılabilir
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        error.message = 'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.';
        
        // Sayfayı login sayfasına yönlendir
        if (typeof window !== 'undefined') {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
      } else if (error.response?.status === 403) {
        console.error('Yetkilendirme hatası: Bu işlem için yetkiniz yok (403 Forbidden)');
        
        // Token yenileme dene ve tekrar istek gönder - sadece hakem ataması için
        if (url.includes('/hakemler') && token) {
          console.log('Hakem atama işlemi için token yenileme deneniyor...');
          
          // Token ve kullanıcı bilgilerini tazele
          try {
            refreshToken().then(refreshed => {
              if (refreshed) {
                console.log('Token yenilendi, istek tekrar deneniyor...');
                // Yeniden istek gönderme işlemi burada yapılabilir
              }
            });
          } catch (refreshError) {
            console.error('Token yenileme hatası:', refreshError);
          }
        }
        
        error.message = 'Bu işlemi yapma yetkiniz bulunmuyor. Lütfen editör veya admin rolüne sahip olduğunuzdan emin olun.';
      } else if (error.response?.status === 404) {
        console.error('Kaynak bulunamadı (404 Not Found):', error.response?.data);
        error.message = 'Güncellemek istediğiniz kaynak bulunamadı.';
      } else if (error.response?.status === 500) {
        console.error('Sunucu hatası (500 Internal Server Error):', error.response?.data);
        error.message = 'Sunucu hatası: ' + (error.response?.data?.error || 'İşlem sırasında bir hata oluştu.');
      } else if (!error.response) {
        console.error('Ağ hatası veya sunucuya erişilemiyor:', error.message);
        error.message = 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.';
      }
      
      throw error;
    });
} as typeof apiClient.put;

const originalDelete = apiClient.delete;
apiClient.delete = function(url: string, config?: any) {
  const apiUrl = url.startsWith('/api') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`;
  
  // Token eklemesi
  let headers = { ...config?.headers };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Düzenlenmiş config
  const updatedConfig = {
    ...config,
    headers
  };
  
  console.log(`🚀 DELETE isteği gönderiliyor: ${apiUrl}`, { 
    headers: { ...updatedConfig.headers, Authorization: token ? `Bearer ${token.substring(0, 15)}...` : 'Yok' }
  });
  
  return originalDelete.call(apiClient, apiUrl, updatedConfig)
    .catch((error) => {
      // Hata ayıklama için daha fazla bilgi logla
      console.error(`❌ ${apiUrl} için DELETE isteği başarısız oldu:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Hata durumlarına göre işlem yap
      if (error.response?.status === 401) {
        console.error('Yetkilendirme hatası: Geçersiz token veya oturum süresi dolmuş (401 Unauthorized)');
        
        // Token ve kullanıcı bilgilerini temizle
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Login sayfasına yönlendir
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
        
        error.message = 'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.';
      } else if (error.response?.status === 403) {
        console.error('Yetkilendirme hatası: Bu işlem için yetkiniz yok (403 Forbidden)');
        error.message = 'Bu işlemi yapma yetkiniz bulunmuyor.';
      } else if (error.response?.status === 404) {
        console.error('Kaynak bulunamadı (404 Not Found):', error.response?.data);
        error.message = 'Silmek istediğiniz kaynak bulunamadı.';
      } else if (error.response?.status === 500) {
        console.error('Sunucu hatası (500 Internal Server Error):', error.response?.data);
        error.message = 'Sunucu hatası: ' + (error.response?.data?.error || 'İşlem sırasında bir hata oluştu.');
      } else if (!error.response) {
        console.error('Ağ hatası veya sunucuya erişilemiyor:', error.message);
        error.message = 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.';
      }
      
      throw error;
    });
} as typeof apiClient.delete;

// Token yönetimi
const getToken = () => {
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('token');
      
      // Token var mı ve geçerli mi kontrolü
      if (token) {
        // Token'ın yapısı kontrol edilebilir
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.warn('⚠️ Token geçersiz format içeriyor - Format hatası');
          
          // Geçersiz token'ı temizleyelim
          localStorage.removeItem('token');
          return null;
        }
        
        // Token'ın içeriğini kontrol edelim
        try {
          // Base64'ten decode edelim (ikinci kısım payload'dır)
          const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64Payload));
          
          // Token'ın süresi dolmuş mu?
          const expiryDate = payload.exp ? new Date(payload.exp * 1000) : null;
          const now = new Date();
          
          if (expiryDate && expiryDate < now) {
            console.warn('⚠️ Token süresi dolmuş:', {
              expiry: expiryDate.toISOString(),
              now: now.toISOString()
            });
            
            // Süresi dolmuş token'ı temizleyelim
            localStorage.removeItem('token');
            return null;
          }
          
          // Token'ın detaylarını logla
          console.log('✅ Token geçerli:', {
            length: token.length,
            prefix: token.substring(0, 15) + '...',
            userId: payload.userId || payload.sub || 'bilinmiyor',
            role: payload.role || 'bilinmiyor',
            rolId: payload.rolId || 'bilinmiyor',
            exp: expiryDate ? expiryDate.toISOString() : 'sonsuz',
            payloadContent: JSON.stringify(payload).substring(0, 100) + '...'
          });
          
          // Kullanıcı oturum bilgilerini de kontrol edelim
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              console.log('👤 Kullanıcı lokal bilgileri:', {
                id: user.id,
                email: user.email,
                role: user.role,
                rolId: user.rolId
              });
              
              // Token ve localStorage'daki kullanıcı bilgileri arasında rol uyuşmazlığı var mı?
              if (payload.role && user.role && payload.role !== user.role) {
                console.warn('⚠️ Token ve localStorage rol uyuşmazlığı:', {
                  tokenRole: payload.role,
                  userRole: user.role
                });
              }
              
              if (payload.rolId && user.rolId && payload.rolId !== user.rolId) {
                console.warn('⚠️ Token ve localStorage rolId uyuşmazlığı:', {
                  tokenRolId: payload.rolId,
                  userRolId: user.rolId
                });
              }
            } catch (userError) {
              console.error('⚠️ Kullanıcı bilgileri işlenirken hata:', userError);
            }
          } else {
            console.warn('⚠️ localStorage\'da user bilgisi bulunamadı, fakat token var');
          }
        } catch (decodeError) {
          console.error('⚠️ Token içeriği okunamadı:', decodeError);
          // Token içeriği okunamadı ama formatı doğru olabilir, devam edelim
        }
        
        return token;
      } else {
        console.warn('⚠️ localStorage\'da token bulunamadı');
      }
    } catch (error) {
      console.error('⚠️ Token işlenirken beklenmeyen hata oluştu:', error);
      // Token'ı temizle
      try {
        localStorage.removeItem('token');
      } catch (clearError) {
        console.error('⚠️ Token temizlenirken hata oluştu:', clearError);
      }
    }
  }
  return null;
};

// Genel bir token yenileme fonksiyonu
export const refreshToken = async (): Promise<boolean> => {
  try {
    console.log('🔄 Token yenileme işlemi başlatılıyor...');
    
    // Mevcut token
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      console.warn('⚠️ Yenilenecek token bulunamadı');
      return false;
    }
    
    try {
      // Token yenileme isteği
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      if (!response.ok) {
        console.error('❌ Token yenileme başarısız:', response.status);
        // Mevcut token'ı korumak için false dönüş yapma
        if (response.status === 404) {
          console.log('ℹ️ Refresh API endpoint mevcut değil, mevcut token kullanılmaya devam edilecek');
          // API endpoint yoksa mevcut token'ı koruyoruz
          return true;
        }
        return false;
      }
      
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('✅ Token başarıyla yenilendi');
        return true;
      }
    } catch (fetchError) {
      console.error('❌ Token yenileme fetch hatası:', fetchError);
      // Endpoint yoksa veya erişilemiyorsa, mevcut token'ı koruyalım
      // Ama token'ı doğrulayıp geçerli olduğundan emin olalım
      const tokenParts = currentToken.split('.');
      if (tokenParts.length === 3) {
        try {
          const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64Payload));
          
          // Token süresi dolmuş mu?
          const expiryDate = payload.exp ? new Date(payload.exp * 1000) : null;
          const now = new Date();
          
          if (!expiryDate || expiryDate > now) {
            console.log('ℹ️ Token hala geçerli, kullanılmaya devam edilecek');
            return true;
          }
        } catch (e) {
          // Token içeriği işlenemedi, devam et
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Token yenileme genel hatası:', error);
    return false;
  }
};

// Request interceptor - istek loglaması ve hata ayıklama
apiClient.interceptors.request.use(
  async (config) => {
    const baseUrl = config.baseURL || '';
    const url = config.url || '';
    const fullUrl = baseUrl + (url.startsWith('/') ? url : '/' + url);
    
    // Token kontrolü
    const token = getToken();
    
    // Header'ları başlat
    if (!config.headers) {
      config.headers = {} as AxiosRequestHeaders;
    }
    
    if (token) {
      // Authorization header'ını ekle
      config.headers['Authorization'] = `Bearer ${token}`;
      
      console.log(`🔑 Authorization header eklendi: Bearer ${token.substring(0, 15)}...`);
      console.log(`📝 Request config headers:`, config.headers);
    } else {
      // Login ve register istekleri için token kontrolü yapma
      const isAuthRequest = url.includes('/auth/login') || 
                          url.includes('/auth/register') || 
                          url.includes('/auth/refresh') ||
                          url.includes('/auth/session');
      
      const isPublicRequest = url.includes('/sempozyum') || 
                            url.includes('/ana-konu') || 
                            url.includes('/bildiri-konusu');
      
      if (!isAuthRequest && !isPublicRequest) {
        console.warn('⚠️ Token bulunamadı, yetkisiz istek gönderiliyor:', url);
        console.warn('⚠️ Headers:', config.headers);
        
        // Kullanıcıyı bilgilendir
        if (typeof window !== 'undefined' && !localStorage.getItem('tokenError')) {
          // Sayfa yenilendiğinde oturum yönlendirmesi olmaması için flag ekle
          localStorage.setItem('tokenError', 'true');
        }
      }
    }
    
    // Önbelleği devre dışı bırak (özellikle GET istekleri için)
    if (config.method?.toLowerCase() === 'get') {
      // Cache kontrol başlıklarını ekleyelim
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
    }
    
    // Content-Type kontrolü - sadece PUT ve POST isteklerinde uygula
    if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }
    
    // API isteklerini daha detaylı loglama
    console.log(`🔵 API İSTEK BAŞLADI: ${config.method?.toUpperCase() || 'GET'} ${fullUrl}`, {
      endpoint: url,
      baseURL: baseUrl,
      fullURL: fullUrl,
      params: config.params || {},
      data: config.data,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API İSTEK OLUŞTURMA HATASI:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Special logging for reviewer assignment endpoint
    if (response.config.url?.includes('/hakemler')) {
      console.log(`🔍 HAKEM ATAMA DETAYLI YANIT: ${response.config.method?.toUpperCase() || 'GET'} ${response.config.url}`, {
        status: response.status,
        statusText: response.statusText,
        config: {
          url: response.config.url,
          method: response.config.method,
          headers: response.config.headers,
          data: response.config.data
        },
        responseHeaders: response.headers,
        data: response.data
      });
    } else {
      console.log(`🟢 API YANIT BAŞARILI: ${response.config.method?.toUpperCase() || 'GET'} ${response.config.url}`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data ? (typeof response.data === 'object' ? response.data : 'Binary data or string response') : null
      });
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retry?: number };
    
    // Detaylı loglama
    console.error(`🔴 API HATA: ${config?.method?.toUpperCase() || 'GET'} ${config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data ? (typeof error.response.data === 'object' ? error.response.data : 'Binary data or string response') : null,
      message: error.message,
      stack: error.stack
    });
    
    // Sunucu hatası detayları
    if (error.response?.status === 500) {
      console.error('📛 SERVER ERROR: Muhtemelen bir backend hatası oluştu', {
        errorName: error.name,
        errorCode: error.code,
        serverMessage: (error.response?.data as any)?.error || (error.response?.data as any)?.message || 'Bilinmeyen sunucu hatası'
      });
      
      // Hata mesajını kişiselleştir
      const customError = new Error(
        `Sunucu hatası: ${(error.response?.data as any)?.error || (error.response?.data as any)?.message || error.message || 'Sunucu yanıt vermiyor'}`
      );
      
      // Orijinal hata detayları
      (customError as any).originalError = error;
      (customError as any).status = error.response?.status;
      (customError as any).data = error.response?.data;
      
      return Promise.reject(customError);
    }
    
    // 401 Unauthorized hatası - Token geçersiz veya süresi dolmuş
    if (error.response?.status === 401) {
      console.warn('⚠️ Yetkilendirme hatası. Token geçersiz veya süresi dolmuş olabilir.');
      
      // Tekrar deneme sayısını kontrol et ve sonsuz döngüyü engelle
      const retryCount = config._retry || 0;
      if (retryCount >= 1) {
        console.error('❌ Maksimum tekrar deneme sayısına ulaşıldı. Kullanıcı login sayfasına yönlendirilecek.');
        // Kullanıcıyı login sayfasına yönlendir
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Aktif sayfayı kaydet
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            localStorage.setItem('redirectUrl', currentPath);
            // Sayfayı yönlendir
            window.location.href = '/login?reason=session_expired';
          }
        }
        return Promise.reject(error);
      }
      
      // Token yenileme denemesi
      try {
        const refreshed = await refreshToken();
        if (refreshed && config) {
          // Tekrar deneme sayacını artır
          config._retry = retryCount + 1;
          
          // İsteği yeni token ile tekrarla
          if (config.headers) {
            // Header tipini dönüştür
            const headers = config.headers as Record<string, string>;
            headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
          }
          
          console.log('🔄 İstek yeni token ile tekrarlanıyor');
          return apiClient(config);
        }
      } catch (refreshError) {
        console.error('❌ Token yenileme başarısız:', refreshError);
      }
      
      // Token yenilemesi başarısız olduysa, Login sayfasına yönlendir
      if (typeof window !== 'undefined') {
        // Sayfa yüklemesinin engellenmemesi için 10ms bekle 
        setTimeout(() => {
          console.warn('⚠️ Login sayfasına yönlendiriliyor...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Aktif sayfayı kaydet
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            localStorage.setItem('redirectUrl', currentPath);
          }
          
          // Login sayfasına yönlendir
          window.location.href = '/login';
        }, 10);
      }
    }
    
    return Promise.reject(error);
  }
); 