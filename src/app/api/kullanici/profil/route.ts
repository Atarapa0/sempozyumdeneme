import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Kullanıcı profili bilgilerini getir (oturum açan kullanıcı)
export async function GET(request: NextRequest) {
  try {
    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Doğrulanmış kullanıcı bilgisini al
    const userId = authResult.user.id;
    console.log('Profil bilgileri alınıyor, user id:', userId);

    // Kullanıcı bilgilerini getir
    const kullanici = await prisma.kullanici.findUnique({
      where: { id: userId },
      select: {
        id: true,
        ad: true,
        soyad: true,
        eposta: true,
        unvan: true,
        universite: true,
        kurum: true,
        fakulte: true,
        bolum: true,
        kongreKatilimSekli: true,
        cepTel: true,
        rolId: true,
        createdAt: true,
        updatedAt: true,
        rol: {
          select: {
            id: true,
            ad: true
          }
        }
      }
    });

    if (!kullanici) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(kullanici);
  } catch (error: any) {
    console.error('Profil bilgisi alma hatası:', error);
    return NextResponse.json(
      { error: 'Profil bilgileri alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Kullanıcı profil bilgilerini güncelle (oturum açan kullanıcı)
export async function PUT(request: NextRequest) {
  try {
    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Doğrulanmış kullanıcı bilgisini al
    const userId = authResult.user.id;
    console.log('Profil güncelleniyor, user id:', userId);

    // İstek gövdesini al
    const body = await request.json();
    const { 
      ad, 
      soyad, 
      unvan, 
      bolum, 
      universite, 
      kurum, 
      kongreKatilimSekli,
      fakulte, 
      cepTel 
    } = body;

    // Kullanıcıyı güncelle
    const updatedUser = await prisma.kullanici.update({
      where: { id: userId },
      data: {
        ad: ad !== undefined ? ad : undefined,
        soyad: soyad !== undefined ? soyad : undefined,
        unvan: unvan !== undefined ? unvan : undefined,
        bolum: bolum !== undefined ? bolum : undefined,
        universite: universite !== undefined ? universite : undefined,
        kurum: kurum !== undefined ? kurum : undefined,
        kongreKatilimSekli: kongreKatilimSekli !== undefined ? kongreKatilimSekli : undefined,
        fakulte: fakulte !== undefined ? fakulte : undefined,
        cepTel: cepTel !== undefined ? cepTel : undefined
      },
      select: {
        id: true,
        ad: true,
        soyad: true,
        eposta: true,
        unvan: true,
        universite: true,
        kurum: true,
        fakulte: true,
        bolum: true,
        kongreKatilimSekli: true,
        cepTel: true,
        rolId: true,
        createdAt: true,
        updatedAt: true,
        rol: {
          select: {
            id: true,
            ad: true
          }
        }
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Profil güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Profil güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 