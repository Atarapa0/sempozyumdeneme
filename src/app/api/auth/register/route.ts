import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      ad, 
      soyad, 
      unvan, 
      universite, 
      kongreKatilimSekli, 
      kurum, 
      fakulte, 
      bolum, 
      yazismaAdresi, 
      kurumTel, 
      cepTel, 
      eposta, 
      sifre 
    } = body;

    // Zorunlu alanları kontrol et
    if (!ad || !soyad || !cepTel || !eposta || !sifre || !kongreKatilimSekli) {
      console.error('Zorunlu alanlar eksik:', { ad, soyad, cepTel, eposta, kongreKatilimSekli });
      return NextResponse.json(
        { error: 'Zorunlu alanları doldurunuz' },
        { status: 400 }
      );
    }

    // E-posta kontrol et
    const kullaniciVarMi = await prisma.kullanici.findUnique({
      where: { eposta }
    });

    if (kullaniciVarMi) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi ile kayıtlı bir kullanıcı bulunmaktadır' },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(sifre, saltRound);

    // Kullanıcı rolünü bul veya oluştur (normal kullanıcı rolü)
    let kullaniciRolu = await prisma.rol.findUnique({
      where: { ad: 'kullanici' }
    });

    if (!kullaniciRolu) {
      kullaniciRolu = await prisma.rol.create({
        data: { ad: 'kullanici' }
      });
    }

    // Kullanıcıyı oluştur
    const yeniKullanici = await prisma.kullanici.create({
      data: {
        ad,
        soyad,
        unvan,
        universite,
        kongreKatilimSekli,
        kurum,
        fakulte,
        bolum,
        yazismaAdresi,
        kurumTel,
        cepTel,
        eposta,
        sifre: hashedPassword,
        rolId: kullaniciRolu.id
      }
    });

    // Hassas bilgileri çıkar
    const { sifre: _, ...kullaniciVerisi } = yeniKullanici;

    return NextResponse.json(
      { message: 'Kullanıcı başarıyla oluşturuldu', kullanici: kullaniciVerisi },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Kayıt hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulurken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 