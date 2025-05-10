import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Tüm sponsorları listele
export async function GET(request: NextRequest) {
  try {
    const sempozyumId = request.nextUrl.searchParams.get('sempozyumId');
    
    let where = {};
    if (sempozyumId) {
      where = { sempozyumId: parseInt(sempozyumId) };
    }
    
    const sponsorlar = await prisma.sponsor.findMany({
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

    return NextResponse.json(sponsorlar);
  } catch (error: any) {
    console.error('Sponsor listesi hatası:', error);
    return NextResponse.json(
      { error: 'Sponsorlar alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni sponsor ekle (sadece admin)
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authResult = await roleMiddleware(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { sempozyumId, ad, logoUrl, link } = body;

    // Zorunlu alanları kontrol et
    if (!sempozyumId || !ad || !logoUrl || !link) {
      return NextResponse.json(
        { error: 'Tüm alanlar zorunludur' },
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

    // Yeni sponsor oluştur
    const yeniSponsor = await prisma.sponsor.create({
      data: {
        sempozyumId,
        ad,
        logoUrl,
        link
      }
    });

    return NextResponse.json(
      { message: 'Sponsor başarıyla eklendi', sponsor: yeniSponsor },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Sponsor ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Sponsor eklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 