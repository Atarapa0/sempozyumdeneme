import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Auth kontrolü - editor veya admin rolü gerekiyor
    const authResult = await roleMiddleware(request, ['admin', 'editor']);
    
    // Eğer authResult bir Response ise (hata durumu), onu döndür
    if (authResult instanceof NextResponse) {
      console.error('Yetkilendirme hatası:', authResult.status);
      return authResult;
    }

    // User nesnesini alıyoruz
    const user = authResult.user;
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bilgisi bulunamadı' },
        { status: 401 }
      );
    }

    // Log ekle - daha detaylı bilgi
    console.log('Hakem atama API - Kullanıcı bilgileri:', {
      id: user.id,
      rol: user.rol,
      rolId: user.rolId,
      isAdmin: user.isAdmin,
      isEditor: user.isEditor
    });

    // Rol kontrolü - editör veya admin rolü
    const isAuthorized = user.isEditor || user.isAdmin;
    if (!isAuthorized) {
      console.error('Yetkilendirme hatası: Kullanıcı editor veya admin değil');
      return NextResponse.json(
        { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    // İstek gövdesini al
    const body = await request.json();
    console.log('Admin hakem atama proxy isteği:', body);

    // Gerekli parametrelerin kontrolü
    if (!body.bildiriId || !Array.isArray(body.hakemIds)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz istek formatı' },
        { status: 400 }
      );
    }

    // Yeni direkt API endpoint'ine yönlendir
    try {
      // Authorization header'ını al
      const token = request.headers.get('Authorization') || '';
      
      console.log('Hakem atama isteği gönderiliyor:', {
        bildiriId: body.bildiriId,
        hakemIds: body.hakemIds,
        tokenBaşlangıç: token.substring(0, 20) + '...'
      });
      
      // Mevcut bildiri/[id]/hakemler endpoint'ine istek gönder
      const response = await fetch(`${request.nextUrl.origin}/api/bildiri/${body.bildiriId}/hakemler`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          hakemler: body.hakemIds
        })
      });
      
      // Yanıt bilgilerini logla
      console.log('API yanıt durumu:', response.status, response.statusText);
      
      // Yanıtı döndür
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Hakem atama API hatası:', result);
        throw new Error(result.error || 'Hakem atama işlemi başarısız oldu');
      }
      
      console.log('Hakem atama sonucu:', result);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Hakemler başarıyla atandı',
        data: result
      });
    } catch (error: any) {
      console.error('Hakem atama hatası:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Hakem atama işlemi başarısız oldu',
          details: {}
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Proxy route hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'İşlem başarısız oldu' },
      { status: 500 }
    );
  }
} 