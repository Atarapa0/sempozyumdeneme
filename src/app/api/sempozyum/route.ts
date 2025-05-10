import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Sempozyum listesini getir
export async function GET(request: NextRequest) {
  try {
    const sempozyumlar = await prisma.sempozyum.findMany({
      orderBy: {
        tarih: 'desc'
      }
    });

    return NextResponse.json(sempozyumlar);
  } catch (error: any) {
    console.error('Sempozyum listesi hatası:', error);
    return NextResponse.json(
      { error: 'Sempozyum bilgileri alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni sempozyum oluştur (sadece admin)
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authResult = await roleMiddleware(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { title, tarih, aktiflik } = body;

    // Zorunlu alanları kontrol et
    if (!title || !tarih) {
      return NextResponse.json(
        { error: 'Başlık ve tarih zorunludur' },
        { status: 400 }
      );
    }

    // Sempozyum oluştur
    const yeniSempozyum = await prisma.sempozyum.create({
      data: {
        title,
        tarih: new Date(tarih),
        aktiflik: aktiflik !== undefined ? aktiflik : true
      }
    });

    return NextResponse.json(
      { message: 'Sempozyum başarıyla oluşturuldu', sempozyum: yeniSempozyum },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Sempozyum oluşturma hatası:', error);
    return NextResponse.json(
      { error: 'Sempozyum oluşturulurken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 