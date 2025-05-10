import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Kullanıcı şifresi değiştirme
export async function POST(request: NextRequest) {
  try {
    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // İstek gövdesini al
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    // Zorunlu alanları kontrol et
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Mevcut şifre ve yeni şifre zorunludur' },
        { status: 400 }
      );
    }

    // Yeni şifre kontrolü
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Yeni şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // Doğrulanmış kullanıcı bilgisini al
    const userId = authResult.user.id;
    console.log('Şifre değiştiriliyor, user id:', userId);

    // Kullanıcıyı bul
    const kullanici = await prisma.kullanici.findUnique({
      where: { id: userId },
      select: {
        id: true,
        sifre: true
      }
    });

    if (!kullanici) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Mevcut şifreyi doğrula
    const isMatch = await bcrypt.compare(oldPassword, kullanici.sifre);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Mevcut şifre hatalı' },
        { status: 400 }
      );
    }

    // Yeni şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Şifreyi güncelle
    await prisma.kullanici.update({
      where: { id: userId },
      data: { 
        sifre: hashedPassword 
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });
  } catch (error: any) {
    console.error('Şifre değiştirme hatası:', error);
    return NextResponse.json(
      { error: 'Şifre değiştirme işlemi sırasında bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 