import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Belirli bir program etkinliğini getir
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }
    
    const programEtkinligi = await prisma.program.findUnique({
      where: { id },
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      }
    });

    if (!programEtkinligi) {
      return NextResponse.json(
        { error: 'Program etkinliği bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(programEtkinligi);
  } catch (error: any) {
    console.error('Program etkinliği görüntüleme hatası:', error);
    return NextResponse.json(
      { error: 'Program etkinliği alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Program etkinliği güncelle (sadece admin)
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

    // Program etkinliğinin varlığını kontrol et
    const mevcutProgramEtkinligi = await prisma.program.findUnique({
      where: { id }
    });

    if (!mevcutProgramEtkinligi) {
      return NextResponse.json(
        { error: 'Program etkinliği bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      sempozyumId, 
      gun, 
      basTarih, 
      bitTarih, 
      title, 
      konusmaci, 
      lokasyon, 
      tip, 
      aciklama, 
      oturumBaskani 
    } = body;

    // Güncellenecek verileri hazırla
    const updateData: any = {};

    if (sempozyumId !== undefined) {
      // Sempozyum ID'si değiştiriliyorsa, sempozyumun varlığını kontrol et
      if (sempozyumId !== mevcutProgramEtkinligi.sempozyumId) {
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

    // Program tipi kontrol et
    if (tip !== undefined) {
      const gecerliProgramTipleri = ['acilis', 'keynote', 'oturum', 'poster', 'calistay', 'panel', 'ara', 'yemek', 'sosyal', 'kapanis'];
      if (!gecerliProgramTipleri.includes(tip)) {
        return NextResponse.json(
          { error: 'Geçersiz program tipi', detay: `Program tipi şunlardan biri olmalıdır: ${gecerliProgramTipleri.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.tip = tip;
    }

    // Başlangıç zamanı formatını kontrol et
    if (basTarih !== undefined) {
      const saatDakikaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!saatDakikaRegex.test(basTarih)) {
        return NextResponse.json(
          { error: 'Geçersiz başlangıç zamanı formatı', detay: 'basTarih HH:MM formatında olmalıdır (örn: 09:30)' },
          { status: 400 }
        );
      }
      updateData.basTarih = basTarih;
    }

    // Bitiş zamanı formatını kontrol et
    if (bitTarih !== undefined) {
      const saatDakikaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!saatDakikaRegex.test(bitTarih)) {
        return NextResponse.json(
          { error: 'Geçersiz bitiş zamanı formatı', detay: 'bitTarih HH:MM formatında olmalıdır (örn: 14:45)' },
          { status: 400 }
        );
      }
      updateData.bitTarih = bitTarih;
    }

    // Başlangıç ve bitiş zamanlarının uyumlu olduğunu kontrol et
    if ((basTarih !== undefined || bitTarih !== undefined) && 
        (updateData.basTarih || mevcutProgramEtkinligi.basTarih) && 
        (updateData.bitTarih || mevcutProgramEtkinligi.bitTarih)) {
      
      const kontrol_basTarih = updateData.basTarih || mevcutProgramEtkinligi.basTarih;
      const kontrol_bitTarih = updateData.bitTarih || mevcutProgramEtkinligi.bitTarih;
      
      const [baslamaSaat, baslamaDakika] = kontrol_basTarih.split(':').map(Number);
      const [bitisSaat, bitisDakika] = kontrol_bitTarih.split(':').map(Number);
      
      const baslamaDakikaToplam = baslamaSaat * 60 + baslamaDakika;
      const bitisDakikaToplam = bitisSaat * 60 + bitisDakika;
      
      if (baslamaDakikaToplam >= bitisDakikaToplam) {
        return NextResponse.json(
          { error: 'Geçersiz zaman aralığı', detay: 'Başlangıç zamanı bitiş zamanından önce olmalıdır' },
          { status: 400 }
        );
      }
    }

    // Diğer alanları güncelleme verisine ekle
    if (gun !== undefined) updateData.gun = gun;
    if (title !== undefined) updateData.title = title;
    if (konusmaci !== undefined) updateData.konusmaci = konusmaci;
    if (lokasyon !== undefined) updateData.lokasyon = lokasyon;
    if (aciklama !== undefined) updateData.aciklama = aciklama;
    if (oturumBaskani !== undefined) updateData.oturumBaskani = oturumBaskani;

    // Program etkinliğini güncelle
    const guncelProgramEtkinligi = await prisma.program.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Program etkinliği başarıyla güncellendi',
      programEtkinligi: guncelProgramEtkinligi
    });
  } catch (error: any) {
    console.error('Program etkinliği güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Program etkinliği güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Program etkinliği sil (sadece admin)
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

    // Program etkinliğinin varlığını kontrol et
    const programEtkinligi = await prisma.program.findUnique({
      where: { id }
    });

    if (!programEtkinligi) {
      return NextResponse.json(
        { error: 'Program etkinliği bulunamadı' },
        { status: 404 }
      );
    }

    // Program etkinliğini sil
    await prisma.program.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Program etkinliği başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Program etkinliği silme hatası:', error);
    return NextResponse.json(
      { error: 'Program etkinliği silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 