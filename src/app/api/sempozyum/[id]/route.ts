import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Belirli bir sempozyumu getir
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz sempozyum ID' },
        { status: 400 }
      );
    }

    const sempozyum = await prisma.sempozyum.findUnique({
      where: { id },
      include: {
        genelBilgiler: true,
        onemliTarihler: true,
        anaKonular: true,
        sponsorlar: true
      }
    });

    if (!sempozyum) {
      return NextResponse.json(
        { error: 'Sempozyum bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(sempozyum);
  } catch (error: any) {
    console.error('Sempozyum detayı hatası:', error);
    return NextResponse.json(
      { error: 'Sempozyum bilgileri alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Sempozyum bilgilerini güncelle (sadece admin)
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
        { error: 'Geçersiz sempozyum ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, tarih, aktiflik } = body;
    
    // Güncellenecek alanları hazırla
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (tarih !== undefined) updateData.tarih = new Date(tarih);
    if (aktiflik !== undefined) updateData.aktiflik = aktiflik;

    // Sempozyum varlığını kontrol et
    const mevcut = await prisma.sempozyum.findUnique({
      where: { id }
    });

    if (!mevcut) {
      return NextResponse.json(
        { error: 'Sempozyum bulunamadı' },
        { status: 404 }
      );
    }

    // Sempozyumu güncelle
    const guncellenenSempozyum = await prisma.sempozyum.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Sempozyum başarıyla güncellendi',
      sempozyum: guncellenenSempozyum
    });
  } catch (error: any) {
    console.error('Sempozyum güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Sempozyum güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Sempozyum sil (sadece admin)
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
        { error: 'Geçersiz sempozyum ID' },
        { status: 400 }
      );
    }

    // Sempozyum varlığını kontrol et
    const sempozyum = await prisma.sempozyum.findUnique({
      where: { id }
    });

    if (!sempozyum) {
      return NextResponse.json(
        { error: 'Sempozyum bulunamadı' },
        { status: 404 }
      );
    }

    // Sempozyumu sil
    await prisma.sempozyum.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Sempozyum başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Sempozyum silme hatası:', error);
    return NextResponse.json(
      { error: 'Sempozyum silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 