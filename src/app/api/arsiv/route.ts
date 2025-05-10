import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Modern App Router yapılandırması
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Arşivleri listele
export async function GET(request: NextRequest) {
  try {
    // URL parametrelerini al
    const sempozyumId = request.nextUrl.searchParams.get('sempozyumId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
    
    // Filtreleme için where koşullarını oluştur
    let where: any = {};
    if (sempozyumId) {
      where.sempozyumId = parseInt(sempozyumId);
    }
    
    // Arşiv sayısını al
    const total = await prisma.arsiv.count({ where });
    
    // Arşivleri listele
    const arsivler = await prisma.arsiv.findMany({
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
      },
      skip: offset,
      take: limit
    });

    return NextResponse.json({
      arsivler,
      meta: {
        total,
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('Arşiv listesi hatası:', error);
    return NextResponse.json(
      { error: 'Arşivler alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni arşiv ekle (sadece admin)
export async function POST(request: NextRequest) {
  try {
    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Admin rolünü kontrol et
    const roleResult = await roleMiddleware(request, ['admin']);
    if (roleResult instanceof NextResponse) {
      return roleResult;
    }

    const data = await request.json();
    
    // Zorunlu alanları kontrol et
    const requiredFields = ['sempozyumId', 'ad', 'aciklama'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} alanı zorunludur` },
          { status: 400 }
        );
      }
    }
    
    // Sempozyumun varlığını kontrol et
    const sempozyum = await prisma.sempozyum.findUnique({
      where: { id: parseInt(data.sempozyumId) }
    });
    
    if (!sempozyum) {
      return NextResponse.json(
        { error: 'Belirtilen sempozyum bulunamadı' },
        { status: 404 }
      );
    }
    
    // Yeni arşiv kaydı oluştur
    const yeniArsiv = await prisma.arsiv.create({
      data: {
        sempozyumId: parseInt(data.sempozyumId),
        ad: data.ad,
        aciklama: data.aciklama,
        kapakGorselUrl: data.kapakGorselUrl || null,
        pdfDosya: data.pdfDosya || null
      }
    });

    return NextResponse.json({
      message: 'Arşiv başarıyla oluşturuldu',
      arsiv: yeniArsiv
    });
  } catch (error: any) {
    console.error('Arşiv ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Arşiv eklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 