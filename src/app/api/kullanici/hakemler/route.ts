import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Modern App Router yapılandırması
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Hakemleri listele (sadece admin ve editor)
export async function GET(request: NextRequest) {
  try {
    // URL parametrelerini al
    const searchParams = request.nextUrl.searchParams;
    const konu = searchParams.get('konu') || '';
    const search = searchParams.get('search') || '';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    console.log('Hakemler listesi API çağrısı:', {
      konu,
      search,
      limit,
      offset
    });
    
    // Admin veya editor kontrolü
    const authResult = await roleMiddleware(request, ['admin', 'editor']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Filtreleme koşullarını oluştur - hakem rolüne sahip kullanıcıları bul
    // Rol ID'si 3 olan kullanıcılar hakemlerdir
    let where: any = {
      rolId: 3
    };
    
    // JSON alanında arama yapmak için raw query kullanmak gerekebilir
    // Ancak daha basit bir yaklaşım da mümkün:
    
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
    
    // Toplam hakem sayısını al
    const total = await prisma.kullanici.count({ where });
    console.log(`Veritabanında toplam ${total} hakem bulundu (filtreli)`);
    
    // Hakemleri getir
    type HakemTipi = {
      id: number;
      ad: string;
      soyad: string;
      eposta: string;
      unvan: string;
      universite: string;
      kurum: string;
      fakulte: string | null;
      bolum: string | null;
      rolId: number;
      createdAt: Date;
      updatedAt: Date;
      hakem_yetenekleri?: any;
    };

    const hakemler = await prisma.kullanici.findMany({
      where,
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
        hakem_yetenekleri: true as any,
        rolId: true,
        createdAt: true,
        updatedAt: true
      } as any,
      orderBy: {
        createdAt: 'desc'
      },
      ...(limit !== undefined && { take: limit }),
      ...(offset !== undefined && { skip: offset })
    }) as unknown as HakemTipi[];
    
    console.log(`${hakemler.length} hakem verisi başarıyla çekildi`);
    
    // Konu filtreleme gerekiyorsa
    let filteredHakemler = hakemler;
    if (konu && konu.trim() !== '') {
      // Hakem yetenekleri JSON alanında konuyu ara
      filteredHakemler = hakemler.filter((hakem: HakemTipi) => {
        if (!hakem.hakem_yetenekleri) return false;
        
        // uzmanlıkAlanları doğrudan string dizisi olarak saklanıyor
        const yetenekler = hakem.hakem_yetenekleri;
        
        // Yetenekler dizisinde arama yap
        if (Array.isArray(yetenekler)) {
          return yetenekler.some((yetenek: string) => 
            yetenek.toLowerCase().includes(konu.toLowerCase())
          );
        }
        
        return false;
      });
      
      console.log(`Konu filtrelemesi sonrası ${filteredHakemler.length} hakem kaldı`);
    }
    
    // Sayfalama bilgilerini ekle
    if (limit !== undefined) {
      return NextResponse.json({
        hakemler: filteredHakemler,
        metadata: {
          total: filteredHakemler.length,
          limit,
          offset: offset || 0
        }
      });
    }
    
    return NextResponse.json(filteredHakemler);
    
  } catch (error: any) {
    console.error('Hakemler listesi genel hata:', error);
    return NextResponse.json(
      { 
        error: 'Hakemler alınırken bir hata oluştu', 
        detay: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 