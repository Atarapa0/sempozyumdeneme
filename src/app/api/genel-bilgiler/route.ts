import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Modern App Router yapılandırması
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tüm genel bilgileri listele
export async function GET(request: NextRequest) {
  try {
    const sempozyumId = request.nextUrl.searchParams.get('sempozyumId');
    
    let where = {};
    if (sempozyumId) {
      where = { sempozyumId: parseInt(sempozyumId) };
    }
    
    const genelBilgiler = await prisma.genelBilgiler.findMany({
      where,
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(genelBilgiler);
  } catch (error: any) {
    console.error('Genel bilgiler listesi hatası:', error);
    return NextResponse.json(
      { error: 'Genel bilgiler alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni genel bilgi ekle (sadece admin)
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authResult = await roleMiddleware(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { 
      sempozyumId, 
      title, 
      altbaslik, 
      tariharaligi, 
      geriSayimBitimTarihi, 
      yer, 
      organizator, 
      kisaaciklama, 
      uzunaciklama, 
      docentlikbilgisi, 
      yil 
    } = body;

    // Zorunlu alanları kontrol et
    if (!sempozyumId || !title || !altbaslik || !tariharaligi || !geriSayimBitimTarihi || 
        !yer || !organizator || !kisaaciklama || !uzunaciklama || !yil) {
      return NextResponse.json(
        { error: 'Zorunlu alanlar eksik', detay: 'sempozyumId, title, altbaslik, tariharaligi, geriSayimBitimTarihi, yer, organizator, kisaaciklama, uzunaciklama ve yil alanları zorunludur' },
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
    let parsedGeriSayimTarihi;
    try {
      parsedGeriSayimTarihi = new Date(geriSayimBitimTarihi);
      if (isNaN(parsedGeriSayimTarihi.getTime())) {
        throw new Error('Geçersiz tarih formatı');
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Geçersiz tarih formatı', detay: 'geriSayimBitimTarihi geçerli bir tarih olmalıdır' },
        { status: 400 }
      );
    }

    // Yeni genel bilgi oluştur
    const yeniGenelBilgi = await prisma.genelBilgiler.create({
      data: {
        sempozyumId,
        title,
        altbaslik,
        tariharaligi,
        geriSayimBitimTarihi: parsedGeriSayimTarihi,
        yer,
        organizator,
        kisaaciklama,
        uzunaciklama,
        docentlikbilgisi,
        yil: parseInt(yil.toString())
      }
    });

    return NextResponse.json(
      { message: 'Genel bilgiler başarıyla eklendi', genelBilgi: yeniGenelBilgi },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Genel bilgi ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Genel bilgi eklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 