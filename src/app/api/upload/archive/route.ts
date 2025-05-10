import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, roleMiddleware } from '@/lib/auth-middleware';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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

    // Dosyayı oku
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

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

    // Yükleme dizinini ayarla
    let uploadSubDir = fileType === 'cover' ? 'kapak' : 'pdf';
    const uploadDir = path.join(process.cwd(), 'public', 'arsiv', uploadSubDir);
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Dizin yapısını oluştur
    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
    } catch (err) {
      console.error('Dizin oluşturma hatası:', err);
      return NextResponse.json(
        { error: 'Dosya yükleme dizini oluşturulamadı', detay: err instanceof Error ? err.message : 'Bilinmeyen hata' },
        { status: 500 }
      );
    }

    // Dosyayı yaz
    try {
      await writeFile(filePath, buffer);
    } catch (err) {
      console.error('Dosya yazma hatası:', err);
      return NextResponse.json(
        { error: 'Dosya kaydedilemedi', detay: err instanceof Error ? err.message : 'Bilinmeyen hata' },
        { status: 500 }
      );
    }

    // Erişim URL'si oluştur (public path)
    const fileUrl = `/arsiv/${uploadSubDir}/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      message: 'Dosya başarıyla yüklendi',
      url: fileUrl,
      fileInfo: {
        originalName: originalFilename,
        filename: uniqueFilename,
        type: file.type,
        size: file.size
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Dosya yüklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 