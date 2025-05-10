import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Belirli bir iletişim mesajını getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçerli bir ID belirtiniz' },
        { status: 400 }
      );
    }

    // İletişim mesajını bul
    // @ts-ignore
    const iletisim = await prisma.iletisim.findUnique({
      where: { id }
    });

    if (!iletisim) {
      return NextResponse.json(
        { error: 'İletişim mesajı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(iletisim);
  } catch (error: any) {
    console.error('İletişim mesajı getirme hatası:', error);
    return NextResponse.json(
      { error: 'İletişim mesajı alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// İletişim mesajını güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçerli bir ID belirtiniz' },
        { status: 400 }
      );
    }

    // Gelen verileri al
    const data = await request.json();

    // İletişim mesajını güncelle
    // @ts-ignore
    const updatedIletisim = await prisma.iletisim.update({
      where: { id },
      data: {
        // Sadece şemada olan alanları güncelle
        adSoyad: data.adSoyad,
        eposta: data.eposta,
        konu: data.konu,
        mesaj: data.mesaj,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'İletişim mesajı başarıyla güncellendi',
      iletisim: updatedIletisim
    });
  } catch (error: any) {
    console.error('İletişim mesajı güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'İletişim mesajı güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// İletişim mesajını sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçerli bir ID belirtiniz' },
        { status: 400 }
      );
    }

    // İletişim mesajının var olup olmadığını kontrol et
    // @ts-ignore
    const iletisim = await prisma.iletisim.findUnique({
      where: { id }
    });

    if (!iletisim) {
      return NextResponse.json(
        { error: 'İletişim mesajı bulunamadı' },
        { status: 404 }
      );
    }

    // İletişim mesajını sil
    // @ts-ignore
    await prisma.iletisim.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'İletişim mesajı başarıyla silindi'
    });
  } catch (error: any) {
    console.error('İletişim mesajı silme hatası:', error);
    return NextResponse.json(
      { error: 'İletişim mesajı silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 