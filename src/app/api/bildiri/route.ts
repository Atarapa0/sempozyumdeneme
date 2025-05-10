import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Modern App Router yapılandırması
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Bildirileri listele
export async function GET(request: NextRequest) {
  try {
    // URL parametrelerini al
    const sempozyumId = request.nextUrl.searchParams.get('sempozyumId');
    const anaKonuId = request.nextUrl.searchParams.get('anaKonuId');
    const bildiriKonusuId = request.nextUrl.searchParams.get('bildiriKonusuId');
    const kullaniciId = request.nextUrl.searchParams.get('kullaniciId');
    const durum = request.nextUrl.searchParams.get('durum');
    const hakemId = request.nextUrl.searchParams.get('hakemId');
    const search = request.nextUrl.searchParams.get('search');
    
    // Prisma sorgu koşulları
    const where: any = {};
    
    // Parametreler varsa sorgu koşullarına ekle
    if (sempozyumId) {
      where.sempozyumId = parseInt(sempozyumId);
      console.log('Sempozyum filtresi:', parseInt(sempozyumId));
    }
    
    if (anaKonuId) {
      where.anaKonuId = parseInt(anaKonuId);
    }
    
    if (bildiriKonusuId) {
      where.bildiriKonusuId = parseInt(bildiriKonusuId);
    }
    
    if (kullaniciId) {
      where.kullaniciId = parseInt(kullaniciId);
    }
    
    if (durum) {
      where.durum = durum;
    }
    
    // Arama parametresi varsa, başlık, özet ve anahtarKelimeler alanlarında arama yap
    if (search) {
      where.OR = [
        { baslik: { contains: search } },
        { baslikEn: { contains: search } },
        { ozet: { contains: search } },
        { ozetEn: { contains: search } }
      ];
    }
    
    // Bildiri sorgulama sonucu için varsayılan boş dizi
    let bildiriler: any[] = [];
    
    // Include özelliklerini bir kez tanımla, tekrar kullan
    const include = {
      kullanici: {
        select: {
          id: true,
          ad: true,
          soyad: true,
          unvan: true,
          eposta: true,
        }
      },
      sempozyum: {
        select: {
          id: true,
          title: true
        }
      },
      anaKonu: {
        select: {
          baslik: true,
          aciklama: true
        }
      },
      bildiriKonusu: {
        select: {
          id: true,
          baslik: true,
          aciklama: true
        }
      },
      _count: {
        select: { 
          revizeler: true 
        }
      }
    };
    
    // Hakeme göre filtreleme
    if (hakemId) {
      const hakemIdInt = parseInt(hakemId);
      console.log(`Hakem ID: ${hakemIdInt} için bildiriler getiriliyor...`);
      
      try {
        // Tüm bildirileri getir ve JS tarafında filtrele
        const tumBildiriler = await prisma.bildiri.findMany({
          where: {
            ...where,
            hakemler: {
              not: null
            }
          },
          include,
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        // Hakeme atanmış bildirileri filtrele
        bildiriler = tumBildiriler.filter(bildiri => {
          if (!bildiri.hakemler) return false;
          
          try {
            // Hakemler farklı formatlarda olabilir
            let hakemler = bildiri.hakemler;
            
            // String ise JSON olarak çözümle
            if (typeof hakemler === 'string') {
              try {
                hakemler = JSON.parse(hakemler);
              } catch {
                return false;
              }
            }
            
            // Dizi ise hakemId'yi içerip içermediğini kontrol et
            if (Array.isArray(hakemler)) {
              return hakemler.includes(hakemIdInt);
            }
            
            return false;
          } catch (e) {
            console.error('Hakemler alanı çözümlenirken hata:', e);
            return false;
          }
        });
        
        console.log(`${bildiriler.length} bildiri bulundu`);
      } catch (error) {
        console.error('Hakem bildirileri sorgulama hatası:', error);
        bildiriler = [];
        console.log('0 bildiri bulundu (hata nedeniyle)');
      }
    } else {
      // Hakem filtresi yoksa tüm bildirileri getir
      console.log('Tüm bildiriler getiriliyor...');
      
      try {
        bildiriler = await prisma.bildiri.findMany({
          where,
          include,
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        console.log(`${bildiriler.length} bildiri bulundu`);
      } catch (error) {
        console.error('Bildiri listesi alma hatası:', error);
        bildiriler = [];
        console.log('0 bildiri bulundu (hata nedeniyle)');
      }
    }

    // Döndürülen veriler her zaman bir dizi olacak (boş olsa bile)
    return NextResponse.json(bildiriler);
  } catch (error: any) {
    console.error('Bildiri listesi hatası:', error);
    return NextResponse.json(
      { error: 'Bildiriler alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni bildiri ekle
export async function POST(request: NextRequest) {
  try {
    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const data = await request.json();
    
    // Zorunlu alanları kontrol et
    const requiredFields = [
      'sempozyumId', 'baslik', 'baslikEn', 'ozet', 'ozetEn', 
      'yazarlar', 'anahtarKelimeler', 'anahtarKelimelerEn', 
      'sunumTipi', 'anaKonuId', 'bildiriKonusuId', 'kullaniciId'
    ];
    
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
    
    // Ana konunun varlığını kontrol et
    const anaKonu = await prisma.anaKonu.findUnique({
      where: { id: parseInt(data.anaKonuId) }
    });
    
    if (!anaKonu) {
      return NextResponse.json(
        { error: 'Belirtilen ana konu bulunamadı' },
        { status: 404 }
      );
    }
    
    // Bildiri konusunun varlığını kontrol et
    const bildiriKonusu = await prisma.bildiriKonusu.findUnique({
      where: { id: parseInt(data.bildiriKonusuId) }
    });
    
    if (!bildiriKonusu) {
      return NextResponse.json(
        { error: 'Belirtilen bildiri konusu bulunamadı' },
        { status: 404 }
      );
    }
    
    // Kullanıcının varlığını kontrol et
    const kullanici = await prisma.kullanici.findUnique({
      where: { id: parseInt(data.kullaniciId) }
    });
    
    if (!kullanici) {
      return NextResponse.json(
        { error: 'Belirtilen kullanıcı bulunamadı' },
        { status: 404 }
      );
    }
    
    // Hakemler varsa, dizinin içeriğini kontrol et
    let hakemlerData = undefined;
    if (data.hakemler) {
      if (Array.isArray(data.hakemler)) {
        hakemlerData = data.hakemler;
      } else {
        try {
          hakemlerData = JSON.parse(data.hakemler);
        } catch (e) {
          return NextResponse.json(
            { error: 'Hakemler alanı geçerli bir JSON dizisi olmalıdır' },
            { status: 400 }
          );
        }
      }
    }
    
    // Yeni bildiri oluştur
    const yeniBildiri = await prisma.bildiri.create({
      data: {
        sempozyumId: parseInt(data.sempozyumId),
        baslik: data.baslik,
        baslikEn: data.baslikEn,
        ozet: data.ozet,
        ozetEn: data.ozetEn,
        yazarlar: data.yazarlar,
        anahtarKelimeler: data.anahtarKelimeler,
        anahtarKelimelerEn: data.anahtarKelimelerEn,
        sunumTipi: data.sunumTipi,
        sunumYeri: data.sunumYeri,
        kongreyeMesaj: data.kongreyeMesaj,
        intihalPosterDosya: data.intihalPosterDosya,
        anaKonuId: parseInt(data.anaKonuId),
        bildiriKonusuId: parseInt(data.bildiriKonusuId),
        dokuman: data.dokuman,
        kullaniciId: parseInt(data.kullaniciId),
        durum: 'beklemede',
        hakemler: hakemlerData
      }
    });

    return NextResponse.json({
      message: 'Bildiri başarıyla eklendi',
      bildiri: yeniBildiri
    });
  } catch (error: any) {
    console.error('Bildiri ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Bildiri eklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 