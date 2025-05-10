import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  id: number;
  eposta: string;
  ad: string;
  soyad: string;
  rol: string;
  rolId?: number;
  iat?: number;
  exp?: number;
}

/**
 * JWT token doğrulama middleware'i
 * @param request API isteği
 * @returns İşlenmiş istek veya hata yanıtı
 */
export async function authMiddleware(request: NextRequest) {
  try {
    // Authorization header'ı al
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Yetkilendirme başlığı gereklidir' },
        { status: 401 }
      );
    }

    // Token'ı ayıkla
    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Geçersiz token formatı' },
        { status: 401 }
      );
    }

    // JWT secret kontrolü
    const jwtSecret = process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      console.error('JWT secret key tanımlanmamış!');
      return NextResponse.json(
        { error: 'Sunucu yapılandırma hatası' },
        { status: 500 }
      );
    }

    // Token'ı doğrula
    try {
      const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
      
      // Rol ID kontrolü ve düzeltme
      let rolId = decoded.rolId;
      const userRole = decoded.rol?.toLowerCase();
      
      // Rol ID yoksa veya geçersizse, rol adına göre belirle
      if (!rolId || rolId === 5) {
        switch (userRole) {
          case 'admin':
            rolId = 1;
            break;
          case 'editor':
            rolId = 2;
            break;
          case 'hakem':
            rolId = 3;
            break;
          case 'yazar':
            rolId = 4;
            break;
          default:
            rolId = 4;
        }
      }
      
      // Kullanıcı nesnesini oluştur
      const user = {
        id: decoded.id,
        eposta: decoded.eposta,
        ad: decoded.ad,
        soyad: decoded.soyad,
        rol: userRole,
        rolId: rolId,
        iat: decoded.iat,
        exp: decoded.exp,
        isAdmin: userRole === 'admin',
        isEditor: userRole === 'editor' || rolId === 5,
        isReviewer: userRole === 'hakem',
        isAuthor: userRole === 'yazar',
        fullName: `${decoded.ad} ${decoded.soyad}`
      };
      
      return { user };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: 'Token süresi dolmuş' },
          { status: 401 }
        );
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json(
          { error: 'Geçersiz token' },
          { status: 401 }
        );
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('Auth middleware hatası:', error);
    return NextResponse.json(
      { error: 'Yetkilendirme işlemi başarısız', detay: error.message },
      { status: 500 }
    );
  }
}

/**
 * Belirli bir role sahip kullanıcıları doğrulama
 * @param request API isteği
 * @param requiredRoles Gerekli roller dizisi veya tek bir rol
 * @returns İşlenmiş istek veya hata yanıtı
 */
export async function roleMiddleware(request: NextRequest, requiredRoles: string | string[]) {
  const authResult = await authMiddleware(request);
  
  // Eğer authResult bir Response ise (hata durumu), onu döndür
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // User nesnesini alıyoruz (güncellenmiş authMiddleware'den)
  const user = authResult.user;
  if (!user) {
    return NextResponse.json(
      { error: 'Kullanıcı bilgisi bulunamadı' },
      { status: 401 }
    );
  }

  // requiredRoles'u dizi formatına dönüştür (tek bir string ise dizi yap)
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  // Log ekleyelim
  console.log('Token rol değeri:', user.rol);
  console.log('Gereken roller:', roles);
  console.log('Kullanıcı tüm rol bilgileri:', {
    rol: user.rol,
    rolId: user.rolId,
    isAdmin: user.isAdmin,
    isEditor: user.isEditor,
    isReviewer: user.isReviewer,
    isAuthor: user.isAuthor
  });

  // Rol kontrolü - büyük/küçük harfe duyarsız karşılaştırma
  // Kullanıcının rolü, izin verilen rollerden biri mi diye kontrol et
  const userRole = user.rol.toLowerCase();
  
  // Editor özel kontrolü - isEditor yardımcı değişkenini de kullan
  const isEditorRequested = roles.some(role => role.toLowerCase() === 'editor');
  
  // Kontrol stratejisi: 
  // 1. Normal rol eşleşmesi
  // 2. Editor için rolId=5 kontrolü (isEditor flag'i true olursa yetkili)
  // 3. Admin herzaman tüm yetkiye sahip
  const hasPermission = roles.some(role => role.toLowerCase() === userRole) || 
                        (isEditorRequested && user.isEditor) ||
                        (user.isAdmin); // Admin her zaman yetkili
  
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Bu işlem için yetkiniz bulunmamaktadır' },
      { status: 403 }
    );
  }

  // Kimlik bilgilerini döndür
  return authResult;
} 