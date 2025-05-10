import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Ana konuları listele
export async function GET(request: NextRequest) {
  try {
    const sempozyumId = request.nextUrl.searchParams.get('sempozyumId');
    
    let where = {};
    if (sempozyumId) {
      where = { sempozyumId: parseInt(sempozyumId) };
    }
    
    const anaKonular = await prisma.anaKonu.findMany({
      where,
      include: {
        sempozyum: {
          select: {
            title: true
          }
        },
        _count: {
          select: {
            bildiriKonulari: true,
            bildiriler: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(anaKonular);
  } catch (error: any) {
    console.error('Ana konular listesi hatası:', error);
    return NextResponse.json(
      { error: 'Ana konular alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni ana konu ekle (sadece admin)
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authResult = await roleMiddleware(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { sempozyumId, baslik, aciklama } = body;

    // Zorunlu alanları kontrol et
    if (!sempozyumId || !baslik || !aciklama) {
      return NextResponse.json(
        { error: 'Zorunlu alanlar eksik', detay: 'sempozyumId, baslik ve aciklama alanları zorunludur' },
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

    // Yeni ana konu oluştur
    const yeniAnaKonu = await prisma.anaKonu.create({
      data: {
        sempozyumId,
        baslik,
        aciklama
      }
    });

    return NextResponse.json(
      { message: 'Ana konu başarıyla eklendi', anaKonu: yeniAnaKonu },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Ana konu ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Ana konu eklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 