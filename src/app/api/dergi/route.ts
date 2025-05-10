import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

// Dergileri listele
export async function GET(request: NextRequest) {
  try {
    // Not: Dergiler artık sempozyumId'ye göre filtrelenmeyecek, tüm dergiler listelenecek.
    // Sempozyum bilgisi hala dahil ediliyor ama filtre olarak kullanılmıyor
    const dergiler = await prisma.dergi.findMany({
      include: {
        sempozyum: {
          select: {
            title: true
          }
        }
      },
      orderBy: [
        { yayinTarihi: 'desc' }
      ]
    });

    // Alan isimlerini frontend için uyumlu hale getiriyoruz
    const formattedDergiler = dergiler.map(dergi => ({
      id: dergi.id.toString(),
      title: dergi.ad,
      description: dergi.aciklama,
      publishDate: dergi.yayinTarihi.toISOString(),
      coverImage: dergi.kapakGorselUrl || '',
      pdfUrl: dergi.pdfDosya || '',
      symposiumId: dergi.sempozyumId.toString(),
      sempozyumTitle: dergi.sempozyum?.title || '',
      createdAt: dergi.createdAt.toISOString(),
      updatedAt: dergi.updatedAt.toISOString()
    }));

    return NextResponse.json(formattedDergiler);
  } catch (error: any) {
    console.error('Dergi listesi hatası:', error);
    return NextResponse.json(
      { error: 'Dergiler alınırken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
}

// Yeni dergi ekle (sadece admin)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return new Response(
        JSON.stringify({ 
          error: 'Authorization header is required', 
          detay: 'Yetkilendirme başlığı gereklidir. Lütfen giriş yapın.' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Log headers for debugging
    console.log('API request headers:', Object.fromEntries(request.headers.entries()));
    
    const data = await request.json();
    console.log('Received data:', data);
    
    // API URL kontrolü
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log('API URL:', apiUrl);
    
    if (!apiUrl) {
      // API URL yoksa, doğrudan Prisma ile işlem yapalım
      console.log('API URL tanımlı değil, direkt veritabanına yazılıyor');
      
      try {
        // Tarih kontrolü
        let publishDate;
        try {
          publishDate = new Date(data.yayinTarihi);
          if (isNaN(publishDate.getTime())) {
            publishDate = new Date(); // Geçersizse bugünün tarihini kullan
          }
        } catch (dateError) {
          console.error('Tarih dönüştürme hatası:', dateError);
          publishDate = new Date();
        }
        
        // Dergiyi doğrudan veritabanına ekle
        const newDergi = await prisma.dergi.create({
          data: {
            ad: data.ad,
            aciklama: data.aciklama,
            yayinTarihi: publishDate,
            kapakGorselUrl: data.kapakGorselUrl || '',
            pdfDosya: data.pdfDosya || '',
            sempozyumId: data.sempozyumId
          }
        });
        
        // Yanıtı hazırla
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Dergi başarıyla eklendi',
            data: newDergi
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (dbError: any) {
        console.error('Veritabanı ekleme hatası:', dbError);
        return new Response(
          JSON.stringify({ 
            error: 'Dergi eklenirken bir hata oluştu', 
            detay: dbError.message || 'Veritabanı hatası' 
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // API URL varsa, dış API'ye istek yap
    console.log('Harici API kullanılıyor:', `${apiUrl}/api/dergiler`);
    
    // Forward the request to the backend API with the token
    const response = await fetch(`${apiUrl}/api/dergiler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: errorData.message || 'Dergi eklenirken bir hata oluştu',
          detay: errorData.detay || 'Sunucu hatası, lütfen daha sonra tekrar deneyin.' 
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await response.json();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('API route error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Server Error', 
        detay: error.message || 'İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 