import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Belirli bir sponsoru getir
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz sponsor ID' },
        { status: 400 }
      );
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      }
    });

    if (!sponsor) {
      return NextResponse.json(
        { error: 'Sponsor bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(sponsor);
  } catch (error: any) {
    console.error('Sponsor detayı hatası:', error);
    return NextResponse.json(
      { error: 'Sponsor bilgileri alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Sponsor bilgilerini güncelle (sadece admin)
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
        { error: 'Geçersiz sponsor ID' },
        { status: 400 }
      );
    }

    // Sponsor varlığını kontrol et
    const mevcutSponsor = await prisma.sponsor.findUnique({
      where: { id }
    });

    if (!mevcutSponsor) {
      return NextResponse.json(
        { error: 'Sponsor bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { ad, logoUrl, link, sempozyumId } = body;
    
    // Güncellenecek alanları hazırla
    const updateData: any = {};
    if (ad !== undefined) updateData.ad = ad;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (link !== undefined) updateData.link = link;
    if (sempozyumId !== undefined) {
      // Yeni sempozyum ID verilmişse, sempozyumun varlığını kontrol et
      const sempozyum = await prisma.sempozyum.findUnique({
        where: { id: sempozyumId }
      });

      if (!sempozyum) {
        return NextResponse.json(
          { error: 'Belirtilen sempozyum bulunamadı' },
          { status: 404 }
        );
      }
      
      updateData.sempozyumId = sempozyumId;
    }

    // Sponsoru güncelle
    const guncellenenSponsor = await prisma.sponsor.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Sponsor başarıyla güncellendi',
      sponsor: guncellenenSponsor
    });
  } catch (error: any) {
    console.error('Sponsor güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Sponsor güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Sponsor sil (sadece admin)
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
        { error: 'Geçersiz sponsor ID' },
        { status: 400 }
      );
    }

    // Sponsor varlığını kontrol et
    const sponsor = await prisma.sponsor.findUnique({
      where: { id }
    });

    if (!sponsor) {
      return NextResponse.json(
        { error: 'Sponsor bulunamadı' },
        { status: 404 }
      );
    }

    // Sponsoru sil
    await prisma.sponsor.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Sponsor başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Sponsor silme hatası:', error);
    return NextResponse.json(
      { error: 'Sponsor silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 