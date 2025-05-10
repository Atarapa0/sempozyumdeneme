import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Belirli bir bildiriyi getir
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }
    
    console.log(`API: Bildiri ID ${id} sorgulanıyor...`);
    
    // Daha basit bir sorgu yapısı kullanarak önce bildiriyi kontrol edelim
    const bildiriVarMi = await prisma.bildiri.findUnique({
      where: { id },
      select: { id: true }
    });
    
    if (!bildiriVarMi) {
      console.log(`API: Bildiri ID ${id} bulunamadı.`);
      return NextResponse.json(
        { error: 'Bildiri bulunamadı' },
        { status: 404 }
      );
    }
    
    // İlişkiler olmadan temel bildiri bilgilerini getir
    const bildiri = await prisma.bildiri.findUnique({
      where: { id },
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
        bildiriKonusu: {
          select: {
            baslik: true
          }
        },
        kullanici: {
          select: {
            ad: true,
            soyad: true,
            unvan: true,
            eposta: true
          }
        }
      }
    });
    
    // İlişkili revizeleri ayrı sorgula
    const revizeler = await prisma.revize.findMany({
      where: { 
        bildiriId: id 
      },
      select: {
        id: true,
        durum: true,
        gucluYonler: true,
        zayifYonler: true,
        genelYorum: true,
        guvenSeviyesi: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Bildiri ve revize verilerini birleştir
    const birlestirilmisBildiri = {
      ...bildiri,
      revizeler: revizeler
    };
    
    console.log(`API: Bildiri ID ${id} başarıyla getirildi.`);
    return NextResponse.json(birlestirilmisBildiri);
  } catch (error: any) {
    console.error(`API: Bildiri ID ${params.id} görüntüleme hatası:`, error);
    
    // Daha detaylı hata mesajı
    let hataMesaji = 'Bildiri alınırken bir hata oluştu';
    let hataDetay = error.message;
    
    // Prisma hatalarını kontrol et
    if (error.code) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Bildiri bulunamadı', detay: 'Bildiri veritabanında yer almıyor.' },
          { status: 404 }
        );
      } else if (error.code.startsWith('P')) {
        hataMesaji = 'Veritabanı işlemi sırasında bir hata oluştu';
        hataDetay = `Prisma Hata Kodu: ${error.code}, ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: hataMesaji, detay: hataDetay },
      { status: 500 }
    );
  }
}

// Bildiriyi güncelle
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
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
    
    // Bildirinin varlığını kontrol et
    const mevcutBildiri = await prisma.bildiri.findUnique({
      where: { id }
    });
    
    if (!mevcutBildiri) {
      return NextResponse.json(
        { error: 'Bildiri bulunamadı' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Güncellenecek alanları içeren obje
    const updateData: any = {};
    
    // İsteğe bağlı alanları güncelle
    if (data.baslik !== undefined) updateData.baslik = data.baslik;
    if (data.baslikEn !== undefined) updateData.baslikEn = data.baslikEn;
    if (data.ozet !== undefined) updateData.ozet = data.ozet;
    if (data.ozetEn !== undefined) updateData.ozetEn = data.ozetEn;
    if (data.yazarlar !== undefined) updateData.yazarlar = data.yazarlar;
    if (data.anahtarKelimeler !== undefined) updateData.anahtarKelimeler = data.anahtarKelimeler;
    if (data.anahtarKelimelerEn !== undefined) updateData.anahtarKelimelerEn = data.anahtarKelimelerEn;
    if (data.sunumTipi !== undefined) updateData.sunumTipi = data.sunumTipi;
    if (data.sunumYeri !== undefined) updateData.sunumYeri = data.sunumYeri;
    if (data.kongreyeMesaj !== undefined) updateData.kongreyeMesaj = data.kongreyeMesaj;
    if (data.intihalPosterDosya !== undefined) updateData.intihalPosterDosya = data.intihalPosterDosya;
    if (data.dokuman !== undefined) updateData.dokuman = data.dokuman;
    if (data.durum !== undefined) updateData.durum = data.durum;
    
    // Ana konu ID'si güncelleme
    if (data.anaKonuId !== undefined) {
      const anaKonu = await prisma.anaKonu.findUnique({
        where: { id: parseInt(data.anaKonuId) }
      });
      
      if (!anaKonu) {
        return NextResponse.json(
          { error: 'Belirtilen ana konu bulunamadı' },
          { status: 404 }
        );
      }
      
      updateData.anaKonuId = parseInt(data.anaKonuId);
    }
    
    // Bildiri konusu ID'si güncelleme
    if (data.bildiriKonusuId !== undefined) {
      const bildiriKonusu = await prisma.bildiriKonusu.findUnique({
        where: { id: parseInt(data.bildiriKonusuId) }
      });
      
      if (!bildiriKonusu) {
        return NextResponse.json(
          { error: 'Belirtilen bildiri konusu bulunamadı' },
          { status: 404 }
        );
      }
      
      updateData.bildiriKonusuId = parseInt(data.bildiriKonusuId);
    }
    
    // Bildiriyi güncelle
    const guncelBildiri = await prisma.bildiri.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Bildiri başarıyla güncellendi',
      bildiri: guncelBildiri
    });
  } catch (error: any) {
    console.error('Bildiri güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Bildiri güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Bildiriyi sil
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Admin rolünü doğrula
    const roleResult = await roleMiddleware(request, 'admin');
    if (roleResult instanceof NextResponse) {
      return roleResult;
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }
    
    // Bildirinin varlığını kontrol et
    const bildiri = await prisma.bildiri.findUnique({
      where: { id }
    });
    
    if (!bildiri) {
      return NextResponse.json(
        { error: 'Bildiri bulunamadı' },
        { status: 404 }
      );
    }
    
    // İlişkili revizeleri sil
    await prisma.revize.deleteMany({
      where: { bildiriId: id }
    });
    
    // Bildiriyi sil
    await prisma.bildiri.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Bildiri başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Bildiri silme hatası:', error);
    return NextResponse.json(
      { error: 'Bildiri silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 