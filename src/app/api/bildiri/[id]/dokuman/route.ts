import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth-middleware';
import { redirect } from 'next/navigation';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz bildiri ID' },
        { status: 400 }
      );
    }
    
    // Bildiriyi ve dokuman bilgisini getir
    const bildiri = await prisma.bildiri.findUnique({
      where: { id },
      select: {
        dokuman: true
      }
    });

    if (!bildiri) {
      return NextResponse.json(
        { error: 'Bildiri bulunamadı' },
        { status: 404 }
      );
    }
    
    if (!bildiri.dokuman) {
      return NextResponse.json(
        { error: 'Bu bildiri için yüklenmiş bir doküman bulunamadı' },
        { status: 404 }
      );
    }
    
    // Doküman URL'ine yönlendir
    const documentUrl = bildiri.dokuman;
    
    // URL düzeltme işlemleri
    let correctedUrl = documentUrl;
    
    // 1. -pdf uzantısı varsa, bunu .pdf olarak düzelt
    if (documentUrl.endsWith('-pdf')) {
      correctedUrl = documentUrl.replace(/-pdf$/, '.pdf');
    } 
    // 2. Dosya adında hiç nokta yoksa (uzantı yoksa), .pdf ekle
    else if (!documentUrl.includes('.')) {
      correctedUrl = `${documentUrl}.pdf`;
    }
    // 3. Dosya adında PDF kelimesi var ama uzantı yoksa, .pdf ekle
    else if (documentUrl.toLowerCase().includes('pdf') && !documentUrl.toLowerCase().endsWith('.pdf')) {
      correctedUrl = `${documentUrl}.pdf`;
    }
    
    // URL değişti mi kontrol et
    if (correctedUrl !== documentUrl) {
      // Düzeltilmiş URL'i bildiri kaydına güncelleyelim
      try {
        await prisma.bildiri.update({
          where: { id },
          data: { dokuman: correctedUrl }
        });
        
        console.log(`Bildiri #${id} için doküman URL'i düzeltildi: ${documentUrl} -> ${correctedUrl}`);
      } catch (updateError) {
        console.error(`Bildiri #${id} doküman URL'i güncellenirken hata:`, updateError);
        // Hata olsa bile düzeltilmiş URL'i kullanmaya devam et
      }
    }
    
    // Url doğrudan public klasöründeki bir dosyaya işaret ediyorsa
    // Kullanıcıyı bu URL'e yönlendir
    try {
      // URL oluştur 
      return NextResponse.redirect(new URL(correctedUrl, request.url));
    } catch (urlError) {
      console.error(`Geçersiz URL formatı:`, urlError);
      // URL oluşturulamazsa hata döndür
      return NextResponse.json(
        { error: 'Geçersiz doküman URL formatı', detay: correctedUrl },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    console.error('Bildiri dokümanı alma hatası:', error);
    return NextResponse.json(
      { error: 'Bildiri dokümanı alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 