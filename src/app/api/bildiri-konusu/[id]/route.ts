import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Belirli bir bildiri konusunu getir
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }
    
    const bildiriKonusu = await prisma.bildiriKonusu.findUnique({
      where: { id },
      include: {
        sempozyum: {
          select: {
            title: true
          }
        },
        anaKonu: {
          select: {
            baslik: true,
            aciklama: true
          }
        },
        bildiriler: {
          select: {
            id: true,
            baslik: true,
            durum: true
          }
        }
      }
    });

    if (!bildiriKonusu) {
      return NextResponse.json(
        { error: 'Bildiri konusu bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(bildiriKonusu);
  } catch (error: any) {
    console.error('Bildiri konusu görüntüleme hatası:', error);
    return NextResponse.json(
      { error: 'Bildiri konusu alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Bildiri konusu güncelle (sadece admin)
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

    // Bildiri konusunun varlığını kontrol et
    const mevcutBildiriKonusu = await prisma.bildiriKonusu.findUnique({
      where: { id }
    });

    if (!mevcutBildiriKonusu) {
      return NextResponse.json(
        { error: 'Bildiri konusu bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { sempozyumId, anaKonuId, baslik, aciklama } = body;

    // Güncellenecek verileri hazırla
    const updateData: any = {};

    if (sempozyumId !== undefined && anaKonuId !== undefined) {
      // Sempozyum ve ana konu değiştiriliyorsa ilişkilerin tutarlılığını kontrol et
      const anaKonu = await prisma.anaKonu.findUnique({
        where: { id: anaKonuId }
      });

      if (!anaKonu) {
        return NextResponse.json(
          { error: 'Belirtilen ana konu bulunamadı' },
          { status: 404 }
        );
      }

      if (anaKonu.sempozyumId !== sempozyumId) {
        return NextResponse.json(
          { error: 'Ana konu belirtilen sempozyuma ait değil' },
          { status: 400 }
        );
      }

      updateData.sempozyumId = sempozyumId;
      updateData.anaKonuId = anaKonuId;
    } else if (sempozyumId !== undefined) {
      // Sadece sempozyum değiştiriliyorsa
      const anaKonu = await prisma.anaKonu.findUnique({
        where: { id: mevcutBildiriKonusu.anaKonuId }
      });

      if (anaKonu && anaKonu.sempozyumId !== sempozyumId) {
        return NextResponse.json(
          { error: 'Mevcut ana konu yeni sempozyuma ait değil' },
          { status: 400 }
        );
      }

      updateData.sempozyumId = sempozyumId;
    } else if (anaKonuId !== undefined) {
      // Sadece ana konu değiştiriliyorsa
      const anaKonu = await prisma.anaKonu.findUnique({
        where: { id: anaKonuId }
      });

      if (!anaKonu) {
        return NextResponse.json(
          { error: 'Belirtilen ana konu bulunamadı' },
          { status: 404 }
        );
      }

      if (anaKonu.sempozyumId !== mevcutBildiriKonusu.sempozyumId) {
        return NextResponse.json(
          { error: 'Yeni ana konu mevcut sempozyuma ait değil' },
          { status: 400 }
        );
      }

      updateData.anaKonuId = anaKonuId;
    }

    // Diğer alanları güncelleme verisine ekle
    if (baslik !== undefined) updateData.baslik = baslik;
    if (aciklama !== undefined) updateData.aciklama = aciklama;

    // Bildiri konusunu güncelle
    const guncelBildiriKonusu = await prisma.bildiriKonusu.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Bildiri konusu başarıyla güncellendi',
      bildiriKonusu: guncelBildiriKonusu
    });
  } catch (error: any) {
    console.error('Bildiri konusu güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Bildiri konusu güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Bildiri konusu sil (sadece admin)
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

    // Bildiri konusunun varlığını kontrol et
    const bildiriKonusu = await prisma.bildiriKonusu.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bildiriler: true
          }
        }
      }
    });

    if (!bildiriKonusu) {
      return NextResponse.json(
        { error: 'Bildiri konusu bulunamadı' },
        { status: 404 }
      );
    }

    // İlişkili bildiriler varsa, silme işlemini reddet
    if (bildiriKonusu._count.bildiriler > 0) {
      return NextResponse.json(
        { 
          error: 'İlişkili kayıtlar var', 
          detay: 'Bu bildiri konusuna bağlı bildiriler bulunduğundan silinemez. Önce ilişkili bildirileri silmelisiniz veya başka bir konuya taşımalısınız.' 
        },
        { status: 400 }
      );
    }

    // Bildiri konusunu sil
    await prisma.bildiriKonusu.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Bildiri konusu başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Bildiri konusu silme hatası:', error);
    return NextResponse.json(
      { error: 'Bildiri konusu silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 