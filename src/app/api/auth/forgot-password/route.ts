import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addHours } from 'date-fns';
import { createResetToken } from '@/lib/services/auth.service';

// Modern App Router yapılandırması
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Resend if API key exists
let resend: any;
try {
  const { Resend } = require('resend');
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (resendApiKey) {
    resend = new Resend(resendApiKey);
  } else {
    console.warn('RESEND_API_KEY not found in environment variables');
  }
} catch (error) {
  console.error('Failed to initialize Resend:', error);
}

export async function POST(request: NextRequest) {
  try {
    const { eposta } = await request.json();

    if (!eposta) {
      return NextResponse.json({ error: 'E-posta adresi gereklidir' }, { status: 400 });
    }

    // Kullanıcıyı bul
    const kullanici = await prisma.kullanici.findUnique({
      where: { eposta }
    });

    if (!kullanici) {
      return NextResponse.json({ error: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı' }, { status: 404 });
    }

    // Token oluştur - 24 saat geçerli
    const expireDate = addHours(new Date(), 24);
    const resetToken = createResetToken(kullanici.id, expireDate);
    
    // Reset URL oluştur
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    
    // E-posta gönderme işlemi
    if (resend) {
      // E-posta gönder
      const { data, error } = await resend.emails.send({
        from: 'MÜBES <onboarding@resend.dev>',
        to: eposta,
        subject: 'MÜBES 2025 Şifre Sıfırlama',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #294b89;">MÜBES 2025</h1>
            </div>
            
            <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #294b89; margin-top: 0;">Şifre Sıfırlama</h2>
              <p>Merhaba ${kullanici.ad} ${kullanici.soyad},</p>
              <p>MÜBES 2025 hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #294b89; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Şifremi Sıfırla</a>
              </div>
              
              <p>Bu bağlantı 24 saat süreyle geçerlidir.</p>
              <p>Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
            </div>
            
            <div style="font-size: 12px; color: #666; text-align: center;">
              <p>&copy; 2025 MÜBES. Tüm hakları saklıdır.</p>
            </div>
          </div>
        `
      });

      if (error) {
        console.error('E-posta gönderme hatası:', error);
        return NextResponse.json({ error: 'Şifre sıfırlama e-postası gönderilirken bir hata oluştu' }, { status: 500 });
      }
    } else {
      // Resend kullanılamıyorsa, log ile token'ı yazdır (geliştirme ortamında kullanışlı)
      console.log('====== ŞİFRE SIFIRLAMA BAĞLANTISI ======');
      console.log('TOKEN:', resetToken);
      console.log('URL:', resetUrl);
      console.log('=======================================');
    }

    return NextResponse.json({
      message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi'
    });
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 });
  }
} 