/**
 * Bildiri durum yardımcı fonksiyonları
 */

/**
 * Bildiri durumunun revizyon durumunda olup olmadığını kontrol eder
 * @param status Kontrol edilecek bildiri durumu
 * @returns true: Revizyon durumunda, false: Revizyon durumunda değil
 */
export const isDuzeltmeStatus = (status: string | undefined): boolean => {
  if (!status) return false;
  
  // Eğer bildiri durumu "REVIZE_YAPILDI" veya "revize_yapildi" ise false döndür
  // Böylece revize edilmiş bildiriler tekrar revize edilemez
  if (status === 'REVIZE_YAPILDI' || 
      status === 'revize_yapildi' || 
      status.toLowerCase() === 'revize_yapildi') {
    console.log("Bildiri zaten revize edilmiş durumda, tekrar revize edilemez");
    return false;
  }
  
  // Olası tüm revizyon değerlerini kontrol eden helper fonksiyon
  const statusLower = status.toLowerCase();
  
  return (
    status === 'DUZELTME' || 
    status === 'duzeltme' || 
    status === 'Duzeltme' ||
    status === 'revizyon_istendi' ||
    status === 'REVIZYON_ISTENDI' ||
    status === 'revizyon istendi' ||
    status === 'REVIZYON ISTENDI' ||
    status === 'REVIEW_REQUESTED' ||
    statusLower === 'duzeltme' ||
    statusLower.includes('düzelt') ||
    statusLower.includes('duzelt') ||
    statusLower.includes('reviz') ||
    statusLower.includes('revis')
  );
};

/**
 * Bildiri durumuna göre renk sınıfı döndürür
 * @param status Kontrol edilecek bildiri durumu
 * @returns Tailwind renk sınıfı
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'BEKLEMEDE':
    case 'beklemede':
      return 'bg-gray-100 text-gray-800';
    case 'INCELEMEDE':
    case 'incelemede':
      return 'bg-blue-100 text-blue-800';
    case 'KABUL':
    case 'kabul':
    case 'kabul_edildi':
    case 'KABUL_EDILDI':
      return 'bg-green-100 text-green-800';
    case 'RED':
    case 'red':
    case 'reddedildi':
    case 'REDDEDILDI':
      return 'bg-red-100 text-red-800';
    case 'DUZELTME':
    case 'duzeltme':
    case 'revizyon_istendi':
    case 'REVIZYON_ISTENDI':
      return 'bg-yellow-100 text-yellow-800';
    case 'REVIZE_YAPILDI':
    case 'revize_yapildi':
      return 'bg-blue-100 text-blue-800';
    default:
      // Default handling by mapping common status patterns to appropriate colors
      const statusLower = String(status).toLowerCase();
      if (statusLower.includes('bekle') || statusLower.includes('pending')) {
        return 'bg-gray-100 text-gray-800';
      }
      if (statusLower.includes('incele') || statusLower.includes('review')) {
        return 'bg-blue-100 text-blue-800';
      }
      if (statusLower.includes('kabul') || statusLower.includes('accept')) {
        return 'bg-green-100 text-green-800';
      }
      if (statusLower.includes('red') || statusLower.includes('reject')) {
        return 'bg-red-100 text-red-800';
      }
      if (statusLower.includes('duzel') || statusLower.includes('reviz') || statusLower.includes('revis')) {
        return 'bg-yellow-100 text-yellow-800';
      }
      // Default fallback
      return 'bg-purple-100 text-purple-800';
  }
};

/**
 * Bildiri durumu için okunabilir metin döndürür
 * @param status Kontrol edilecek bildiri durumu
 * @returns Okunabilir durum metni
 */
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'BEKLEMEDE':
    case 'beklemede':
    case 'pending':
      return 'Beklemede';
    case 'INCELEMEDE':
    case 'incelemede':
    case 'under-review':
    case 'under_review':
      return 'İncelemede';
    case 'KABUL':
    case 'kabul':
    case 'kabul_edildi':
    case 'KABUL_EDILDI':
    case 'accepted':
      return 'Kabul Edildi';
    case 'RED':
    case 'red':
    case 'reddedildi':
    case 'REDDEDILDI':
    case 'rejected':
      return 'Reddedildi';
    case 'DUZELTME':
    case 'duzeltme':
    case 'revizyon_istendi':
    case 'REVIZYON_ISTENDI':
    case 'revision-needed':
    case 'revision_needed':
      return 'Düzeltme Gerekli';
    case 'REVIZE_YAPILDI':
    case 'revize_yapildi':
      return 'Revizyon Yapıldı';
    default:
      // Format unknown status by capitalizing first letter
      if (typeof status === 'string' && status.length > 0) {
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      }
      return String(status);
  }
}; 