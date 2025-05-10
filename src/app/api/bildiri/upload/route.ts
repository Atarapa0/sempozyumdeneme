import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Bildiri Dosyası Yükleme Endpoint'i
export async function POST(request: NextRequest) {
  try {
    // Session kontrolü
    const session = await getServerSession(authOptions);
    
    // Eğer session yoksa, token kontrolü yap
    if (!session) {
      const authResult = await authMiddleware(request);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
    }

    // Form verilerini al
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Zorunlu alanları kontrol et
    if (!file) {
      return NextResponse.json(
        { error: 'Dosya yüklenmedi', detay: 'Dosya alanı zorunludur' },
        { status: 400 }
      );
    }

    // Aktif sempozyumu kontrol et
    const activeSempozyum = await prisma.sempozyum.findFirst({
      where: { aktiflik: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeSempozyum) {
      return NextResponse.json(
        { error: 'Aktif sempozyum bulunamadı', detay: 'Bildiri yüklemek için aktif bir sempozyum olması gerekmektedir' },
        { status: 404 }
      );
    }

    // Dosya boyutu kontrolü (20MB)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Dosya boyutu çok büyük', detay: 'Maksimum dosya boyutu: 20MB' },
        { status: 400 }
      );
    }

    // Dosya türü kontrolü
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Desteklenmeyen dosya türü', detay: 'Sadece PDF dosyaları yüklenebilir' },
        { status: 400 }
      );
    }

    // Dosya adını temizle ve benzersiz bir isim oluştur
    const originalFilename = file.name;
    
    // Dosya adının temiz bir versiyonunu oluştur
    let safeFilename = originalFilename
      .replace(/[^a-zA-Z0-9.]/g, '-') // Noktayı da (.pdf için) koru
      .replace(/-+/g, '-')
      .toLowerCase();
    
    // Dosya uzantısını kontrol et
    if (!safeFilename.endsWith('.pdf')) {
      // Eğer -pdf ile bitiyorsa, bunu .pdf'e çevir
      if (safeFilename.endsWith('-pdf')) {
        safeFilename = safeFilename.replace(/-pdf$/, '.pdf');
      } 
      // Hiç bir uzantı yoksa, .pdf ekle
      else if (!safeFilename.includes('.')) {
        safeFilename = `${safeFilename}.pdf`;
      }
    }
    
    const uniqueFilename = `${Date.now()}-${safeFilename}`;

    // Yükleme için Supabase bucket ve yol bilgileri
    const bucketName = 'bildiriler';
    const folderName = activeSempozyum.title.replace(/\s+/g, '-').toLowerCase();
    const filePath = `${folderName}/${uniqueFilename}`;

    try {
      // NOT: Bucket'ı manuel olarak Supabase Dashboard'dan oluşturmanız gerekiyor
      console.log('Dosyayı Supabase\'e yüklemeye çalışıyorum:', bucketName, filePath);
      
      // Dosyayı Supabase'e yükle
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Dosya zaten varsa üzerine yaz
        });
      
      if (error) {
        console.error('Supabase upload hatası:', error);
        
        // Bucket bulunamadı hatası (manuel oluşturulması gerekiyor)
        if (error.statusCode === '404' && error.message === 'Bucket not found') {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Depolama alanı (bucket) bulunamadı', 
              detay: 'Lütfen Supabase Dashboard\'dan "bildiriler" adlı bir bucket oluşturun ve public erişim izni verin.' 
            },
            { status: 404 }
          );
        }
        
        throw error;
      }
      
      // Dosyanın public URL'sini al
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return NextResponse.json({
        message: 'Bildiri dosyası başarıyla yüklendi',
        fileInfo: {
          originalName: originalFilename,
          filename: uniqueFilename,
          type: file.type,
          size: file.size,
          url: publicUrl
        }
      }, { status: 201 });
    } catch (uploadError: any) {
      console.error('Supabase yükleme hatası:', uploadError);
      return NextResponse.json(
        { 
          error: 'Dosya yüklenemedi', 
          detay: uploadError.message || 'Bilinmeyen bir hata',
          code: uploadError.code || uploadError.statusCode 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Bildiri dosyası yükleme hatası:', error);
    return NextResponse.json(
      { error: 'Bildiri dosyası yüklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 