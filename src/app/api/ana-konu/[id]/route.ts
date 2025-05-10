import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Belirli bir ana konuyu getir
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }
    
    const anaKonu = await prisma.anaKonu.findUnique({
      where: { id },
      include: {
        sempozyum: {
          select: {
            title: true
          }
        },
        bildiriKonulari: true,
        _count: {
          select: {
            bildiriKonulari: true,
            bildiriler: true
          }
        }
      }
    });

    if (!anaKonu) {
      return NextResponse.json(
        { error: 'Ana konu bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(anaKonu);
  } catch (error: any) {
    console.error('Ana konu görüntüleme hatası:', error);
    return NextResponse.json(
      { error: 'Ana konu alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Ana konu güncelle (sadece admin)
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

    // Ana konunun varlığını kontrol et
    const mevcutAnaKonu = await prisma.anaKonu.findUnique({
      where: { id }
    });

    if (!mevcutAnaKonu) {
      return NextResponse.json(
        { error: 'Ana konu bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { sempozyumId, baslik, aciklama } = body;

    // Güncellenecek verileri hazırla
    const updateData: any = {};

    if (sempozyumId !== undefined) {
      // Sempozyum ID'si değiştiriliyorsa, sempozyumun varlığını kontrol et
      if (sempozyumId !== mevcutAnaKonu.sempozyumId) {
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
    if (baslik !== undefined) updateData.baslik = baslik;
    if (aciklama !== undefined) updateData.aciklama = aciklama;

    // Ana konuyu güncelle
    const guncelAnaKonu = await prisma.anaKonu.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Ana konu başarıyla güncellendi',
      anaKonu: guncelAnaKonu
    });
  } catch (error: any) {
    console.error('Ana konu güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Ana konu güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Ana konu sil (sadece admin)
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

    // Ana konunun varlığını kontrol et
    const anaKonu = await prisma.anaKonu.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bildiriKonulari: true,
            bildiriler: true
          }
        }
      }
    });

    if (!anaKonu) {
      return NextResponse.json(
        { error: 'Ana konu bulunamadı' },
        { status: 404 }
      );
    }

    // İlişkili bildiri konuları veya bildirileri varsa, silme işlemini reddet
    if (anaKonu._count.bildiriKonulari > 0 || anaKonu._count.bildiriler > 0) {
      return NextResponse.json(
        { 
          error: 'İlişkili kayıtlar var', 
          detay: 'Bu ana konuya bağlı bildiri konuları veya bildiriler bulunduğundan silinemez. Önce ilişkili kayıtları silmelisiniz.' 
        },
        { status: 400 }
      );
    }

    // Ana konuyu sil
    await prisma.anaKonu.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Ana konu başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Ana konu silme hatası:', error);
    return NextResponse.json(
      { error: 'Ana konu silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 