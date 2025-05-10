import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Modern App Router yapılandırması
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// RevizeGecmisi kayıtlarını listele
export async function GET(request: NextRequest) {
  try {
    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const bildiriId = request.nextUrl.searchParams.get('bildiriId');
    const hakemId = request.nextUrl.searchParams.get('hakemId');
    const sempozyumId = request.nextUrl.searchParams.get('sempozyumId');
    
    let where: any = {};
    
    if (bildiriId) {
      where.bildiriId = parseInt(bildiriId);
    }
    
    if (hakemId) {
      where.hakemId = parseInt(hakemId);
    }
    
    if (sempozyumId) {
      where.sempozyumId = parseInt(sempozyumId);
    }
    
    const revizeGecmisi = await prisma.revizeGecmisi.findMany({
      where,
      orderBy: {
        revizeTarihi: 'desc'
      }
    });

    return NextResponse.json(revizeGecmisi);
  } catch (error: any) {
    console.error('RevizeGecmisi listesi hatası:', error);
    return NextResponse.json(
      { error: 'RevizeGecmisi kayıtları alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 