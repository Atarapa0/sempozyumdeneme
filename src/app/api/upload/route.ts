import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { existsSync } from 'fs';

// Modern App Router yapılandırması
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Multipart/form-data isteğinden formData'yı elde et
    const formData = await request.formData();
    
    // Dosyayı elde et
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Dosya gönderilmedi' },
        { status: 400 }
      );
    }

    // Dosya tipini kontrol et (sadece resim dosyaları kabul et)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Sadece resim dosyaları (JPEG, PNG, GIF, WEBP, SVG) kabul edilir' },
        { status: 400 }
      );
    }

    // Dosya boyutunu kontrol et (maksimum 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Dosya boyutu 2MB\'dan büyük olamaz' },
        { status: 400 }
      );
    }

    // Dosya adını güvenli hale getir
    const originalName = file.name;
    const fileExtension = path.extname(originalName);
    const randomName = crypto.randomBytes(16).toString('hex');
    const fileName = `${randomName}${fileExtension}`;
    
    // Dosya yolunu oluştur
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'sponsors');
    
    // Klasör yoksa oluştur
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    
    // Dosyayı byte array'e dönüştür
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    
    // Dosyayı kaydet
    await writeFile(filePath, buffer);
    
    // Dosyanın URL'sini oluştur
    const fileUrl = `/uploads/sponsors/${fileName}`;
    
    // Başarılı yanıt
    return NextResponse.json({ 
      success: true, 
      fileName,
      fileUrl,
      originalName
    });
    
  } catch (error: any) {
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json(
      { error: `Dosya yüklenemedi: ${error.message}` },
      { status: 500 }
    );
  }
} 