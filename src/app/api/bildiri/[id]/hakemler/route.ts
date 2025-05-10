import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { roleMiddleware } from '@/lib/auth-middleware';

// PUT /api/bildiri/[id]/hakemler - update reviewers
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Middleware ile yetkilendirme kontrolü - hem admin hem editor rollerine izin ver
    const authResult = await roleMiddleware(request, ['admin', 'editor']);
    
    // Eğer authResult bir Response ise (hata durumu), onu döndür
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // İstek gövdesini al
    const body = await request.json();
    const { hakemler } = body;

    // ID parametresini al
    const bildiriId = parseInt(params.id);
    
    console.log(`Bildiri ID ${bildiriId} için hakem ataması yapılıyor. Hakemler:`, hakemler);

    // hakemler parametresi var mı kontrol et
    if (!hakemler || !Array.isArray(hakemler)) {
      return NextResponse.json(
        { error: 'Geçersiz hakem listesi. Hakemler bir dizi olarak gönderilmelidir.' },
        { status: 400 }
      );
    }

    // Bildiri mevcut mu kontrol et
    const bildiri = await prisma.bildiri.findUnique({
      where: { id: bildiriId },
    });

    if (!bildiri) {
      return NextResponse.json(
        { error: 'Bildiri bulunamadı. Lütfen geçerli bir bildiri ID\'si giriniz.' },
        { status: 404 }
      );
    }

    // Hakemler var mı kontrol et
    if (hakemler.length > 0) {
      for (const hakemId of hakemler) {
        const hakem = await prisma.kullanici.findUnique({
          where: { 
            id: hakemId,
            // rolId: 3 // rolId = 3 olan kullanıcılar hakemdir - bu kısmı esnek bırakalım
          },
        });

        if (!hakem) {
          return NextResponse.json(
            { error: `ID'si ${hakemId} olan hakem bulunamadı.` },
            { status: 404 }
          );
        }
      }
    }

    // Doğrudan bildiri tablosunu güncelleyelim
    // Bildiri.hakemler alanı bir Json field olarak tanımlanmış
    try {
      // Bildiriyi güncelle - hakemler alanını doğrudan güncelle
      const updatedBildiri = await prisma.bildiri.update({
        where: { id: bildiriId },
        data: { 
          hakemler: hakemler, // Hakem ID'lerini Json alanına kaydet
          durum: 'incelemede'  // Bildiri durumunu güncelle (incelemede = under review in Turkish)
        },
      });

      console.log(`Bildiri ID ${bildiriId} hakem ataması güncellendi:`, { hakemler });

      return NextResponse.json({
        id: bildiriId,
        hakemler: hakemler,
        success: true,
        message: hakemler.length > 0 
          ? `Bildiri için ${hakemler.length} adet hakem ataması yapıldı.`
          : 'Bildiriden tüm hakemler kaldırıldı.'
      });
    } catch (updateError) {
      console.error('Bildiri güncelleme hatası:', updateError);
      return NextResponse.json(
        { error: 'Bildiri güncellenirken bir hata oluştu.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Hakem atama hatası:', error);
    return NextResponse.json(
      { error: 'Hakem ataması sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
} 