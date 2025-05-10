import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Komite üyelerini listele
export async function GET(request: NextRequest) {
  try {
    const sempozyumId = request.nextUrl.searchParams.get('sempozyumId');
    const komiteTur = request.nextUrl.searchParams.get('komiteTur');
    
    let where: any = {};
    
    if (sempozyumId) {
      where.sempozyumId = parseInt(sempozyumId);
    }
    
    if (komiteTur) {
      where.komiteTur = komiteTur;
    }
    
    const komiteUyeleri = await prisma.komite.findMany({
      where,
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      },
      orderBy: [
        { komiteTur: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json(komiteUyeleri);
  } catch (error: any) {
    console.error('Komite listesi hatası:', error);
    return NextResponse.json(
      { error: 'Komite üyeleri alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni komite üyesi ekle (sadece admin)
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authResult = await roleMiddleware(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { sempozyumId, unvan, ad, soyad, kurum, komiteTur } = body;

    // Zorunlu alanları kontrol et
    if (!sempozyumId || !ad || !soyad || !komiteTur) {
      return NextResponse.json(
        { error: 'Zorunlu alanlar eksik', detay: 'sempozyumId, ad, soyad ve komiteTur alanları zorunludur' },
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

    // Yeni komite üyesi oluştur
    const yeniKomiteUyesi = await prisma.komite.create({
      data: {
        sempozyumId,
        unvan,
        ad,
        soyad,
        kurum,
        komiteTur
      }
    });

    return NextResponse.json(
      { message: 'Komite üyesi başarıyla eklendi', komiteUyesi: yeniKomiteUyesi },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Komite üyesi ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Komite üyesi eklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 