import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

    // Dosyaları kaydetme dizini
    const uploadDir = join(process.cwd(), 'public', 'dergiler', fileType === 'cover' ? 'kapaklar' : 'pdf');
    console.log('Yükleme dizini:', uploadDir);
    
    // Dizin yoksa oluştur
    if (!existsSync(uploadDir)) {
      console.log('Dizin bulunamadı, oluşturuluyor:', uploadDir);
      await mkdir(uploadDir, { recursive: true });
    }

    // Özgün dosya adı oluştur
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    
    // Dosya adını temizle
    const originalName = file.name.replace(/[^\w\s.-]/g, '');
    const filename = `${uniqueSuffix}-${originalName}`;
    
    console.log('Oluşturulan dosya adı:', filename);

    // Dosyayı kaydet
    const filepath = join(uploadDir, filename);
    console.log('Dosya kaydediliyor:', filepath);
    
    try {
      await writeFile(filepath, new Uint8Array(buffer));
      console.log('Dosya başarıyla kaydedildi');
    } catch (writeError) {
      console.error('Dosya yazma hatası:', writeError);
      return NextResponse.json(
        { error: 'Dosya kaydedilemedi', detay: (writeError as Error).message },
        { status: 500 }
      );
    }

    // Dosya URL'sini döndür
    const fileUrl = `/dergiler/${fileType === 'cover' ? 'kapaklar' : 'pdf'}/${filename}`;
    console.log('Döndürülen dosya URL:', fileUrl);
    
    return NextResponse.json({
      success: true,
      message: fileType === 'cover' ? 'Kapak görseli başarıyla yüklendi' : 'PDF dosyası başarıyla yüklendi',
      url: fileUrl,
      fileInfo: {
        name: originalName,
        type: file.type,
        size: file.size
      }
    });
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Dosya yüklenirken bir hata oluştu', 
        detay: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 