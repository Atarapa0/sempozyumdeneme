import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Belirli bir revizeyi getir
export async function GET(request: NextRequest, { params }: Params) {
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
    
    const revize = await prisma.revize.findUnique({
      where: { id },
      include: {
        sempozyum: {
          select: {
            title: true
          }
        },
        bildiri: {
          select: {
            baslik: true,
            dokuman: true,
            ozet: true,
            anahtarKelimeler: true,
            sunumTipi: true,
            durum: true,
            hakemler: true,
            kullanici: {
              select: {
                ad: true,
                soyad: true,
                unvan: true,
                eposta: true
              }
            }
          }
        }
      }
    });

    if (!revize) {
      return NextResponse.json(
        { error: 'Revize bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(revize);
  } catch (error: any) {
    console.error('Revize görüntüleme hatası:', error);
    return NextResponse.json(
      { error: 'Revize alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Revizeyi güncelle
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
    
    // Revizenin varlığını kontrol et
    const mevcutRevize = await prisma.revize.findUnique({
      where: { id },
      include: {
        bildiri: true
      }
    });
    
    if (!mevcutRevize) {
      return NextResponse.json(
        { error: 'Revize bulunamadı' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Güncellenecek alanları içeren obje
    const updateData: any = {};
    
    // İsteğe bağlı alanları güncelle
    if (data.durum !== undefined) updateData.durum = data.durum;
    if (data.gucluYonler !== undefined) updateData.gucluYonler = data.gucluYonler;
    if (data.zayifYonler !== undefined) updateData.zayifYonler = data.zayifYonler;
    if (data.genelYorum !== undefined) updateData.genelYorum = data.genelYorum;
    if (data.guvenSeviyesi !== undefined) updateData.guvenSeviyesi = parseInt(data.guvenSeviyesi);
    
    // Yeni eklenen makale değerlendirme alanlarını güncelle
    if (data.makaleTuru !== undefined) updateData.makaleTuru = data.makaleTuru;
    if (data.makaleBasligi !== undefined) updateData.makaleBasligi = data.makaleBasligi;
    if (data.soyut !== undefined) updateData.soyut = data.soyut;
    if (data.anahtarKelimeler !== undefined) updateData.anahtarKelimeler = data.anahtarKelimeler;
    if (data.giris !== undefined) updateData.giris = data.giris;
    if (data.gerekcelerVeYontemler !== undefined) updateData.gerekcelerVeYontemler = data.gerekcelerVeYontemler;
    if (data.sonuclarVeTartismalar !== undefined) updateData.sonuclarVeTartismalar = data.sonuclarVeTartismalar;
    if (data.referanslar !== undefined) updateData.referanslar = data.referanslar;
    if (data.guncellikVeOzgunluk !== undefined) updateData.guncellikVeOzgunluk = data.guncellikVeOzgunluk;
    
    // Hakem güncelleme
    if (data.hakemIds !== undefined && Array.isArray(data.hakemIds)) {
      const hakemIds = data.hakemIds.map((id: string | number) => parseInt(id.toString()));
      
      // Kullanıcıların varlığını kontrol et
      const kullanicilar = await prisma.kullanici.findMany({
        where: {
          id: {
            in: hakemIds
          }
        }
      });
      
      if (kullanicilar.length !== hakemIds.length) {
        return NextResponse.json(
          { error: 'Bir veya daha fazla kullanıcı bulunamadı' },
          { status: 404 }
        );
      }
      
      // Bildirinin hakemlerini güncelle
      await prisma.bildiri.update({
        where: { id: mevcutRevize.bildiriId },
        data: {
          hakemler: hakemIds
        }
      });
    }
    
    // Revizeyi güncelle
    const guncelRevize = await prisma.revize.update({
      where: { id },
      data: updateData
    });
    
    // Revizyonun değerlendirilmesi durumunda bildiri durumu kontrolü
    if (data.durum) {
      // Bildiriyi ve atanan hakemleri al
      const bildiri = await prisma.bildiri.findUnique({
        where: { id: mevcutRevize.bildiriId },
        select: { hakemler: true, durum: true }
      });

      if (bildiri && bildiri.hakemler) {
        let hakemIds: number[] = [];
        
        // Hakemler dizisinin tipini kontrol et
        if (Array.isArray(bildiri.hakemler)) {
          hakemIds = bildiri.hakemler as number[];
        } 
        else if (typeof bildiri.hakemler === 'string') {
          try {
            const parsed = JSON.parse(bildiri.hakemler);
            if (Array.isArray(parsed)) {
              hakemIds = parsed;
            }
          } catch (parseError) {
            console.error('Hakemler string parse hatası:', parseError);
          }
        }
        else {
          try {
            const stringified = JSON.stringify(bildiri.hakemler);
            const parsed = JSON.parse(stringified);
            if (Array.isArray(parsed)) {
              hakemIds = parsed;
            }
          } catch (objError) {
            console.error('Hakemler obje dönüşüm hatası:', objError);
          }
        }

        // Bildiriye ait tüm değerlendirmeleri al
        const revizeler = await prisma.revize.findMany({
          where: { bildiriId: mevcutRevize.bildiriId },
          select: { hakemId: true, durum: true, createdAt: true }
        });

        // Değerlendirme yapan hakem ID'lerini al
        const degerlendirenHakemIds = revizeler.map(r => r.hakemId).filter(Boolean) as number[];
        
        // Her hakem için benzersiz değerlendirmeleri kontrol et
        const benzersizDegerlendirenIds = Array.from(new Set(degerlendirenHakemIds));
        
        // Tüm hakemler değerlendirme yapmış mı?
        const tumHakemlerDegerlendirdi = hakemIds.every(hakemId => 
          benzersizDegerlendirenIds.includes(hakemId)
        );
        
        console.log(`Hakem kontrolü: ${benzersizDegerlendirenIds.length}/${hakemIds.length} hakem değerlendirme yapmış`);

        // Revizyondan sonraki durum kontrolü
        if (bildiri.durum === 'revize_yapildi' || 
            bildiri.durum.toLowerCase() === 'revize_yapildi' || 
            bildiri.durum === 'REVIZE_YAPILDI') {
          
          if (tumHakemlerDegerlendirdi) {
            // Tüm hakemler değerlendirdi - şimdi kararları analiz et
            
            // Her hakem için en son değerlendirme kararını bul
            const sonKararlar = new Map<number, string>();
            
            // Revizeleri tarih sırasına göre sırala (en yeni en önde)
            const siraliRevizeler = [...revizeler].sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA; // Azalan sıra (yeniden eskiye)
            });
            
            // Her hakem için en son değerlendirmeyi al
            for (const revize of siraliRevizeler) {
              if (revize.hakemId && !sonKararlar.has(revize.hakemId)) {
                sonKararlar.set(revize.hakemId, revize.durum);
              }
            }
            
            // En yüksek öncelik: RED (herhangi bir hakem RED dediyse bildiri reddedilir)
            const herhangiRedVarMi = Array.from(sonKararlar.values()).some(karar => 
              karar === 'RED' || karar === 'red' || karar === 'Red'
            );
            
            // İkinci öncelik: REVIZE (herhangi bir hakem REVIZE dediyse ve RED yoksa revizyon istenir)
            const herhangiRevizeVarMi = Array.from(sonKararlar.values()).some(karar => 
              karar === 'REVIZE' || karar === 'revize' || karar === 'Revize'
            );
            
            // En düşük öncelik: KABUL (tüm hakemler KABUL dediyse bildiri kabul edilir)
            const tumKararlarKabulMu = Array.from(sonKararlar.values()).every(karar => 
              karar === 'KABUL' || karar === 'kabul' || karar === 'Kabul'
            );
            
            // Kararların öncelik sıralaması: RED > REVIZE > KABUL
            let hedefDurum = '';
            
            if (herhangiRedVarMi) {
              hedefDurum = 'reddedildi';
              console.log('En az bir hakem RED kararı verdiği için bildiri reddediliyor.');
            } else if (herhangiRevizeVarMi) {
              hedefDurum = 'revizyon_istendi';
              console.log('En az bir hakem REVIZE kararı verdiği için revizyon isteniyor.');
            } else if (tumKararlarKabulMu) {
              hedefDurum = 'kabul_edildi';
              console.log('Tüm hakemler KABUL kararı verdiği için bildiri kabul ediliyor.');
            } else {
              console.log('Beklenmedik durum: Hakemler RED, REVIZE veya KABUL dışında kararlar vermiş.');
              hedefDurum = 'incelemede'; // Varsayılan olarak incelemede bırak
            }
            
            // Bildiri durumunu güncelle
            if (hedefDurum) {
              try {
                await prisma.bildiri.update({
                  where: { id: mevcutRevize.bildiriId },
                  data: { durum: hedefDurum }
                });
                console.log(`Bildiri durumu güncellendi: ${hedefDurum} (tüm hakemler değerlendirdi)`);
              } catch (updateError) {
                console.error("Bildiri durumu güncellenirken hata:", updateError);
              }
            }
          } else {
            // Tüm hakemler değerlendirmedi, durum "revize_yapildi" olarak kalmalı
            console.log(`Revizyonu sadece ${benzersizDegerlendirenIds.length}/${hakemIds.length} hakem değerlendirdi. Bildiri durumu "revize_yapildi" olarak korunuyor.`);
            
            try {
              await prisma.bildiri.update({
                where: { id: mevcutRevize.bildiriId },
                data: { durum: 'revize_yapildi' }
              });
              console.log(`Bildiri durumu açıkça "revize_yapildi" olarak güncellendi. Diğer hakemlerin değerlendirmesi bekleniyor.`);
            } catch (updateError) {
              console.error("Bildiri durumu güncellenirken hata:", updateError);
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Revize başarıyla güncellendi',
      revize: guncelRevize
    });
  } catch (error: any) {
    console.error('Revize güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Revize güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Revizeyi sil
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
    
    // Revizenin varlığını kontrol et
    const revize = await prisma.revize.findUnique({
      where: { id }
    });
    
    if (!revize) {
      return NextResponse.json(
        { error: 'Revize bulunamadı' },
        { status: 404 }
      );
    }
    
    // Revizeyi sil
    await prisma.revize.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Revize başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Revize silme hatası:', error);
    return NextResponse.json(
      { error: 'Revize silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 