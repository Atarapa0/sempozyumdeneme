/**
 * Token utility functions for JWT authentication
 */

/**
 * Retrieves and validates the JWT token from localStorage
 * @returns The valid JWT token or null if not found or invalid
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

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
          expiry: expiryDate ? expiryDate.toISOString() : 'sonsuz'
        });
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
  
  return null;
};

/**
 * Checks if a token exists and is valid
 * @returns boolean indicating if the user has a valid token
 */
export const hasValidToken = (): boolean => {
  return getToken() !== null;
};

/**
 * Clears the authentication token from localStorage
 */
export const clearToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}; 