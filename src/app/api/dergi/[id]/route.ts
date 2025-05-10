import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Belirli bir dergiyi getir
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }
    
    const dergi = await prisma.dergi.findUnique({
      where: { id },
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      }
    });

    if (!dergi) {
      return NextResponse.json(
        { error: 'Dergi bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(dergi);
  } catch (error: any) {
    console.error('Dergi görüntüleme hatası:', error);
    return NextResponse.json(
      { error: 'Dergi alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Dergi güncelle (sadece admin)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    // Admin kontrolü
    const authResult = await roleMiddleware(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('Güncelleme verisi:', body);
    
    // API URL kontrolü
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log('API URL (güncelleme):', apiUrl);
    
    // Eğer API URL tanımlı değilse, doğrudan veritabanı işlemi yapalım
    if (!apiUrl) {
      console.log('API URL tanımlı değil, direkt veritabanında güncelleme yapılıyor');
      
      // Derginin varlığını kontrol et
      const mevcutDergi = await prisma.dergi.findUnique({
        where: { id }
      });

      if (!mevcutDergi) {
        return NextResponse.json(
          { error: 'Dergi bulunamadı' },
          { status: 404 }
        );
      }

      const { sempozyumId, ad, aciklama, yayinTarihi, kapakGorselUrl, pdfDosya } = body;

      // Güncellenecek verileri hazırla
      const updateData: any = {};

      if (sempozyumId !== undefined) {
        // Sempozyum ID'si değiştiriliyorsa, sempozyumun varlığını kontrol et
        if (sempozyumId !== mevcutDergi.sempozyumId) {
          const sempozyum = await prisma.sempozyum.findUnique({
            where: { id: sempozyumId }
          });

          if (!sempozyum) {
            return NextResponse.json(
              { error: 'Belirtilen sempozyum bulunamadı' },
              { status: 404 }
            );
          }
        }
        updateData.sempozyumId = sempozyumId;
      }

      // Tarih formatını kontrol et
      if (yayinTarihi !== undefined) {
        try {
          const parsedYayinTarihi = new Date(yayinTarihi);
          if (isNaN(parsedYayinTarihi.getTime())) {
            throw new Error('Geçersiz tarih formatı');
          }
          updateData.yayinTarihi = parsedYayinTarihi;
        } catch (e) {
          return NextResponse.json(
            { error: 'Geçersiz tarih formatı', detay: 'yayinTarihi geçerli bir tarih olmalıdır' },
            { status: 400 }
          );
        }
      }

      // Diğer alanları güncelleme verisine ekle
      if (ad !== undefined) updateData.ad = ad;
      if (aciklama !== undefined) updateData.aciklama = aciklama;
      if (kapakGorselUrl !== undefined) updateData.kapakGorselUrl = kapakGorselUrl;
      if (pdfDosya !== undefined) updateData.pdfDosya = pdfDosya;

      // Dergiyi güncelle
      const guncelDergi = await prisma.dergi.update({
        where: { id },
        data: updateData
      });

      return NextResponse.json({
        message: 'Dergi başarıyla güncellendi',
        dergi: guncelDergi
      });
    }
    
    // Harici API kullanımı
    console.log('Harici API kullanılıyor (güncelleme):', `${apiUrl}/api/dergiler/${id}`);
    
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${apiUrl}/api/dergiler/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend API error (güncelleme):', errorData);
      return NextResponse.json(
        { 
          error: errorData.message || 'Dergi güncellenirken bir hata oluştu', 
          detay: errorData.detay || 'Sunucu hatası, lütfen daha sonra tekrar deneyin.' 
        },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Dergi güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Dergi güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Dergi sil (sadece admin)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Admin kontrolü
    const authResult = await roleMiddleware(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }

    // Derginin varlığını kontrol et
    const dergi = await prisma.dergi.findUnique({
      where: { id }
    });

    if (!dergi) {
      return NextResponse.json(
        { error: 'Dergi bulunamadı' },
        { status: 404 }
      );
    }

    // Dergiyi sil
    await prisma.dergi.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Dergi başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Dergi silme hatası:', error);
    return NextResponse.json(
      { error: 'Dergi silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 