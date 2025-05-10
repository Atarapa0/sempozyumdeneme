# Sempozyum Yönetim Sistemi

Bilimsel sempozyumların yönetimi için geliştirilmiş modern ve kapsamlı bir web uygulaması. Sistem, bildiri gönderimi, hakem değerlendirmesi, program yönetimi ve katılımcı organizasyonu gibi temel işlevleri sağlar.

## 🚀 Özellikler

### Kullanıcı Yönetimi
- Çoklu kullanıcı rolleri (Admin, Editör, Hakem, Yazar)
- Güvenli kimlik doğrulama ve yetkilendirme
- Profil yönetimi ve bilgi güncelleme
- Şifre sıfırlama ve hesap aktivasyonu

### Bildiri Yönetimi
- Bildiri gönderimi ve düzenleme
- Hakem değerlendirme sistemi
- Revizyon takibi ve geçmişi
- Otomatik bildirim sistemi

### Program Yönetimi
- Dinamik program oluşturma
- Konuşmacı yönetimi
- Oturum planlaması
- Program PDF çıktısı

### Admin Paneli
- Kullanıcı yönetimi
- Bildiri durumu takibi
- Hakem atama ve yönetimi
- İstatistik ve raporlama

## 🛠️ Teknolojiler

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Kütüphanesi**: React 18
- **Stil**: Tailwind CSS
- **State Yönetimi**: React Context API
- **Form Yönetimi**: React Hook Form
- **API İstekleri**: Axios
- **Bildirimler**: React Hot Toast
- **İkonlar**: React Icons, Heroicons

### Backend
- **Framework**: Next.js API Routes
- **Veritabanı**: MySQL
- **ORM**: Prisma
- **Kimlik Doğrulama**: NextAuth.js, JWT
- **Dosya Yükleme**: Next.js API Routes
- **Email**: Resend

## 📋 Gereksinimler

- Node.js (v18 veya üzeri)
- npm veya yarn
- MySQL

## 🚀 Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/yourusername/sempozyum.git
   cd sempozyum
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Ortam değişkenlerini ayarlayın:
   ```bash
   cp .env.example .env
   ```
   `.env` dosyasını düzenleyerek gerekli değişkenleri ayarlayın:
   - `DATABASE_URL`: MySQL bağlantı URL'i
   - `NEXTAUTH_SECRET`: NextAuth.js için güvenlik anahtarı
   - `NEXTAUTH_URL`: Uygulama URL'i
   - `RESEND_API_KEY`: Resend API anahtarı
   - `EMAIL_FROM`: E-posta gönderici adresi

4. Veritabanı şemasını oluşturun:
   ```bash
   npx prisma db push
   ```

5. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## 📁 Proje Yapısı

```
sempozyum/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Admin paneli sayfaları
│   │   ├── (auth)/            # Kimlik doğrulama sayfaları
│   │   └── api/               # API route'ları
│   │
│   ├── components/            # React bileşenleri
│   │   ├── admin/            # Admin paneli bileşenleri
│   │   ├── auth/             # Kimlik doğrulama bileşenleri
│   │   └── shared/           # Paylaşılan bileşenler
│   │
│   ├── lib/                   # Yardımcı fonksiyonlar ve servisler
│   │   ├── api/              # API istemcileri
│   │   ├── context/          # React context'leri
│   │   └── services/         # Servis fonksiyonları
│   │
│   └── styles/               # Global stiller
│
├── prisma/                    # Veritabanı şeması
├── public/                    # Statik dosyalar
└── ...
```

## 🔧 Geliştirme

### Kod Kalitesi
- ESLint ve Prettier ile kod formatlaması
- TypeScript tip kontrolü
- Husky ile pre-commit kontrolleri

### Test
```bash
# Unit testleri çalıştır
npm run test

# E2E testleri çalıştır
npm run test:e2e
```

## 📝 API Dokümantasyonu

API endpoint'leri `/api` dizini altında bulunmaktadır. Her endpoint için detaylı açıklamalar ve örnek kullanımlar ilgili route dosyalarında yer almaktadır.

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

Proje Sahibi - [@yourusername](https://github.com/yourusername)

Proje Linki: [https://github.com/yourusername/sempozyum](https://github.com/yourusername/sempozyum)

## Supabase ve Vercel ile Kurulum

### Supabase Kurulumu

1. [Supabase](https://supabase.com/) adresine gidin ve bir hesap oluşturun.
2. Yeni bir proje oluşturun ve bir veritabanı şifresi belirleyin.
3. Projenin URL ve API anahtarlarını not alın (Settings > API sekmesinde bulunur).
4. Projenin Supabase üzerindeki PostgreSQL bağlantı URL'sini not alın (Settings > Database sekmesinde bulunur).

### Lokal Geliştirme için Ayarlar

1. Projenin kök dizininde `.env.local` dosyası oluşturun ve aşağıdaki bilgileri ekleyin:

```
# Supabase bağlantı bilgileri
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase veritabanı URL'si
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Next Auth ayarları
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Vercel ortamı için temel URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

2. Veritabanı şemasını Supabase projenize yükleyin:

```bash
npm run deploy-db
```

### Vercel'e Deployment

1. [Vercel](https://vercel.com/) adresine gidin ve bir hesap oluşturun.
2. GitHub projenizi Vercel ile bağlayın.
3. Vercel'de aşağıdaki ortam değişkenlerini ayarlayın:

   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase projenizin URL'si
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase projenizin anonim API anahtarı
   - `DATABASE_URL`: Supabase PostgreSQL bağlantı URL'si
   - `NEXTAUTH_URL`: Vercel uygulamanızın URL'si (örn. https://your-app.vercel.app)
   - `NEXTAUTH_SECRET`: NextAuth için güvenli bir rastgele dize
   - `NEXT_PUBLIC_BASE_URL`: Vercel uygulamanızın URL'si

4. Deploy işlemini başlatın. Vercel otomatik olarak `vercel-build` komutunu çalıştıracak ve veritabanı şemanızı Supabase'e yükleyecektir.

## Önemli Notlar

- Supabase Storage kullanıyorsanız, her dosya yükleme işlemi için uygun bucket'ı oluşturmalısınız.
- Supabase'de veritabanı şemasını güncellemek için her zaman `npm run deploy-db` komutunu kullanın.
- Vercel'de ortam değişkenlerini güncelledikten sonra yeniden deploy yapmanız gerekebilir. 