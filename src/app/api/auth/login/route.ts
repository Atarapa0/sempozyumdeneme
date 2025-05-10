import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eposta, sifre } = body;

    // Zorunlu alanları kontrol et
    if (!eposta || !sifre) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const kullanici = await prisma.kullanici.findUnique({
      where: { eposta },
      include: { rol: true }
    });

    // Kullanıcı bulunamazsa
    if (!kullanici) {
      return NextResponse.json(
        { error: 'Geçersiz e-posta veya şifre' },
        { status: 401 }
      );
    }

    // Şifre kontrolü
    const sifreEslesme = await bcrypt.compare(sifre, kullanici.sifre);
    if (!sifreEslesme) {
      return NextResponse.json(
        { error: 'Geçersiz e-posta veya şifre' },
        { status: 401 }
      );
    }

    // JWT için secret key kontrolü
    const jwtSecret = process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      console.error('JWT secret key tanımlanmamış!');
      return NextResponse.json(
        { error: 'Kimlik doğrulama hatası' },
        { status: 500 }
      );
    }

    // Token oluştur
    const token = jwt.sign(
      { 
        id: kullanici.id, 
        eposta: kullanici.eposta,
        ad: kullanici.ad,
        soyad: kullanici.soyad,
        rol: kullanici.rol.ad.toLowerCase()
      },
      jwtSecret,
      { expiresIn: '12h' }
    );

    // Hassas bilgileri çıkar
    const { sifre: _, ...kullaniciVerisi } = kullanici;

    // Kullanıcı bilgilerini ve token'ı döndür
    return NextResponse.json({
      message: 'Giriş başarılı',
      kullanici: kullaniciVerisi,
      token
    });
  } catch (error: any) {
    console.error('Giriş hatası:', error);
    return NextResponse.json(
      { error: 'Giriş yapılırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 