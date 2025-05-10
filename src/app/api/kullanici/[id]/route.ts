import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

interface Params {
  params: {
    id: string;
  };
}

// Belirli bir kullanıcıyı getir (sadece admin veya kendisi)
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }

    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Sadece admin veya kullanıcının kendisi erişebilir
    if (authResult.user.rol !== 'admin' && authResult.user.id !== id) {
      return NextResponse.json(
        { error: 'Bu bilgilere erişim yetkiniz yok' },
        { status: 403 }
      );
    }
    
    const kullanici = await prisma.kullanici.findUnique({
      where: { id },
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
        yazismaAdresi: true,
        kurumTel: true,
        cepTel: true,
        kongreKatilimSekli: true,
        rolId: true,
        hakem_yetenekleri: true as any,
        createdAt: true,
        updatedAt: true,
        rol: {
          select: {
            ad: true
          }
        },
        bildiriler: authResult.user.rol === 'admin' ? {
          select: {
            id: true,
            baslik: true,
            durum: true,
            createdAt: true
          }
        } : undefined
      } as any
    });

    if (!kullanici) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(kullanici);
  } catch (error: any) {
    console.error('Kullanıcı görüntüleme hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Kullanıcıyı güncelle (sadece admin veya kendisi)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ID' },
        { status: 400 }
      );
    }

    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Sadece admin veya kullanıcının kendisi güncelleyebilir
    const isAdmin = authResult.user.rol === 'admin';
    if (!isAdmin && authResult.user.id !== id) {
      return NextResponse.json(
        { error: 'Bu kullanıcıyı güncelleme yetkiniz yok' },
        { status: 403 }
      );
    }

    // Kullanıcının varlığını kontrol et
    const mevcutKullanici = await prisma.kullanici.findUnique({
      where: { id }
    });

    if (!mevcutKullanici) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      ad, 
      soyad, 
      eposta,
      sifre,
      unvan,
      universite,
      kongreKatilimSekli,
      kurum,
      fakulte,
      bolum,
      yazismaAdresi,
      kurumTel,
      cepTel,
      rolId,
      hakem_yetenekleri
    } = body;

    // Güncellenecek verileri hazırla
    const updateData: any = {};

    // Rol güncellemesi sadece admin tarafından yapılabilir
    if (rolId !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Rol değiştirme yetkisine sahip değilsiniz' },
          { status: 403 }
        );
      }

      // Rol varlığını kontrol et
      const rol = await prisma.rol.findUnique({
        where: { id: rolId }
      });

      if (!rol) {
        return NextResponse.json(
          { error: 'Geçersiz rol' },
          { status: 400 }
        );
      }

      updateData.rolId = rolId;
    }

    // E-posta güncelleniyorsa formatını ve benzersizliğini kontrol et
    if (eposta !== undefined && eposta !== mevcutKullanici.eposta) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(eposta)) {
        return NextResponse.json(
          { error: 'Geçersiz e-posta formatı' },
          { status: 400 }
        );
      }

      // E-posta adresi zaten var mı kontrol et
      const existingUser = await prisma.kullanici.findUnique({
        where: { eposta }
      });

      if (existingUser && existingUser.id !== id) {
        return NextResponse.json(
          { error: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor' },
          { status: 400 }
        );
      }

      updateData.eposta = eposta;
    }

    // Telefon numarası formatını kontrol et
    if (cepTel !== undefined && cepTel !== mevcutKullanici.cepTel) {
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(cepTel)) {
        return NextResponse.json(
          { error: 'Geçersiz telefon numarası formatı', detay: 'Telefon numarası sadece rakamlardan oluşmalı ve en az 10, en fazla 15 karakter olmalıdır' },
          { status: 400 }
        );
      }
      updateData.cepTel = cepTel;
    }

    // Şifre güncelleniyorsa hashle
    if (sifre !== undefined && sifre !== '') {
      updateData.sifre = await bcrypt.hash(sifre, 10);
    }

    // Diğer alanları güncelleme verisine ekle
    if (ad !== undefined) updateData.ad = ad;
    if (soyad !== undefined) updateData.soyad = soyad;
    if (unvan !== undefined) updateData.unvan = unvan;
    if (universite !== undefined) updateData.universite = universite;
    if (kongreKatilimSekli !== undefined) updateData.kongreKatilimSekli = kongreKatilimSekli;
    if (kurum !== undefined) updateData.kurum = kurum;
    if (fakulte !== undefined) updateData.fakulte = fakulte;
    if (bolum !== undefined) updateData.bolum = bolum;
    if (yazismaAdresi !== undefined) updateData.yazismaAdresi = yazismaAdresi;
    if (kurumTel !== undefined) updateData.kurumTel = kurumTel;
    // Hakem yeteneklerini ekle
    if (hakem_yetenekleri !== undefined) updateData.hakem_yetenekleri = hakem_yetenekleri;

    // Kullanıcıyı güncelle
    const guncelKullanici = await prisma.kullanici.update({
      where: { id },
      data: updateData as any,
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
        yazismaAdresi: true,
        kurumTel: true,
        cepTel: true,
        kongreKatilimSekli: true,
        rolId: true,
        hakem_yetenekleri: true as any,
        createdAt: true,
        updatedAt: true
      } as any
    });

    return NextResponse.json({
      message: 'Kullanıcı bilgileri başarıyla güncellendi',
      kullanici: guncelKullanici
    });
  } catch (error: any) {
    console.error('Kullanıcı güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Kullanıcı sil (sadece admin)
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

    // Kullanıcının varlığını kontrol et
    const kullanici = await prisma.kullanici.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bildiriler: true
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

    // İlişkili bildiriler varsa, silme işlemini reddet
    if (kullanici._count.bildiriler > 0) {
      return NextResponse.json(
        { 
          error: 'İlişkili kayıtlar var', 
          detay: 'Bu kullanıcının bildiri kayıtları mevcut. Önce ilişkili bildirileri silin veya başka bir kullanıcıya atayın.' 
        },
        { status: 400 }
      );
    }

    // Kullanıcıyı sil
    await prisma.kullanici.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error: any) {
    console.error('Kullanıcı silme hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı silinirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 