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