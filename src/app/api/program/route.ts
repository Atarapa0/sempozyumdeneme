import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Program etkinliklerini listele
export async function GET(request: NextRequest) {
  try {
    const sempozyumId = request.nextUrl.searchParams.get('sempozyumId');
    const gun = request.nextUrl.searchParams.get('gun');
    const tip = request.nextUrl.searchParams.get('tip');
    
    let where: any = {};
    
    if (sempozyumId) {
      where.sempozyumId = parseInt(sempozyumId);
    }
    
    if (gun) {
      where.gun = gun;
    }
    
    if (tip) {
      where.tip = tip;
    }
    
    const programEtkinlikleri = await prisma.program.findMany({
      where,
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      },
      orderBy: [
        { gun: 'asc' },
        { basTarih: 'asc' }
      ]
    });

    return NextResponse.json(programEtkinlikleri);
  } catch (error: any) {
    console.error('Program listesi hatası:', error);
    return NextResponse.json(
      { error: 'Program etkinlikleri alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni program etkinliği ekle (sadece admin)
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
      gun, 
      basTarih, 
      bitTarih, 
      title, 
      konusmaci, 
      lokasyon, 
      tip, 
      aciklama, 
      oturumBaskani 
    } = body;

    // Zorunlu alanları kontrol et
    if (!sempozyumId || !gun || !basTarih || !bitTarih || !title || !lokasyon || !tip) {
      return NextResponse.json(
        { error: 'Zorunlu alanlar eksik', detay: 'sempozyumId, gun, basTarih, bitTarih, title, lokasyon ve tip alanları zorunludur' },
        { status: 400 }
      );
    }

    // Program tip kontrolü
    const gecerliProgramTipleri = ['acilis', 'keynote', 'oturum', 'poster', 'calistay', 'panel', 'ara', 'yemek', 'sosyal', 'kapanis'];
    if (!gecerliProgramTipleri.includes(tip)) {
      return NextResponse.json(
        { error: 'Geçersiz program tipi', detay: `Program tipi şunlardan biri olmalıdır: ${gecerliProgramTipleri.join(', ')}` },
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

    // Başlangıç ve bitiş zamanı formatını kontrol et (sadece saat:dakika formatını kontrol ediyoruz)
    const saatDakikaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!saatDakikaRegex.test(basTarih) || !saatDakikaRegex.test(bitTarih)) {
      return NextResponse.json(
        { error: 'Geçersiz zaman formatı', detay: 'basTarih ve bitTarih HH:MM formatında olmalıdır (örn: 09:30, 14:45)' },
        { status: 400 }
      );
    }

    // Başlangıç zamanının bitiş zamanından önce olduğunu kontrol et
    const [baslamaSaat, baslamaDakika] = basTarih.split(':').map(Number);
    const [bitisSaat, bitisDakika] = bitTarih.split(':').map(Number);
    
    const baslamaDakikaToplam = baslamaSaat * 60 + baslamaDakika;
    const bitisDakikaToplam = bitisSaat * 60 + bitisDakika;
    
    if (baslamaDakikaToplam >= bitisDakikaToplam) {
      return NextResponse.json(
        { error: 'Geçersiz zaman aralığı', detay: 'Başlangıç zamanı bitiş zamanından önce olmalıdır' },
        { status: 400 }
      );
    }

    // Yeni program etkinliği oluştur
    const yeniProgramEtkinligi = await prisma.program.create({
      data: {
        sempozyumId,
        gun,
        basTarih,
        bitTarih,
        title,
        konusmaci,
        lokasyon,
        tip,
        aciklama,
        oturumBaskani
      }
    });

    return NextResponse.json(
      { message: 'Program etkinliği başarıyla eklendi', programEtkinligi: yeniProgramEtkinligi },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Program etkinliği ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Program etkinliği eklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 