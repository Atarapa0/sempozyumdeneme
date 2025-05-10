import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Kullanıcıları listele (sadece admin)
export async function GET(request: NextRequest) {
  try {
    // URL parametrelerini al
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const rolIdParam = searchParams.get('rolId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    console.log('Kullanıcı listesi API çağrısı:', {
      search,
      rolId: rolIdParam,
      limit,
      offset
    });
    
    // Admin kontrolü - rol filtresi varsa eğer admin olmalı, yoksa tüm kullanıcılar için açık
    let isAdminUser = true;
    if (rolIdParam) {
      const authResult = await roleMiddleware(request, ['admin']);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
    } else {
      // Açık erişim - token kontrolü
      const authResult = await authMiddleware(request);
      if (authResult instanceof NextResponse) {
        isAdminUser = false;
      }
    }
    
    // Filtreleme koşullarını oluştur
    let where: any = {};
    
    // Rol filtresi varsa ekle
    const rolId = rolIdParam ? parseInt(rolIdParam) : undefined;
    if (rolId !== undefined && !isNaN(rolId)) {
      where.rolId = rolId;
      console.log(`Rol filtresi uygulanıyor: rolId = ${rolId}`);
    }
    
    // Arama filtresi varsa ekle
    if (search) {
      where.OR = [
        { ad: { contains: search, mode: 'insensitive' } },
        { soyad: { contains: search, mode: 'insensitive' } },
        { eposta: { contains: search, mode: 'insensitive' } },
        { unvan: { contains: search, mode: 'insensitive' } },
        { universite: { contains: search, mode: 'insensitive' } },
        { kurum: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    try {
      // Toplam kayıt sayısını al
      const total = await prisma.kullanici.count({ where });
      console.log(`Veritabanında toplam ${total} kullanıcı bulundu (filtreli)`);
      
      // Kullanıcıları getir
      const standardSelect = {
        id: true,
        ad: true,
        soyad: true,
        eposta: true,
        unvan: true,
        universite: true,
        kurum: true,
        kongreKatilimSekli: true,
        fakulte: true,
        bolum: true,
        cepTel: true,
        rolId: true,
        createdAt: true,
        updatedAt: true,
        rol: {
          select: {
            id: true,
            ad: true
          }
        },
        _count: isAdminUser ? {
          select: {
            bildiriler: true
          }
        } : undefined
      };
      
      // Select nesnesine dinamik olarak hakem_yetenekleri ekle 
      const selectWithExpertise = {
        ...standardSelect,
        hakem_yetenekleri: true
      };
      
      const kullanicilar = await prisma.kullanici.findMany({
        where,
        select: selectWithExpertise as any,
        orderBy: {
          createdAt: 'desc'
        },
        ...(limit !== undefined && { take: limit }),
        ...(offset !== undefined && { skip: offset })
      });
      
      console.log(`${kullanicilar.length} kullanıcı verisi başarıyla çekildi`);
      
      // Sayfalama bilgilerini ekle
      if (limit !== undefined) {
        return NextResponse.json({
          kullanicilar,
          metadata: {
            total,
            limit,
            offset: offset || 0
          }
        });
      }
      
      return NextResponse.json(kullanicilar);
    } catch (dbError: any) {
      console.error('Prisma veritabanı sorgu hatası:', dbError);
      return NextResponse.json(
        { 
          error: 'Veritabanı sorgu hatası', 
          detay: dbError.message,
          code: dbError.code,
          meta: dbError.meta
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Kullanıcı listesi genel hata:', error);
    return NextResponse.json(
      { 
        error: 'Kullanıcılar alınırken bir hata oluştu', 
        detay: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Yeni kullanıcı ekle (sadece admin veya açık kayıt)
export async function POST(request: NextRequest) {
  try {
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
      rolId: requestedRolId,
      uzmanlıkAlanları
    } = body;

    let rolId = 2; // Varsayılan olarak normal kullanıcı rolü (2)
    let isAdmin = false;

    // Eğer admin rolü talep edildiyse, bunu sadece admin verebilir
    if (requestedRolId && requestedRolId !== 2) {
      const authResult = await roleMiddleware(request, 'admin');
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      isAdmin = true;
      rolId = requestedRolId;
    }

    // Zorunlu alanları kontrol et
    if (!ad || !soyad || !eposta || !sifre || !cepTel || !unvan || !universite || !kongreKatilimSekli || !kurum) {
      return NextResponse.json(
        { error: 'Zorunlu alanlar eksik', detay: 'ad, soyad, eposta, sifre, cepTel, unvan, universite, kongreKatilimSekli ve kurum alanları zorunludur' },
        { status: 400 }
      );
    }

    // E-posta formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(eposta)) {
      return NextResponse.json(
        { error: 'Geçersiz e-posta formatı' },
        { status: 400 }
      );
    }

    // Telefon formatını kontrol et
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(cepTel)) {
      return NextResponse.json(
        { error: 'Geçersiz telefon numarası formatı', detay: 'Telefon numarası sadece rakamlardan oluşmalı ve en az 10, en fazla 15 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // E-posta adresi zaten var mı kontrol et
    const existingUser = await prisma.kullanici.findUnique({
      where: { eposta }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanımda' },
        { status: 400 }
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

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(sifre, 10);

    // Hakem yeteneklerini kontrol et ve formatla
    let hakem_yetenekleri = null;
    if (uzmanlıkAlanları && Array.isArray(uzmanlıkAlanları) && uzmanlıkAlanları.length > 0) {
      // JSON formatında sakla
      hakem_yetenekleri = uzmanlıkAlanları;
    }

    // Kullanıcı veri nesnesi
    const userData = {
      ad,
      soyad,
      eposta,
      sifre: hashedPassword,
      unvan,
      universite,
      kongreKatilimSekli,
      kurum,
      fakulte,
      bolum,
      yazismaAdresi,
      kurumTel,
      cepTel,
      rolId
    };
    
    // Hakem yetenekleri varsa ekle
    if (hakem_yetenekleri) {
      (userData as any).hakem_yetenekleri = hakem_yetenekleri;
    }
    
    // User select nesnesi
    const userSelect = {
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
      createdAt: true,
      updatedAt: true
    };
    
    // Hakem yetenekleri için select
    const userSelectWithExpertise = {
      ...userSelect,
      hakem_yetenekleri: true
    };

    // Yeni kullanıcı oluştur
    const yeniKullanici = await prisma.kullanici.create({
      data: userData,
      select: userSelectWithExpertise as any
    });

    const message = isAdmin 
      ? 'Kullanıcı başarıyla eklendi' 
      : 'Kayıt başarıyla tamamlandı';

    return NextResponse.json(
      { message, kullanici: yeniKullanici },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Kullanıcı ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı eklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 