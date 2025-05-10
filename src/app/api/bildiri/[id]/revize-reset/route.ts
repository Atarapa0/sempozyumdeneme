import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

/**
 * Bildiriye ait revize değerlendirmelerini sıfırlar.
 * Bu endpoint çağrıldığında, bildiriye ait tüm Revize kayıtları silinir,
 * böylece hakemler yeniden değerlendirme yapabilir.
 * Tüm veriler RevizeGecmisi tablosunda saklanır.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    // Kullanıcı doğrulama - en azından giriş yapmış olmalı
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz bildiri ID' },
        { status: 400 }
      );
    }
    
    // Bildirinin varlığını kontrol et
    const bildiri = await prisma.bildiri.findUnique({
      where: { id },
    });
    
    if (!bildiri) {
      return NextResponse.json(
        { error: 'Bildiri bulunamadı' },
        { status: 404 }
      );
    }
    
    // Bildirinin durumunu kontrol et (opsiyonel)
    // İzin verilen durumlar: revizyon_istendi veya revize_yapildi
    const lowerCaseDurum = bildiri.durum.toLowerCase();
    const izinliDurumlar = ['revizyon_istendi', 'revize_yapildi'];
    
    if (!izinliDurumlar.includes(lowerCaseDurum)) {
      return NextResponse.json(
        { error: 'Bu bildiri için revizyon istenmemiş veya revize edilmeye uygun durumda değil.' },
        { status: 400 }
      );
    }

    // Önce bildiriye ait tüm revizeleri arşive kopyala
    const bildiriRevizeler = await prisma.revize.findMany({
      where: { bildiriId: id }
    });

    // Her revizeyi RevizeGecmisi tablosuna kopyala
    for (const revize of bildiriRevizeler) {
      await prisma.revizeGecmisi.create({
        data: {
          sempozyumId: revize.sempozyumId,
          bildiriId: revize.bildiriId,
          hakemId: revize.hakemId,
          durum: revize.durum,
          gucluYonler: revize.gucluYonler,
          zayifYonler: revize.zayifYonler,
          genelYorum: revize.genelYorum,
          guvenSeviyesi: revize.guvenSeviyesi,
          makaleTuru: revize.makaleTuru,
          makaleBasligi: revize.makaleBasligi,
          soyut: revize.soyut, 
          anahtarKelimeler: revize.anahtarKelimeler,
          giris: revize.giris, 
          gerekcelerVeYontemler: revize.gerekcelerVeYontemler,
          sonuclarVeTartismalar: revize.sonuclarVeTartismalar,
          referanslar: revize.referanslar,
          guncellikVeOzgunluk: revize.guncellikVeOzgunluk,
          revizeTarihi: revize.createdAt
        }
      });
    }

    console.log(`Bildiri ID ${id} için ${bildiriRevizeler.length} revize değerlendirmesi arşivlendi.`);

    // Şimdi bildiriye ait tüm revizeleri sil
    const silmeSonucu = await prisma.revize.deleteMany({
      where: { bildiriId: id }
    });

    console.log(`Bildiri ID ${id} için ${silmeSonucu.count} revize değerlendirmesi silindi.`);

    // Bildiri durumunu "revize_yapildi" olarak güncelle
    await prisma.bildiri.update({
      where: { id },
      data: { durum: 'revize_yapildi' }
    });

    return NextResponse.json({
      message: 'Revize değerlendirmeleri başarıyla sıfırlandı',
      arsivedCount: bildiriRevizeler.length,
      deletedCount: silmeSonucu.count
    });
  } catch (error: any) {
    console.error('Revize sıfırlama hatası:', error);
    return NextResponse.json(
      { error: 'Revize değerlendirmeleri sıfırlanırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 