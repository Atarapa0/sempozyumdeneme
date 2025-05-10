import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('Dergi dosyası yükleme isteği alındı');
  
  try {
    // Sadece admin kullanıcıların erişimine izin ver
    console.log('Admin yetki kontrolü yapılıyor');
    const authResult = await roleMiddleware(request, 'admin');
    if (authResult instanceof NextResponse) {
      console.error('Yetki hatası:', authResult.status);
      return authResult;
    }
    console.log('Yetki kontrolü başarılı');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string; // 'cover' veya 'pdf'
    
    console.log('Dosya bilgileri alındı:', {
      dosyaAdi: file?.name,
      dosyaTipi: file?.type,
      dosyaBoyutu: file?.size,
      yuklemeTipi: fileType
    });
    
    if (!file) {
      console.error('Dosya bulunamadı');
      return NextResponse.json(
        { error: 'Dosya yüklenmedi' },
        { status: 400 }
      );
    }

    if (!fileType || !['cover', 'pdf'].includes(fileType)) {
      console.error('Geçersiz dosya tipi:', fileType);
      return NextResponse.json(
        { error: 'Geçersiz dosya tipi. Kapak görseli veya PDF olmalıdır.' },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      console.error('Dosya boyutu limit aşımı:', file.size);
      return NextResponse.json(
        { error: 'Dosya boyutu çok büyük. Maksimum dosya boyutu 10MB.' },
        { status: 400 }
      );
    }

    // Dosya tipine göre izin verilen MIME türlerini kontrol et
    if (fileType === 'cover') {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedImageTypes.includes(file.type)) {
        console.error('Geçersiz görsel formatı:', file.type);
        return NextResponse.json(
          { error: 'Geçersiz görsel formatı. Sadece JPEG, PNG, WebP ve GIF formatları desteklenmektedir.' },
          { status: 400 }
        );
      }
    } else if (fileType === 'pdf') {
      if (file.type !== 'application/pdf') {
        console.error('Geçersiz PDF formatı:', file.type);
        return NextResponse.json(
          { error: 'Geçersiz dosya formatı. Sadece PDF dosyaları desteklenmektedir.' },
          { status: 400 }
        );
      }
    }

    // Supabase bucket adı ve alt dizin
    const bucketName = 'dergiler';
    const folderPath = fileType === 'cover' ? 'kapaklar' : 'pdf';
    
    // Özgün dosya adı oluştur
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    
    // Dosya adını temizle
    const originalName = file.name.replace(/[^\w\s.-]/g, '');
    const filename = `${uniqueSuffix}-${originalName}`;
    const filePath = `${folderPath}/${filename}`;
    
    console.log('Oluşturulan dosya adı:', filename);
    console.log('Supabase yolu:', filePath);

    try {
      // NOT: Bucket'ı manuel olarak Supabase Dashboard'dan oluşturmanız gerekiyor
      console.log('Dosyayı Supabase\'e yüklemeye çalışıyorum...');
      
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
              detay: 'Lütfen Supabase Dashboard\'dan "dergiler" adlı bir bucket oluşturun ve public erişim izni verin.' 
            },
            { status: 404 }
          );
        }
        
        throw error;
      }
      
      console.log('Dosya başarıyla Supabase\'e yüklendi:', data);
      
      // Dosyanın public URL'sini al
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      console.log('Döndürülen dosya URL:', publicUrl);
      
      return NextResponse.json({
        success: true,
        message: fileType === 'cover' ? 'Kapak görseli başarıyla yüklendi' : 'PDF dosyası başarıyla yüklendi',
        url: publicUrl,
        fileInfo: {
          name: originalName,
          type: file.type,
          size: file.size,
          path: filePath
        }
      });
    } catch (uploadError: any) {
      console.error('Dosya yükleme hatası:', uploadError);
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
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Dosya yüklenirken bir hata oluştu', 
        detay: error.message || 'Bilinmeyen bir hata' 
      },
      { status: 500 }
    );
  }
} 