import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Veritabanı seed işlemi başlatılıyor...');

  // Rolleri ekle
  const roles = [
    { ad: 'admin' },
    { ad: 'kullanici' },
    { ad: 'hakem' }
  ];

  for (const role of roles) {
    const existingRole = await prisma.rol.findUnique({
      where: { ad: role.ad }
    });

    if (!existingRole) {
      await prisma.rol.create({
        data: role
      });
      console.log(`${role.ad} rolü oluşturuldu.`);
    } else {
      console.log(`${role.ad} rolü zaten mevcut.`);
    }
  }

  // Admin kullanıcısını ekle (eğer yoksa)
  const adminEmail = 'admin@example.com';
  const adminRole = await prisma.rol.findUnique({
    where: { ad: 'admin' }
  });

  if (adminRole) {
    const existingAdmin = await prisma.kullanici.findUnique({
      where: { eposta: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.kullanici.create({
        data: {
          ad: 'Admin',
          soyad: 'Kullanıcı',
          eposta: adminEmail,
          sifre: hashedPassword,
          cepTel: '5555555555',
          kongreKatilimSekli: 'misafir',
          rolId: adminRole.id,
          unvan: 'Dr.',
          universite: 'Örnek Üniversite',
          kurum: 'Örnek Kurum',
          fakulte: 'Örnek Fakülte',
          bolum: 'Örnek Bölüm',
          yazismaAdresi: 'Örnek Adres',
          kurumTel: '0212 123 4567'
        }
      });
      console.log('Admin kullanıcısı oluşturuldu.');
    } else {
      console.log('Admin kullanıcısı zaten mevcut.');
    }
  }

  console.log('Seed işlemi tamamlandı.');
}

main()
  .catch((e) => {
    console.error('Seed işlemi sırasında hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 