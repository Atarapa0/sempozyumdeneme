import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Belirli bir komite üyesini getir
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }
    
    const komiteUyesi = await prisma.komite.findUnique({
      where: { id },
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      }
    });

    if (!komiteUyesi) {
      return NextResponse.json(
        { error: 'Komite üyesi bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(komiteUyesi);
  } catch (error: any) {
    console.error('Komite üyesi görüntüleme hatası:', error);
    return NextResponse.json(
      { error: 'Komite üyesi alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Komite üyesi güncelle (sadece admin)
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
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }

    // Komite üyesinin varlığını kontrol et
    const mevcutKomiteUyesi = await prisma.komite.findUnique({
      where: { id }
    });

    if (!mevcutKomiteUyesi) {
      return NextResponse.json(
        { error: 'Komite üyesi bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { sempozyumId, unvan, ad, soyad, kurum, komiteTur } = body;

    // Güncellenecek verileri hazırla
    const updateData: any = {};

    if (sempozyumId !== undefined) {
      // Sempozyum ID'si değiştiriliyorsa, sempozyumun varlığını kontrol et
      if (sempozyumId !== mevcutKomiteUyesi.sempozyumId) {
        const sempozyum = await prisma.sempozyum.findUnique({
          where: { id: sempozyumId }
        });

        if (!sempozyum) {
          return NextResponse.json(
            { error: 'Belirtilen sempozyum bulunamadı' },
            { status: 404 }
          );
        }
      }
      updateData.sempozyumId = sempozyumId;
    }

    // Komite türünü kontrol et
    if (komiteTur !== undefined) {
      const gecerliKomiteTurler = ['bilim', 'düzenleme', 'yürütme', 'danışma', 'hakem'];
      if (!gecerliKomiteTurler.includes(komiteTur)) {
        return NextResponse.json(
          { error: 'Geçersiz komite türü', detay: `Komite türü şunlardan biri olmalıdır: ${gecerliKomiteTurler.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.komiteTur = komiteTur;
    }

    // Diğer alanları güncelleme verisine ekle
    if (unvan !== undefined) updateData.unvan = unvan;
    if (ad !== undefined) updateData.ad = ad;
    if (soyad !== undefined) updateData.soyad = soyad;
    if (kurum !== undefined) updateData.kurum = kurum;

    // Komite üyesini güncelle
    const guncelKomiteUyesi = await prisma.komite.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Komite üyesi başarıyla güncellendi',
      komiteUyesi: guncelKomiteUyesi
    });
  } catch (error: any) {
    console.error('Komite üyesi güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Komite üyesi güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Komite üyesi sil (sadece admin)
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
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }

    // Komite üyesinin varlığını kontrol et
    const komiteUyesi = await prisma.komite.findUnique({
      where: { id }
    });

    if (!komiteUyesi) {
      return NextResponse.json(
        { error: 'Komite üyesi bulunamadı' },
        { status: 404 }
      );
    }

    // Komite üyesini sil
    await prisma.komite.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Komite üyesi başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Komite üyesi silme hatası:', error);
    return NextResponse.json(
      { error: 'Komite üyesi silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 