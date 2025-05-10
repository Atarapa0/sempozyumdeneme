import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Önemli tarihleri listele
export async function GET(request: NextRequest) {
  try {
    const sempozyumId = request.nextUrl.searchParams.get('sempozyumId');
    
    let where = {};
    if (sempozyumId) {
      where = { sempozyumId: parseInt(sempozyumId) };
    }
    
    const onemliTarihler = await prisma.onemliTarihler.findMany({
      where,
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        tarih: 'asc'
      }
    });

    return NextResponse.json(onemliTarihler);
  } catch (error: any) {
    console.error('Önemli tarihler listesi hatası:', error);
    return NextResponse.json(
      { error: 'Önemli tarihler alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni önemli tarih ekle (sadece admin)
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authResult = await roleMiddleware(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { sempozyumId, baslik, tarih, durum } = body;

    // Zorunlu alanları kontrol et
    if (!sempozyumId || !baslik || !tarih) {
      return NextResponse.json(
        { error: 'Tüm alanlar zorunludur', detay: 'sempozyumId, baslik ve tarih alanları zorunludur' },
        { status: 400 }
      );
    }

    // Sempozyum varlığını kontrol et
    const sempozyum = await prisma.sempozyum.findUnique({
      where: { id: sempozyumId }
    });

    if (!sempozyum) {
      return NextResponse.json(
        { error: 'Belirtilen sempozyum bulunamadı' },
        { status: 404 }
      );
    }

    // Tarih formatını kontrol et
    let parsedTarih;
    try {
      parsedTarih = new Date(tarih);
      if (isNaN(parsedTarih.getTime())) {
        throw new Error('Geçersiz tarih formatı');
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Geçersiz tarih formatı', detay: 'tarih geçerli bir tarih olmalıdır' },
        { status: 400 }
      );
    }

    // Yeni önemli tarih oluştur
    const yeniOnemliTarih = await prisma.onemliTarihler.create({
      data: {
        sempozyumId,
        baslik,
        tarih: parsedTarih,
        durum: durum ?? false
      }
    });

    return NextResponse.json(
      { message: 'Önemli tarih başarıyla eklendi', onemliTarih: yeniOnemliTarih },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Önemli tarih ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Önemli tarih eklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 