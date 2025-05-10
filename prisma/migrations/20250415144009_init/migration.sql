-- CreateTable
CREATE TABLE `Rol` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ad` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Rol_ad_key`(`ad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kullanici` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ad` VARCHAR(191) NOT NULL,
    `soyad` VARCHAR(191) NOT NULL,
    `unvan` VARCHAR(191) NOT NULL,
    `universite` VARCHAR(191) NOT NULL,
    `kongreKatilimSekli` VARCHAR(191) NOT NULL,
    `kurum` VARCHAR(191) NOT NULL,
    `fakulte` VARCHAR(191) NULL,
    `bolum` VARCHAR(191) NULL,
    `yazismaAdresi` VARCHAR(191) NULL,
    `kurumTel` VARCHAR(191) NULL,
    `cepTel` VARCHAR(191) NOT NULL,
    `eposta` VARCHAR(191) NOT NULL,
    `sifre` VARCHAR(191) NOT NULL,
    `rolId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Kullanici_eposta_key`(`eposta`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Hakem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ad` VARCHAR(191) NOT NULL,
    `soyad` VARCHAR(191) NOT NULL,
    `eposta` VARCHAR(191) NOT NULL,
    `unvan` VARCHAR(191) NULL,
    `bolum` VARCHAR(191) NULL,
    `kurum` VARCHAR(191) NULL,
    `tel` VARCHAR(191) NULL,
    `sifre` VARCHAR(191) NOT NULL,
    `rolId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Hakem_eposta_key`(`eposta`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sempozyum` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `aktiflik` BOOLEAN NOT NULL DEFAULT true,
    `tarih` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GenelBilgiler` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sempozyumId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `altbaslik` VARCHAR(191) NOT NULL,
    `tariharaligi` VARCHAR(191) NOT NULL,
    `geriSayimBitimTarihi` DATETIME(3) NOT NULL,
    `yer` VARCHAR(191) NOT NULL,
    `organizator` VARCHAR(191) NOT NULL,
    `kisaaciklama` TEXT NOT NULL,
    `uzunaciklama` TEXT NOT NULL,
    `docentlikbilgisi` TEXT NULL,
    `yil` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OnemliTarihler` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sempozyumId` INTEGER NOT NULL,
    `baslik` VARCHAR(191) NOT NULL,
    `tarih` DATETIME(3) NOT NULL,
    `durum` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnaKonu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sempozyumId` INTEGER NOT NULL,
    `baslik` VARCHAR(191) NOT NULL,
    `aciklama` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sponsor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sempozyumId` INTEGER NOT NULL,
    `ad` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dergi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sempozyumId` INTEGER NOT NULL,
    `ad` VARCHAR(191) NOT NULL,
    `aciklama` VARCHAR(191) NOT NULL,
    `yayinTarihi` DATETIME(3) NOT NULL,
    `kapakGorselUrl` VARCHAR(191) NULL,
    `pdfDosya` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Komite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sempozyumId` INTEGER NOT NULL,
    `unvan` VARCHAR(191) NULL,
    `ad` VARCHAR(191) NOT NULL,
    `soyad` VARCHAR(191) NOT NULL,
    `kurum` VARCHAR(191) NULL,
    `komiteTur` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Program` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sempozyumId` INTEGER NOT NULL,
    `gun` VARCHAR(191) NOT NULL,
    `basTarih` VARCHAR(191) NOT NULL,
    `bitTarih` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `konusmaci` VARCHAR(191) NULL,
    `lokasyon` VARCHAR(191) NOT NULL,
    `tip` VARCHAR(191) NOT NULL,
    `aciklama` TEXT NULL,
    `oturumBaskani` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BildiriKonusu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sempozyumId` INTEGER NOT NULL,
    `anaKonuId` INTEGER NOT NULL,
    `baslik` VARCHAR(191) NOT NULL,
    `aciklama` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bildiri` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sempozyumId` INTEGER NOT NULL,
    `baslik` VARCHAR(191) NOT NULL,
    `baslikEn` VARCHAR(191) NOT NULL,
    `ozet` TEXT NOT NULL,
    `ozetEn` TEXT NOT NULL,
    `yazarlar` JSON NOT NULL,
    `anahtarKelimeler` JSON NOT NULL,
    `anahtarKelimelerEn` JSON NOT NULL,
    `sunumTipi` VARCHAR(191) NOT NULL,
    `sunumYeri` VARCHAR(191) NULL,
    `kongreyeMesaj` TEXT NULL,
    `intihalPosterDosya` VARCHAR(191) NULL,
    `anaKonuId` INTEGER NOT NULL,
    `bildiriKonusuId` INTEGER NOT NULL,
    `dokuman` VARCHAR(191) NULL,
    `kullaniciId` INTEGER NOT NULL,
    `durum` VARCHAR(191) NOT NULL DEFAULT 'beklemede',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Revize` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sempozyumId` INTEGER NOT NULL,
    `durum` VARCHAR(191) NOT NULL,
    `bildiriId` INTEGER NOT NULL,
    `gucluYonler` TEXT NULL,
    `zayifYonler` TEXT NULL,
    `genelYorum` TEXT NULL,
    `guvenSeviyesi` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_HakemRevize` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_HakemRevize_AB_unique`(`A`, `B`),
    INDEX `_HakemRevize_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Kullanici` ADD CONSTRAINT `Kullanici_rolId_fkey` FOREIGN KEY (`rolId`) REFERENCES `Rol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hakem` ADD CONSTRAINT `Hakem_rolId_fkey` FOREIGN KEY (`rolId`) REFERENCES `Rol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GenelBilgiler` ADD CONSTRAINT `GenelBilgiler_sempozyumId_fkey` FOREIGN KEY (`sempozyumId`) REFERENCES `Sempozyum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OnemliTarihler` ADD CONSTRAINT `OnemliTarihler_sempozyumId_fkey` FOREIGN KEY (`sempozyumId`) REFERENCES `Sempozyum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnaKonu` ADD CONSTRAINT `AnaKonu_sempozyumId_fkey` FOREIGN KEY (`sempozyumId`) REFERENCES `Sempozyum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sponsor` ADD CONSTRAINT `Sponsor_sempozyumId_fkey` FOREIGN KEY (`sempozyumId`) REFERENCES `Sempozyum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dergi` ADD CONSTRAINT `Dergi_sempozyumId_fkey` FOREIGN KEY (`sempozyumId`) REFERENCES `Sempozyum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Komite` ADD CONSTRAINT `Komite_sempozyumId_fkey` FOREIGN KEY (`sempozyumId`) REFERENCES `Sempozyum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Program` ADD CONSTRAINT `Program_sempozyumId_fkey` FOREIGN KEY (`sempozyumId`) REFERENCES `Sempozyum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BildiriKonusu` ADD CONSTRAINT `BildiriKonusu_sempozyumId_fkey` FOREIGN KEY (`sempozyumId`) REFERENCES `Sempozyum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BildiriKonusu` ADD CONSTRAINT `BildiriKonusu_anaKonuId_fkey` FOREIGN KEY (`anaKonuId`) REFERENCES `AnaKonu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bildiri` ADD CONSTRAINT `Bildiri_sempozyumId_fkey` FOREIGN KEY (`sempozyumId`) REFERENCES `Sempozyum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bildiri` ADD CONSTRAINT `Bildiri_anaKonuId_fkey` FOREIGN KEY (`anaKonuId`) REFERENCES `AnaKonu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bildiri` ADD CONSTRAINT `Bildiri_bildiriKonusuId_fkey` FOREIGN KEY (`bildiriKonusuId`) REFERENCES `BildiriKonusu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bildiri` ADD CONSTRAINT `Bildiri_kullaniciId_fkey` FOREIGN KEY (`kullaniciId`) REFERENCES `Kullanici`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Revize` ADD CONSTRAINT `Revize_sempozyumId_fkey` FOREIGN KEY (`sempozyumId`) REFERENCES `Sempozyum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Revize` ADD CONSTRAINT `Revize_bildiriId_fkey` FOREIGN KEY (`bildiriId`) REFERENCES `Bildiri`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_HakemRevize` ADD CONSTRAINT `_HakemRevize_A_fkey` FOREIGN KEY (`A`) REFERENCES `Hakem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_HakemRevize` ADD CONSTRAINT `_HakemRevize_B_fkey` FOREIGN KEY (`B`) REFERENCES `Revize`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
