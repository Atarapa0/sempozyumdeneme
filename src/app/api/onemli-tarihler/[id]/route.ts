import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Belirli bir önemli tarih kaydını getir
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }
    
    const onemliTarih = await prisma.onemliTarihler.findUnique({
      where: { id },
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      }
    });

    if (!onemliTarih) {
      return NextResponse.json(
        { error: 'Önemli tarih kaydı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(onemliTarih);
  } catch (error: any) {
    console.error('Önemli tarih görüntüleme hatası:', error);
    return NextResponse.json(
      { error: 'Önemli tarih alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Önemli tarih güncelle (sadece admin)
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

    // Önemli tarihin varlığını kontrol et
    const mevcutOnemliTarih = await prisma.onemliTarihler.findUnique({
      where: { id }
    });

    if (!mevcutOnemliTarih) {
      return NextResponse.json(
        { error: 'Önemli tarih kaydı bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { sempozyumId, baslik, tarih, durum } = body;

    // Güncellenecek verileri hazırla
    const updateData: any = {};

    if (sempozyumId !== undefined) {
      // Sempozyum ID'si değiştiriliyorsa, sempozyumun varlığını kontrol et
      if (sempozyumId !== mevcutOnemliTarih.sempozyumId) {
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

    // Diğer alanları güncelleme verisine ekle
    if (baslik !== undefined) updateData.baslik = baslik;
    if (durum !== undefined) updateData.durum = durum;
    
    if (tarih !== undefined) {
      try {
        const parsedTarih = new Date(tarih);
        if (isNaN(parsedTarih.getTime())) {
          throw new Error('Geçersiz tarih formatı');
        }
        updateData.tarih = parsedTarih;
      } catch (e) {
        return NextResponse.json(
          { error: 'Geçersiz tarih formatı', detay: 'tarih geçerli bir tarih olmalıdır' },
          { status: 400 }
        );
      }
    }

    // Önemli tarihi güncelle
    const guncelOnemliTarih = await prisma.onemliTarihler.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Önemli tarih başarıyla güncellendi',
      onemliTarih: guncelOnemliTarih
    });
  } catch (error: any) {
    console.error('Önemli tarih güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Önemli tarih güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Önemli tarih sil (sadece admin)
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

    // Önemli tarihin varlığını kontrol et
    const onemliTarih = await prisma.onemliTarihler.findUnique({
      where: { id }
    });

    if (!onemliTarih) {
      return NextResponse.json(
        { error: 'Önemli tarih kaydı bulunamadı' },
        { status: 404 }
      );
    }

    // Önemli tarihi sil
    await prisma.onemliTarihler.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Önemli tarih başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Önemli tarih silme hatası:', error);
    return NextResponse.json(
      { error: 'Önemli tarih silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 