import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Modern App Router yapılandırması
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Belirli bir genel bilgi kaydını getir
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }
    
    const genelBilgi = await prisma.genelBilgiler.findUnique({
      where: { id },
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      }
    });

    if (!genelBilgi) {
      return NextResponse.json(
        { error: 'Genel bilgi kaydı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(genelBilgi);
  } catch (error: any) {
    console.error('Genel bilgi görüntüleme hatası:', error);
    return NextResponse.json(
      { error: 'Genel bilgi alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Genel bilgi güncelle (sadece admin)
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

    // Genel bilginin varlığını kontrol et
    const mevcutGenelBilgi = await prisma.genelBilgiler.findUnique({
      where: { id }
    });

    if (!mevcutGenelBilgi) {
      return NextResponse.json(
        { error: 'Genel bilgi kaydı bulunamadı' },
        { status: 404 }
      );
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

    // Güncellenecek verileri hazırla
    const updateData: any = {};

    if (sempozyumId !== undefined) {
      // Sempozyum ID'si değiştiriliyorsa, sempozyumun varlığını kontrol et
      if (sempozyumId !== mevcutGenelBilgi.sempozyumId) {
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

    // Diğer alanları güncelleme verisine ekle
    if (title !== undefined) updateData.title = title;
    if (altbaslik !== undefined) updateData.altbaslik = altbaslik;
    if (tariharaligi !== undefined) updateData.tariharaligi = tariharaligi;
    if (geriSayimBitimTarihi !== undefined) {
      try {
        const parsedGeriSayimTarihi = new Date(geriSayimBitimTarihi);
        if (isNaN(parsedGeriSayimTarihi.getTime())) {
          throw new Error('Geçersiz tarih formatı');
        }
        updateData.geriSayimBitimTarihi = parsedGeriSayimTarihi;
      } catch (e) {
        return NextResponse.json(
          { error: 'Geçersiz tarih formatı', detay: 'geriSayimBitimTarihi geçerli bir tarih olmalıdır' },
          { status: 400 }
        );
      }
    }
    if (yer !== undefined) updateData.yer = yer;
    if (organizator !== undefined) updateData.organizator = organizator;
    if (kisaaciklama !== undefined) updateData.kisaaciklama = kisaaciklama;
    if (uzunaciklama !== undefined) updateData.uzunaciklama = uzunaciklama;
    if (docentlikbilgisi !== undefined) updateData.docentlikbilgisi = docentlikbilgisi;
    if (yil !== undefined) updateData.yil = parseInt(yil.toString());

    // Genel bilgiyi güncelle
    const guncelGenelBilgi = await prisma.genelBilgiler.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Genel bilgi başarıyla güncellendi',
      genelBilgi: guncelGenelBilgi
    });
  } catch (error: any) {
    console.error('Genel bilgi güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Genel bilgi güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Genel bilgi sil (sadece admin)
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

    // Genel bilginin varlığını kontrol et
    const genelBilgi = await prisma.genelBilgiler.findUnique({
      where: { id }
    });

    if (!genelBilgi) {
      return NextResponse.json(
        { error: 'Genel bilgi kaydı bulunamadı' },
        { status: 404 }
      );
    }

    // Genel bilgiyi sil
    await prisma.genelBilgiler.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Genel bilgi başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Genel bilgi silme hatası:', error);
    return NextResponse.json(
      { error: 'Genel bilgi silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 