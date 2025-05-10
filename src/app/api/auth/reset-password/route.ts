import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { validateResetToken, consumeResetToken } from '@/lib/services/auth.service';

// Modern App Router yapılandırması
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { token, yeniSifre } = await request.json();

    if (!token || !yeniSifre) {
      return NextResponse.json({ error: 'Token ve yeni şifre gereklidir' }, { status: 400 });
    }

    // Token doğrulama
    const tokenData = validateResetToken(token);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş token' }, { status: 400 });
    }

    // Şifreyi hashle
    const saltRounds = parseInt(process.env.HASH_SALT_ROUNDS || '10');
    const hashedPassword = await bcrypt.hash(yeniSifre, saltRounds);

    // Kullanıcının şifresini güncelle
    await prisma.kullanici.update({
      where: { id: tokenData.kullaniciId },
      data: { sifre: hashedPassword }
    });

    // Token'ı tüket
    consumeResetToken(token);

    return NextResponse.json({
      message: 'Şifreniz başarıyla sıfırlandı'
    });
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
  }
} 