import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';

// Arşiv Dosyası Yükleme Endpoint'i
export async function POST(request: NextRequest) {
  try {
    // Kullanıcı doğrulama
    const authResult = await authMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Admin rolünü kontrol et
    const roleResult = await roleMiddleware(request, ['admin']);
    if (roleResult instanceof NextResponse) {
      return roleResult;
    }

    // Form verilerini al
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileType = formData.get('fileType') as string | null;

    // Zorunlu alanları kontrol et
    if (!file) {
      return NextResponse.json(
        { error: 'Dosya yüklenmedi', detay: 'Dosya alanı zorunludur' },
        { status: 400 }
      );
    }

    if (!fileType || !['cover', 'pdf'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya türü', detay: 'fileType parametresi zorunludur ve "cover" veya "pdf" olmalıdır' },
        { status: 400 }
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
    if (fileType === 'cover' && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Desteklenmeyen dosya türü', detay: 'Kapak görseli için sadece resim dosyaları yüklenebilir' },
        { status: 400 }
      );
    }

    if (fileType === 'pdf' && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Desteklenmeyen dosya türü', detay: 'Bu alanda sadece PDF dosyaları yüklenebilir' },
        { status: 400 }
      );
    }

    // Dosya adını temizle ve benzersiz bir isim oluştur
    const originalFilename = file.name;
    
    // Dosya adının temiz bir versiyonunu oluştur
    let safeFilename = originalFilename
      .replace(/[^a-zA-Z0-9.]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    
    // Dosya uzantısını kontrol et
    if (fileType === 'pdf' && !safeFilename.endsWith('.pdf')) {
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

    // Yükleme alt dizini ayarla
    const uploadSubDir = fileType === 'cover' ? 'kapak' : 'pdf';
    
    // Supabase Storage'a yükleme yapacak bucket ve yol
    const bucketName = 'arsiv';
    const filePath = `${uploadSubDir}/${uniqueFilename}`;
    
    try {
      // NOT: Bucket'ı manuel olarak Supabase Dashboard'dan oluşturmanız gerekiyor
      // Bucket'a doğrudan upload yapmayı deneyin
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Dosya zaten varsa üzerine yaz
        });
      
      if (error) {
        console.error('Supabase upload hatası:', error);
        
        // Bucket bulunamadı hatası (manuel oluşturulması gerekiyor)
        // StorageError yapısı farklı olabileceği için genel bir kontrol yapıyoruz
        const errorMessage = error.message || '';
        // @ts-ignore - Farklı hata yapıları için
        const errorStatus = error.statusCode || error.status || '';
        
        if ((errorMessage.includes('Bucket not found') || 
            // @ts-ignore - Farklı hata yapıları için
            (typeof error.error === 'string' && error.error.includes('Bucket not found')))) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Depolama alanı (bucket) bulunamadı', 
              detay: 'Lütfen Supabase Dashboard\'dan "arsiv" adlı bir bucket oluşturun ve public erişim izni verin.' 
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
        success: true,
        message: 'Dosya başarıyla yüklendi',
        url: publicUrl,
        fileInfo: {
          originalName: originalFilename,
          filename: uniqueFilename,
          type: file.type,
          size: file.size,
          path: filePath
        }
      }, { status: 201 });
      
    } catch (error: any) {
      console.error('Supabase Storage yükleme hatası:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dosya yüklenirken bir hata oluştu', 
          detay: error.message || 'Bilinmeyen bir hata oluştu',
          code: error.code || error.statusCode
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Dosya yüklenirken bir hata oluştu', 
        detay: error.message || 'Bilinmeyen bir hata oluştu' 
      },
      { status: 500 }
    );
  }
} 