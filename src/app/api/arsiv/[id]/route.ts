import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Modern App Router yapılandırması
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Belirli bir arşiv kaydını getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçerli bir ID belirtiniz' },
        { status: 400 }
      );
    }

    // Arşivi bul
    const arsiv = await prisma.arsiv.findUnique({
      where: { id },
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      }
    });

    if (!arsiv) {
      return NextResponse.json(
        { error: 'Arşiv bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(arsiv);
  } catch (error: any) {
    console.error('Arşiv getirme hatası:', error);
    return NextResponse.json(
      { error: 'Arşiv alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Arşiv kaydını güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçerli bir ID belirtiniz' },
        { status: 400 }
      );
    }

    // Arşivin var olup olmadığını kontrol et
    const arsiv = await prisma.arsiv.findUnique({
      where: { id }
    });

    if (!arsiv) {
      return NextResponse.json(
        { error: 'Arşiv bulunamadı' },
        { status: 404 }
      );
    }

    const data = await request.json();
    
    // Eğer sempozyumId değiştirilecekse, yeni sempozyumun varlığını kontrol et
    if (data.sempozyumId && data.sempozyumId !== arsiv.sempozyumId) {
      const sempozyum = await prisma.sempozyum.findUnique({
        where: { id: parseInt(data.sempozyumId) }
      });
      
      if (!sempozyum) {
        return NextResponse.json(
          { error: 'Belirtilen sempozyum bulunamadı' },
          { status: 404 }
        );
      }
    }
    
    // Arşivi güncelle
    const updated = await prisma.arsiv.update({
      where: { id },
      data: {
        sempozyumId: data.sempozyumId ? parseInt(data.sempozyumId) : arsiv.sempozyumId,
        ad: data.ad !== undefined ? data.ad : arsiv.ad,
        aciklama: data.aciklama !== undefined ? data.aciklama : arsiv.aciklama,
        kapakGorselUrl: data.kapakGorselUrl !== undefined ? data.kapakGorselUrl : arsiv.kapakGorselUrl,
        pdfDosya: data.pdfDosya !== undefined ? data.pdfDosya : arsiv.pdfDosya
      }
    });

    return NextResponse.json({
      message: 'Arşiv başarıyla güncellendi',
      arsiv: updated
    });
  } catch (error: any) {
    console.error('Arşiv güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Arşiv güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Arşiv kaydını sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçerli bir ID belirtiniz' },
        { status: 400 }
      );
    }

    // Arşivin var olup olmadığını kontrol et
    const arsiv = await prisma.arsiv.findUnique({
      where: { id }
    });

    if (!arsiv) {
      return NextResponse.json(
        { error: 'Arşiv bulunamadı' },
        { status: 404 }
      );
    }

    // Arşivi sil
    await prisma.arsiv.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Arşiv başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Arşiv silme hatası:', error);
    return NextResponse.json(
      { error: 'Arşiv silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 