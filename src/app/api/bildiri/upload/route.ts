import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    // Dosyayı oku
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

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

    // Yükleme dizinini ayarla
    const uploadDir = path.join(process.cwd(), 'public', 'bildiriler', activeSempozyum.title.replace(/\s+/g, '-').toLowerCase());
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Dizin yapısını oluştur
    try {
      await mkdir(uploadDir, { recursive: true });
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
    const fileUrl = `/bildiriler/${activeSempozyum.title.replace(/\s+/g, '-').toLowerCase()}/${uniqueFilename}`;

    return NextResponse.json({
      message: 'Bildiri dosyası başarıyla yüklendi',
      fileInfo: {
        originalName: originalFilename,
        filename: uniqueFilename,
        type: file.type,
        size: file.size,
        url: fileUrl
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Bildiri dosyası yükleme hatası:', error);
    return NextResponse.json(
      { error: 'Bildiri dosyası yüklenirken bir hata oluştu', detay: error.message },
      { status: 500 }
    );
  }
} 