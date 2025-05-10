import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Bildiri konularını listele
export async function GET(request: NextRequest) {
  try {
    const sempozyumId = request.nextUrl.searchParams.get('sempozyumId');
    const anaKonuId = request.nextUrl.searchParams.get('anaKonuId');
    
    let where: any = {};
    
    if (sempozyumId) {
      where.sempozyumId = parseInt(sempozyumId);
    }
    
    if (anaKonuId) {
      where.anaKonuId = parseInt(anaKonuId);
    }
    
    const bildiriKonulari = await prisma.bildiriKonusu.findMany({
      where,
      include: {
        sempozyum: {
          select: {
            title: true
          }
        },
        anaKonu: {
          select: {
            baslik: true
          }
        },
        _count: {
          select: {
            bildiriler: true
          }
        }
      },
      orderBy: [
        { anaKonuId: 'asc' },
        { baslik: 'asc' }
      ]
    });

    return NextResponse.json(bildiriKonulari);
  } catch (error: any) {
    console.error('Bildiri konuları listesi hatası:', error);
    return NextResponse.json(
      { error: 'Bildiri konuları alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni bildiri konusu ekle (sadece admin)
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authResult = await roleMiddleware(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { sempozyumId, anaKonuId, baslik, aciklama } = body;

    // Zorunlu alanları kontrol et
    if (!sempozyumId || !anaKonuId || !baslik || !aciklama) {
      return NextResponse.json(
        { error: 'Zorunlu alanlar eksik', detay: 'sempozyumId, anaKonuId, baslik ve aciklama alanları zorunludur' },
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

    // Ana konu varlığını kontrol et
    const anaKonu = await prisma.anaKonu.findUnique({
      where: { id: anaKonuId }
    });

    if (!anaKonu) {
      return NextResponse.json(
        { error: 'Belirtilen ana konu bulunamadı' },
        { status: 404 }
      );
    }

    // Belirtilen ana konunun aynı sempozyuma ait olduğunu kontrol et
    if (anaKonu.sempozyumId !== sempozyumId) {
      return NextResponse.json(
        { error: 'Ana konu belirtilen sempozyuma ait değil' },
        { status: 400 }
      );
    }

    // Yeni bildiri konusu oluştur
    const yeniBildiriKonusu = await prisma.bildiriKonusu.create({
      data: {
        sempozyumId,
        anaKonuId,
        baslik,
        aciklama
      }
    });

    return NextResponse.json(
      { message: 'Bildiri konusu başarıyla eklendi', bildiriKonusu: yeniBildiriKonusu },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Bildiri konusu ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Bildiri konusu eklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 