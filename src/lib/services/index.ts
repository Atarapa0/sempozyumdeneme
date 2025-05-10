// Tüm servisleri export eden ana dosya
import { apiClient } from './api.client';
import { authService } from './auth.service';
import { sempozyumService } from './sempozyum.service';
import { getAktifGenelBilgiler, updateGenelBilgiler, createGenelBilgiler, saveGenelBilgiler } from './genel-bilgiler.service';
import { getAktifOnemliTarihler, updateOnemliTarih, createOnemliTarih, deleteOnemliTarih } from './onemli-tarihler.service';
import { getAktifAnaKonular, updateAnaKonu, createAnaKonu, deleteAnaKonu } from './ana-konu.service';
import { getAktifSponsorlar, updateSponsorAPI, createSponsorAPI, deleteSponsorAPI } from './sponsor.service';
import { getBildiriKonulari, getBildiriKonulariByAnaKonu, updateBildiriKonusu, createBildiriKonusu, deleteBildiriKonusu } from './bildiri-konusu.service';
import { getKomiteUyeleri, getKomiteUyeleriBySymposium, createKomiteUyesi, updateKomiteUyesi, deleteKomiteUyesi, KomiteUyesi, KomiteUyesiEkle, KomiteUyesiGuncelle } from './komite.service';
import { getProgramEtkinlikleri, programEtkinligiEkle, programEtkinligiGuncelle, programEtkinligiSil } from './program.service';
import { revizeService } from './revize.service';

// Diğer servisler buraya eklenecek
// import { announcementsService } from './announcements.service';
import { bildiriService } from './bildiri.service';
import { userService } from './user.service';

// API ve Auth servislerini export ediyoruz
export { apiClient, authService };

// Sempozyum servisini export ediyoruz
export { sempozyumService };

// Genel Bilgiler servisini export ediyoruz
export { getAktifGenelBilgiler, updateGenelBilgiler, createGenelBilgiler, saveGenelBilgiler };

// Önemli Tarihler servisini export ediyoruz
export { getAktifOnemliTarihler, updateOnemliTarih, createOnemliTarih, deleteOnemliTarih };

// Ana Konu servisini export ediyoruz
export { getAktifAnaKonular, updateAnaKonu, createAnaKonu, deleteAnaKonu };

// Sponsor servisini export ediyoruz
export { getAktifSponsorlar, updateSponsorAPI, createSponsorAPI, deleteSponsorAPI };

// Bildiri Konusu servisini export ediyoruz
export { getBildiriKonulari, getBildiriKonulariByAnaKonu, updateBildiriKonusu, createBildiriKonusu, deleteBildiriKonusu };

// Komite servisini export ediyoruz
export { getKomiteUyeleri, getKomiteUyeleriBySymposium, createKomiteUyesi, updateKomiteUyesi, deleteKomiteUyesi };

// Program servisini export ediyoruz
export { getProgramEtkinlikleri, programEtkinligiEkle, programEtkinligiGuncelle, programEtkinligiSil };

// Duyurular servisini export ediyoruz
// export { announcementsService };

// Bildiri servisini export ediyoruz
export { bildiriService };

// Kullanıcı servisini export ediyoruz
export { userService };

// Revize servisini export ediyoruz
export { revizeService };

// Type'ları export ediyoruz
export type { KomiteUyesi, KomiteUyesiEkle, KomiteUyesiGuncelle };

// Sempozyum tipini export ediyoruz
export type { Sempozyum } from './sempozyum.service';

// Revize tipini export ediyoruz
export type { Revize } from './revize.service';

// Auth tiplerini export ediyoruz
export type { LoginResponse, LoginError } from './auth.service';

// Bu dosya, tüm servisleri merkezi olarak export etmek için kullanılır
// Geliştirme aşamalı olarak ilerlerken, database.ts'den gerçek API'lere geçişi kolaylaştırır