import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Revize modeli için interface
interface Revize {
  id: number;
  sempozyumId: number;
  bildiriId: number;
  hakemId?: number;
  durum: string;
  gucluYonler: string | null;
  zayifYonler: string | null;
  genelYorum: string | null;
  guvenSeviyesi: number | null;
  // Yeni eklenen makale değerlendirme alanları
  makaleTuru: string | null;
  makaleBasligi: string | null;
  soyut: string | null;
  anahtarKelimeler: string | null;
  giris: string | null;
  gerekcelerVeYontemler: string | null;
  sonuclarVeTartismalar: string | null;
  referanslar: string | null;
  guncellikVeOzgunluk: string | null;
  createdAt: Date;
  updatedAt: Date;
  sempozyum?: {
    title: string;
  };
  bildiri?: {
    baslik: string;
    durum: string;
    kullanici: {
      ad: string;
      soyad: string;
      unvan: string;
    };
  };
}

// Revizeleri listele
export async function GET(request: NextRequest) {
  try {
    const bildiriId = request.nextUrl.searchParams.get('bildiriId');
    const hakemId = request.nextUrl.searchParams.get('hakemId');
    const sempozyumId = request.nextUrl.searchParams.get('sempozyumId');
    
    console.log(`[Debug] GET /api/revize - Parametreler: bildiriId=${bildiriId}, hakemId=${hakemId}, sempozyumId=${sempozyumId}`);
    
    let where: any = {};
    
    if (bildiriId) {
      where.bildiriId = parseInt(bildiriId);
    }
    
    if (hakemId) {
      where.hakemId = parseInt(hakemId);
      console.log(`[Debug] Hakem ID (${hakemId}) filtresi ekleniyor`);
    }
    
    if (sempozyumId) {
      where.sempozyumId = parseInt(sempozyumId);
    }
    
    console.log(`[Debug] Revize sorgu kriterleri:`, where);
    
    const revizeler = await prisma.revize.findMany({
      where,
      include: {
        sempozyum: {
          select: {
            title: true
          }
        },
        bildiri: {
          select: {
            baslik: true,
            durum: true,
            kullanici: {
              select: {
                ad: true,
                soyad: true,
                unvan: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`[Debug] Bulunan revize sayısı: ${revizeler.length}`);

    // Hakem ID'lerini topla
    const hakemIds: number[] = [];
    revizeler.forEach(revize => {
      if (revize.hakemId) {
        hakemIds.push(revize.hakemId);
      }
    });
    
    // Hakem bilgilerini getir
    let hakemler: { id: number; ad: string; soyad: string; unvan: string | null }[] = [];
    if (hakemIds.length > 0) {
      hakemler = await prisma.kullanici.findMany({
        where: {
          id: {
            in: hakemIds
          }
        },
        select: {
          id: true,
          ad: true,
          soyad: true,
          unvan: true
        }
      });
    }
    
    // Revizelere hakem adı ekle
    const revizeleriDonustur = revizeler.map(revize => {
      let hakemAdi: string | undefined = undefined;
      
      if (revize.hakemId) {
        const hakem = hakemler.find(h => h.id === revize.hakemId);
        if (hakem) {
          hakemAdi = `${hakem.unvan || ''} ${hakem.ad} ${hakem.soyad}`.trim();
        } else {
          hakemAdi = `Hakem #${revize.hakemId}`;
        }
      }
      
      return {
        ...revize,
        hakemAdi
      };
    });

    return NextResponse.json(revizeleriDonustur);
  } catch (error: any) {
    console.error('Revize listesi hatası:', error);
    return NextResponse.json(
      { error: 'Revizeler alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni revize ekle
export async function POST(request: NextRequest) {
  try {
    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const data = await request.json();
    
    // Zorunlu alanları kontrol et
    const requiredFields = ['sempozyumId', 'bildiriId', 'durum'];
    
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        return NextResponse.json(
          { error: `${field} alanı zorunludur` },
          { status: 400 }
        );
      }
    }
    
    // Sempozyumun varlığını kontrol et
    const sempozyum = await prisma.sempozyum.findUnique({
      where: { id: parseInt(data.sempozyumId) }
    });
    
    if (!sempozyum) {
      return NextResponse.json(
        { error: 'Belirtilen sempozyum bulunamadı' },
        { status: 404 }
      );
    }
    
    // Bildirinin varlığını kontrol et
    const bildiriDurumKontrolu = await prisma.bildiri.findUnique({
      where: { id: parseInt(data.bildiriId) }
    });
    
    if (!bildiriDurumKontrolu) {
      return NextResponse.json(
        { error: 'Belirtilen bildiri bulunamadı' },
        { status: 404 }
      );
    }
    
    // Kullanıcı hakem ise (rolId = 3), hakem ID'sini bildiri hakemler listesine ekle
    const user = (authResult as any).user;
    
    // Kullanıcı denetimi - user nesnesi veya user.id yoksa hata döndür
    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bilgisi bulunamadı' },
        { status: 401 }
      );
    }
    
    if (!user.id) {
      return NextResponse.json(
        { error: 'Kullanıcı ID bilgisi bulunamadı' },
        { status: 401 }
      );
    }
    
    // Kullanıcı ve rolId varlık kontrolü
    if (user && (user.rolId === 3 || user.rol?.id === 3 || user.role === 'reviewer')) {
      // Bildirinin mevcut hakemlerini al
      let hakemlerArray: number[] = [];
      
      if (bildiriDurumKontrolu.hakemler) {
        try {
          // Hakemler dizisinin tipini kontrol et ve log'a yazdır
          console.log('Bildiri hakemler değeri tipi:', typeof bildiriDurumKontrolu.hakemler);
          console.log('Hakemler içeriği:', bildiriDurumKontrolu.hakemler);
          
          // Hakemler zaten bir dizi ise doğrudan kullan
          if (Array.isArray(bildiriDurumKontrolu.hakemler)) {
            hakemlerArray = bildiriDurumKontrolu.hakemler as number[];
            console.log('Hakemler zaten bir dizi:', hakemlerArray);
          } 
          // JSON string ise parse et
          else if (typeof bildiriDurumKontrolu.hakemler === 'string') {
            try {
              const parsed = JSON.parse(bildiriDurumKontrolu.hakemler);
              if (Array.isArray(parsed)) {
                hakemlerArray = parsed;
                console.log('String\'den parse edilen hakemler:', hakemlerArray);
              } else {
                console.error('Parse edilen hakemler bir dizi değil:', parsed);
              }
            } catch (parseError) {
              console.error('Hakemler string parse hatası:', parseError);
            }
          }
          // Diğer türden objeler için JSON.stringify ve sonra parse işlemi dene
          else {
            try {
              const stringified = JSON.stringify(bildiriDurumKontrolu.hakemler);
              const parsed = JSON.parse(stringified);
              if (Array.isArray(parsed)) {
                hakemlerArray = parsed;
                console.log('Stringify ve parse sonrası hakemler:', hakemlerArray);
              } else {
                console.error('Stringify ve parse sonrası hakemler bir dizi değil:', parsed);
              }
            } catch (objError) {
              console.error('Hakemler obje dönüşüm hatası:', objError);
            }
          }
        } catch (e) {
          console.error("Hakem dizisi işlenirken hata:", e);
          hakemlerArray = [];
        }
        
        // Hakemler dizisinin son durumunu log'a yaz
        console.log('Hakemler dizisi son durum:', {
          hakemlerArray, 
          isArray: Array.isArray(hakemlerArray),
          length: hakemlerArray.length
        });
      }
      
      // Bu hakem zaten bu bildiriye atanmış mı?
      if (!hakemlerArray.includes(user.id)) {
        // Hakemi bildiriye ekle
        const yeniHakemler = [...hakemlerArray, user.id];
        
        await prisma.bildiri.update({
          where: { id: parseInt(data.bildiriId) },
          data: {
            hakemler: yeniHakemler,
            durum: 'incelemede'
          }
        });
      }
    }
    
    // Yeni revize oluştur
    const yeniRevize = await prisma.revize.create({
      data: {
        sempozyumId: parseInt(data.sempozyumId),
        bildiriId: parseInt(data.bildiriId),
        hakemId: user.id, // Hakem ID'sini açıkça kullan
        durum: data.durum,
        gucluYonler: data.gucluYonler || null,
        zayifYonler: data.zayifYonler || null,
        genelYorum: data.genelYorum || null,
        guvenSeviyesi: data.guvenSeviyesi ? parseInt(data.guvenSeviyesi) : null,
        // Yeni makale değerlendirme alanları
        makaleTuru: data.makaleTuru || null,
        makaleBasligi: data.makaleBasligi || null,
        soyut: data.soyut || null,
        anahtarKelimeler: data.anahtarKelimeler || null, 
        giris: data.giris || null,
        gerekcelerVeYontemler: data.gerekcelerVeYontemler || null,
        sonuclarVeTartismalar: data.sonuclarVeTartismalar || null,
        referanslar: data.referanslar || null,
        guncellikVeOzgunluk: data.guncellikVeOzgunluk || null
      },
      include: {
        sempozyum: true,
        bildiri: true
      }
    });

    // Aynı değerlendirmeyi RevizeGecmisi tablosuna da ekleyelim
    await prisma.revizeGecmisi.create({
      data: {
        sempozyumId: parseInt(data.sempozyumId),
        bildiriId: parseInt(data.bildiriId),
        hakemId: user.id,
        durum: data.durum,
        gucluYonler: data.gucluYonler || null,
        zayifYonler: data.zayifYonler || null,
        genelYorum: data.genelYorum || null,
        guvenSeviyesi: data.guvenSeviyesi ? parseInt(data.guvenSeviyesi) : null,
        // Yeni makale değerlendirme alanları
        makaleTuru: data.makaleTuru || null,
        makaleBasligi: data.makaleBasligi || null,
        soyut: data.soyut || null,
        anahtarKelimeler: data.anahtarKelimeler || null, 
        giris: data.giris || null,
        gerekcelerVeYontemler: data.gerekcelerVeYontemler || null,
        sonuclarVeTartismalar: data.sonuclarVeTartismalar || null,
        referanslar: data.referanslar || null,
        guncellikVeOzgunluk: data.guncellikVeOzgunluk || null,
        revizeTarihi: new Date()
      }
    });

    // Bildiriye ait tüm revizeleri kontrol et
    // Bildiriye atanan tüm hakemler değerlendirme yapmış mı?
    // Her durumda bildiri durumunu kontrol edelim
    if (true) {
      // Bildirinin hakemlerini al
      const bildiri = await prisma.bildiri.findUnique({
        where: { id: parseInt(data.bildiriId) },
        select: { hakemler: true, durum: true }
      });

      if (bildiri && bildiri.hakemler) {
        let hakemIds: number[] = [];
        try {
          // Hakemler dizisinin tipini kontrol et ve log'a yazdır
          console.log('Bildiri hakemler değeri tipi:', typeof bildiri.hakemler);
          console.log('Hakemler içeriği:', bildiri.hakemler);
          
          // Hakemler zaten bir dizi ise doğrudan kullan
          if (Array.isArray(bildiri.hakemler)) {
            hakemIds = bildiri.hakemler as number[];
            console.log('Hakemler zaten bir dizi:', hakemIds);
          } 
          // JSON string ise parse et
          else if (typeof bildiri.hakemler === 'string') {
            try {
              const parsed = JSON.parse(bildiri.hakemler);
              if (Array.isArray(parsed)) {
                hakemIds = parsed;
                console.log('String\'den parse edilen hakemler:', hakemIds);
              } else {
                console.error('Parse edilen hakemler bir dizi değil:', parsed);
              }
            } catch (parseError) {
              console.error('Hakemler string parse hatası:', parseError);
            }
          }
          // Diğer türden objeler için JSON.stringify ve sonra parse işlemi dene
          else {
            try {
              const stringified = JSON.stringify(bildiri.hakemler);
              const parsed = JSON.parse(stringified);
              if (Array.isArray(parsed)) {
                hakemIds = parsed;
                console.log('Stringify ve parse sonrası hakemler:', hakemIds);
              } else {
                console.error('Stringify ve parse sonrası hakemler bir dizi değil:', parsed);
              }
            } catch (objError) {
              console.error('Hakemler obje dönüşüm hatası:', objError);
            }
          }
        } catch (e) {
          console.error("Hakem dizisi işlenirken hata:", e);
          hakemIds = [];
        }
        
        // Hakemler dizisinin son durumunu log'a yaz
        console.log('Hakemler dizisi son durum:', {
          hakemIds, 
          isArray: Array.isArray(hakemIds),
          length: hakemIds.length
        });

        // Bildiriye ait tüm değerlendirmeleri al
        const revizeler = await prisma.revize.findMany({
          where: { bildiriId: parseInt(data.bildiriId) },
          select: { hakemId: true, durum: true, createdAt: true }
        });

        // Değerlendirme yapan hakem ID'lerini al
        const degerlendirenHakemIds = revizeler.map(r => r.hakemId).filter(Boolean) as number[];
        
        // Her hakem için benzersiz değerlendirmeleri kontrol et
        const benzersizDegerlendirenIds = Array.from(new Set(degerlendirenHakemIds));
        
        console.log("Hakem IDs kontrolü:", {
          hakemIds,
          isArray: Array.isArray(hakemIds),
          length: hakemIds ? hakemIds.length : 0,
          type: typeof hakemIds
        });
        
        // hakemIds'nin geçerli bir dizi olduğundan emin olalım
        if (!Array.isArray(hakemIds) || hakemIds.length === 0) {
          console.log("Hakem dizisi bir dizi değil veya boş, değerlendirme yapılamıyor");
          return NextResponse.json({
            message: 'Revize başarıyla oluşturuldu, ancak bildiri durumu güncellenemedi (hakem dizisi bulunamadı)',
            revize: yeniRevize
          });
        }
        
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
        
        console.log('Hakemlerin son kararları:', Object.fromEntries(sonKararlar));
        
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
        
        console.log('Karar analizi:', {
          herhangiRedVarMi,
          herhangiRevizeVarMi,
          tumKararlarKabulMu
        });
        
        // Tüm hakemler değerlendirme yapmış mı?
        const tumHakemlerDegerlendirdi = hakemIds.every(hakemId => 
          benzersizDegerlendirenIds.includes(hakemId)
        );
        
        console.log(`Hakem kontrolü: ${benzersizDegerlendirenIds.length}/${hakemIds.length} hakem değerlendirme yapmış`);

        // SORUN 1: İlk değerlendirmede anlık durum güncelleme 
        // Eğer revize_yapildi durumunda değilse (ilk değerlendirme) ve anlık REVIZE kararı alındıysa
        if (bildiri.durum !== 'revize_yapildi' && 
            bildiri.durum.toLowerCase() !== 'revize_yapildi' && 
            bildiri.durum !== 'REVIZE_YAPILDI' &&
            data.durum === 'REVIZE') {
          
          // DEĞİŞİKLİK: Revize kararında da tüm hakemlerin değerlendirmesini bekleyelim
          if (tumHakemlerDegerlendirdi) {
            // Tüm hakemler değerlendirdi - şimdi durumu güncelle
            try {
              await prisma.bildiri.update({
                where: { id: parseInt(data.bildiriId) },
                data: { durum: 'revizyon_istendi' }
              });
              console.log(`Bildiri durumu güncellendi: revizyon_istendi (tüm hakemler değerlendirdi ve en az bir hakem revize istedi)`);
            } catch (updateError) {
              console.error("Bildiri durumu güncellenirken hata:", updateError);
            }
          } else {
            console.log(`Değerlendirmeyi sadece ${benzersizDegerlendirenIds.length}/${hakemIds.length} hakem yaptı. Diğer hakemlerin değerlendirmesi bekleniyor.`);
            // Bildiri durumunu değiştirme, tüm hakemler değerlendirene kadar incelemede olarak kalsın
          }
        }
        // SORUN 2: revize_yapildi durumundaki bildirilerin değerlendirilmesi
        else if ((bildiri.durum === 'revize_yapildi' || 
                 bildiri.durum.toLowerCase() === 'revize_yapildi' || 
                 bildiri.durum === 'REVIZE_YAPILDI')) {
          
          // ÖNEMLİ: Revizyondan sonraki tüm değerlendirmelerde bildiri durumunu değiştirme
          // Her hakem kendi değerlendirmesini tamamlayabilmeli
          // Sadece eğer tüm hakemler değerlendirme tamamladıysa durumu değiştir
          if (tumHakemlerDegerlendirdi) {
            // Tüm hakemler değerlendirdi - şimdi durumu güncelle
            console.log("Tüm hakemler revizyonu değerlendirdi, bildiri durumu güncellenebilir");
            
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
                  where: { id: parseInt(data.bildiriId) },
                  data: { durum: hedefDurum }
                });
                console.log(`Bildiri durumu güncellendi: ${hedefDurum} (tüm hakemler değerlendirdi)`);
              } catch (updateError) {
                console.error("Bildiri durumu güncellenirken hata:", updateError);
              }
            }
          } else {
            console.log(`Revizyonu sadece ${benzersizDegerlendirenIds.length}/${hakemIds.length} hakem değerlendirdi. Bildiri durumu "revize_yapildi" olarak korunuyor, diğer hakemlerin değerlendirmesi bekleniyor.`);
            
            // Önemli düzeltme: Bildiri durumunu açıkça "revize_yapildi" olarak güncelle
            // Bu, bir veya birkaç hakem değerlendirme yapsa bile durumun değişmemesini sağlar
            try {
              await prisma.bildiri.update({
                where: { id: parseInt(data.bildiriId) },
                data: { durum: 'revize_yapildi' }
              });
              console.log(`Bildiri durumu açıkça "revize_yapildi" olarak güncellendi. Diğer hakemlerin değerlendirmesi bekleniyor.`);
            } catch (updateError) {
              console.error("Bildiri durumu güncellenirken hata:", updateError);
            }
            // Bildiri durumunu değiştirme, tüm hakemler değerlendirene kadar revize_yapildi olarak kalsın
          }
        }
        // Normal ilk değerlendirme - tüm hakemler değerlendirdiğinde
        else if (tumHakemlerDegerlendirdi) {
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
                where: { id: parseInt(data.bildiriId) },
                data: { durum: hedefDurum }
              });
              console.log(`Bildiri durumu güncellendi: ${hedefDurum} (tüm hakemler değerlendirdi)`);
            } catch (updateError) {
              console.error("Bildiri durumu güncellenirken hata:", updateError);
            }
          }
        } else {
          console.log(`Bildiri durumu güncellenmiyor: Tüm hakemler henüz değerlendirme yapmadı`);
        }
      } else {
        console.log("Bildiri bulunamadı veya hakemler dizisi yok:", {
          bildiriVar: !!bildiri,
          hakemlerVar: bildiri ? !!bildiri.hakemler : false
        });
        
        // Varsayılan olarak içinde sadece mevcut kullanıcı var
        let hakemIds: number[] = user.id ? [user.id] : [];
        
        // Bildiriye ait tüm değerlendirmeleri al (bildiri yoksa atlayacak)
        if (bildiri) {
          const revizeler = await prisma.revize.findMany({
            where: { bildiriId: parseInt(data.bildiriId) },
            select: { hakemId: true }
          });
          
          // Değerlendirme yapan hakem ID'lerini al
          const degerlendirenHakemIds = revizeler.map(r => r.hakemId).filter(Boolean) as number[];
          
          // Her hakem için benzersiz değerlendirmeleri kontrol et
          const benzersizDegerlendirenIds = Array.from(new Set(degerlendirenHakemIds));
          
          console.log("Hakem dizisi bulunamadı, değerlendirme yapan hakemler:", benzersizDegerlendirenIds);
        }
        
        // Bildiri durumunu değiştirme ve sadece revizenin oluşturulduğunu bildir
        return NextResponse.json({
          message: 'Revize başarıyla oluşturuldu, bildiri durum değiştirilmedi (hakemler dizisi bulunamadı)',
          revize: yeniRevize
        });
      }

      return NextResponse.json({
        message: 'Revize başarıyla oluşturuldu',
        revize: yeniRevize
      });
    } else {
      console.log("Bildiri bulunamadı veya hakemler dizisi yok");
      return NextResponse.json({
        message: 'Revize başarıyla oluşturuldu',
        revize: yeniRevize
      });
    }
  } catch (error: any) {
    console.error('Revize ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Revize eklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 