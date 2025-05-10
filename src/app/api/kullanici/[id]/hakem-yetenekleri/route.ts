import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Hakem yeteneklerini getir
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı ID' },
        { status: 400 }
      );
    }

    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Sadece admin, editor veya kullanıcının kendisi erişebilir
    if (authResult.user.rol !== 'admin' && authResult.user.rol !== 'editor' && authResult.user.id !== id) {
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
        hakem_yetenekleri: true as any,
        rolId: true,
        rol: {
          select: {
            ad: true
          }
        }
      } as any
    }) as any;

    if (!kullanici) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: kullanici.id,
      ad: kullanici.ad,
      soyad: kullanici.soyad,
      rol: kullanici.rol.ad,
      rolId: kullanici.rolId,
      hakem_yetenekleri: kullanici.hakem_yetenekleri || {}
    });
    
  } catch (error: any) {
    console.error('Hakem yetenekleri görüntüleme hatası:', error);
    return NextResponse.json(
      { error: 'Hakem yetenekleri alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Hakem yeteneklerini güncelle
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı ID' },
        { status: 400 }
      );
    }

    // Kullanıcı doğrulama - sadece admin ve editor yetkisi olmalı
    const authResult = await roleMiddleware(request, ['admin', 'editor']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Kullanıcının varlığını kontrol et
    const mevcutKullanici = await prisma.kullanici.findUnique({
      where: { id },
      select: {
        id: true,
        ad: true,
        soyad: true,
        rolId: true,
        hakem_yetenekleri: true as any
      } as any
    });

    if (!mevcutKullanici) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Request body'den hakem yeteneklerini al
    const body = await request.json();
    const { hakem_yetenekleri } = body;

    if (!hakem_yetenekleri) {
      return NextResponse.json(
        { error: 'Hakem yetenekleri alanı gereklidir' },
        { status: 400 }
      );
    }

    // Hakem yeteneklerini güncelle
    const guncelKullanici = await prisma.kullanici.update({
      where: { id },
      data: {
        hakem_yetenekleri: hakem_yetenekleri as any
      } as any,
      select: {
        id: true,
        ad: true,
        soyad: true,
        hakem_yetenekleri: true as any,
        rolId: true,
        rol: {
          select: {
            ad: true
          }
        }
      } as any
    }) as any;

    return NextResponse.json({
      id: guncelKullanici.id,
      ad: guncelKullanici.ad,
      soyad: guncelKullanici.soyad,
      rol: guncelKullanici.rol.ad,
      rolId: guncelKullanici.rolId,
      hakem_yetenekleri: guncelKullanici.hakem_yetenekleri
    });
    
  } catch (error: any) {
    console.error('Hakem yetenekleri güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Hakem yetenekleri güncellenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 