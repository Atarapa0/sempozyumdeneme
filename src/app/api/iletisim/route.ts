import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// İletişim mesajlarını listele (sadece adminler için)
export async function GET(request: NextRequest) {
  try {
    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Admin rolünü kontrol et
    const roleResult = await roleMiddleware(request, ['admin']);
    if (roleResult instanceof NextResponse) {
      return roleResult;
    }

    // URL parametrelerini al
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
    
    // Mesaj sayısını al
    // @ts-ignore
    const total = await prisma.iletisim.count();
    
    // Mesajları listele
    // @ts-ignore
    const iletisimler = await prisma.iletisim.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    return NextResponse.json({
      messages: iletisimler,
      total: total,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('İletişim mesajları listesi hatası:', error);
    return NextResponse.json(
      { error: 'İletişim mesajları alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni iletişim mesajı gönder (herkes erişebilir)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Zorunlu alanları kontrol et
    const requiredFields = ['adSoyad', 'eposta', 'konu', 'mesaj'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} alanı zorunludur` },
          { status: 400 }
        );
      }
    }
    
    // E-posta formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.eposta)) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi giriniz' },
        { status: 400 }
      );
    }
    
    // Yeni iletişim mesajı oluştur
    // @ts-ignore
    const yeniIletisim = await prisma.iletisim.create({
      data: {
        adSoyad: data.adSoyad,
        eposta: data.eposta,
        konu: data.konu,
        mesaj: data.mesaj
      }
    });

    return NextResponse.json({
      message: 'Mesajınız başarıyla gönderildi',
      iletisim: yeniIletisim
    });
  } catch (error: any) {
    console.error('İletişim mesajı ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Mesajınız gönderilirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 