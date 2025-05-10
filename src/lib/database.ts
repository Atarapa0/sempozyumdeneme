// Merkezi veri deposu - Veritabanı simülasyonu
// Bu dosya, gerçek bir veritabanı yerine kullanılacak simüle edilmiş verileri içerir
// Gerçek uygulamada bu veriler veritabanından çekilecektir

// Sempozyum genel bilgileri
export interface SymposiumInfo {
  id: string;
  title: string;
  subtitle: string;
  dates: string;
  countdownDate: string; // ISO formatında tarih
  description: string; // Kısa açıklama
  longDescription: string; // Uzun açıklama
  venue: string;
  organizer: string;
  year: number;
  isActive: boolean;
  docentlikInfo: string; // Doçentlik bilgisi
  createdAt: string;
  updatedAt: string;
}

// Önemli tarihler
export interface ImportantDate {
  id: string;
  title: string;
  date: string; // ISO formatında tarih
  isCompleted: boolean;
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
}

// Ana konular
export interface MainTopic {
  id: string;
  title: string;
  description: string;
  icon?: string; // Font Awesome veya başka bir ikon kütüphanesi için ikon adı
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
}

// Sponsorlar
export interface Sponsor {
  id: string;
  name: string;
  logo: string; // Logo URL'si
  website: string;
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
}

// Journal (Dergi) modeli - Genel dergiler için
export interface Journal {
  id: string;
  name: string;
  url: string;
  title: string;
  description: string;
  publishDate: string;
  pdfUrl: string;
  symposiumId: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

// PublicationJournal (Yayın İmkanları Dergileri) modeli
export interface PublicationJournal {
  id: string;
  name: string;
  url: string;
  indexType: string; // 'SSCI', 'ESCI', 'Scopus' gibi
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
}

// 11111111111"""""""""""Sayfa içeriği modeli (Yayınlama İmkanları sayfası için)
export interface PageContent {
  id: string;
  pageKey: string; // 'publication-opportunities', 'journals', vb.
  title: string;
  content: string;
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
}

// Bildiriler
export interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  keywords: string[];
  status: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'revision_requested';
  submissionDate: string;
  lastUpdateDate: string;
  presentationType: 'oral' | 'poster';
  paperTopicId: string; // Bildiri konusu ID'si
  mainTopicId: string; // Ana konu ID'si
  reviewers?: string[];
  reviews?: {
    reviewerId: string;
    comment: string;
    score: number;
    date: string;
  }[];
  fileUrl?: string;
  symposiumId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Bildiri konuları
export interface PaperTopic {
  id: string;
  title: string;
  description: string;
  mainTopicId: string; // Ana konu ile ilişkilendirme
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
}

// Program öğeleri
export interface ProgramItem {
  id: string;
  day: string; // "1", "2", "3" gibi gün numarası veya "2024-06-15" gibi tarih
  startTime: string; // "09:00" gibi
  endTime: string; // "10:30" gibi
  title: string;
  speaker?: string;
  location: string;
  type: 'opening' | 'keynote' | 'session' | 'break' | 'social' | 'closing';
  description?: string;
  sessionChair?: string;
  papers?: {
    id: string;
    title: string;
    authors: string[];
    time: string;
  }[];
  symposiumId: string;
  createdAt: string;
  updatedAt: string;
}

// Announcement type
export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Boş veri yapıları - API entegrasyonu için
export const symposiumData: SymposiumInfo = {
  id: "",
  title: "",
  subtitle: "",
  dates: "",
  countdownDate: "",
  description: "",
  longDescription: "",
  venue: "",
  organizer: "",
  year: 0,
  isActive: false,
  docentlikInfo: "",
  createdAt: "",
  updatedAt: ""
};

export const importantDates: ImportantDate[] = [];
export const mainTopics: MainTopic[] = [];
export const sponsors: Sponsor[] = [];
export const papers: Paper[] = [];
export const paperTopics: PaperTopic[] = [];

// Simüle edilmiş veriler
/*
export const symposiumData: SymposiumInfo = {
  id: "sym2025",
  title: "AMASYA ÜNİVERSİTESİ MÜHENDİSLİK BİLİMLERİ SEMPOZYUMU 2025",
  subtitle: "Mühendislik Alanında Yenilikçi Yaklaşımlar ve Sürdürülebilir Çözümler",
  dates: "16-17 Mayıs, 2025",
  countdownDate: "2025-05-16T09:00:00.000Z",
  description: "Amasya Üniversitesi Mühendislik Bilimleri Sempozyumu, mühendislik alanındaki son gelişmeleri, yenilikçi araştırmaları ve sürdürülebilir çözümleri tartışmak üzere akademisyenleri, araştırmacıları ve sektör profesyonellerini bir araya getiren prestijli bir akademik etkinliktir.",
  longDescription: "2025 Sempozyumu, yapay zeka, endüstri 4.0, yenilenebilir enerji, akıllı sistemler ve sürdürülebilir teknolojiler gibi güncel konulara odaklanacaktır. Etkinlik, mühendislik alanındaki yeni fikirlerin paylaşılması ve işbirliklerinin geliştirilmesi için ideal bir platform sunmaktadır.",
  venue: "Amasya Üniversitesi Kongre Merkezi",
  organizer: "Amasya Üniversitesi Mühendislik Fakültesi",
  year: 2025,
  isActive: true,
  docentlikInfo: "Sempozyum Düzenleme Kurulu Üyeleri, Amasya Üniversitesi Rektörlüğü tarafından resmi olarak görevlendirilmiştir. Bu nedenle, Sempozyum 2024 yılı Doçentlik Başvuru Kriterlerini sağlamaktadır. Görevlendirme belgesine \"Bildiri Gönder\" sekmesinden erişebilirsiniz.",
  createdAt: "2024-01-15T10:00:00.000Z",
  updatedAt: "2024-01-15T10:00:00.000Z"
};

export const importantDates: ImportantDate[] = [
  {
    id: "date1",
    title: "Bildiri Özeti Son Gönderim Tarihi",
    date: "2025-02-15T23:59:59.000Z",
    isCompleted: false,
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "date2",
    title: "Bildiri Özeti Kabul Bildirimi",
    date: "2025-03-01T23:59:59.000Z",
    isCompleted: false,
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "date3",
    title: "Tam Metin Bildiri Son Gönderim Tarihi",
    date: "2025-04-01T23:59:59.000Z",
    isCompleted: false,
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "date4",
    title: "Tam Metin Bildiri Kabul Bildirimi",
    date: "2025-04-15T23:59:59.000Z",
    isCompleted: false,
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "date5",
    title: "Kayıt Son Tarihi",
    date: "2025-05-01T23:59:59.000Z",
    isCompleted: false,
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "date6",
    title: "Sempozyum Tarihi",
    date: "2025-05-16T09:00:00.000Z",
    isCompleted: false,
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  }
];

export const mainTopics: MainTopic[] = [
  {
    id: "topic1",
    title: "Yapay Zeka ve Makine Öğrenmesi",
    description: "Mühendislik alanında yapay zeka ve makine öğrenmesi uygulamaları",
    icon: "robot",
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "topic2",
    title: "Endüstri 4.0",
    description: "Akıllı üretim, nesnelerin interneti ve siber-fiziksel sistemler",
    icon: "industry",
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "topic3",
    title: "Yenilenebilir Enerji",
    description: "Sürdürülebilir enerji kaynakları ve verimli enerji sistemleri",
    icon: "solar-panel",
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "topic4",
    title: "Akıllı Şehirler ve Ulaşım",
    description: "Akıllı şehir teknolojileri ve sürdürülebilir ulaşım çözümleri",
    icon: "city",
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "topic5",
    title: "Biyomedikal Mühendisliği",
    description: "Tıbbi cihazlar, biyosensörler ve sağlık teknolojileri",
    icon: "heartbeat",
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "topic6",
    title: "Malzeme Bilimi ve Nanoteknoloji",
    description: "Yeni nesil malzemeler ve nanoteknoloji uygulamaları",
    icon: "atom",
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  }
];

export const sponsors: Sponsor[] = [
  {
    id: "sponsor1",
    name: "Amasya Belediyesi",
    logo: "/images/sponsors/amasya-belediyesi.png",
    website: "https://www.amasya.bel.tr",
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "sponsor2",
    name: "TÜBİTAK",
    logo: "/images/sponsors/tubitak.png",
    website: "https://www.tubitak.gov.tr",
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "sponsor3",
    name: "Türk Mühendis ve Mimar Odaları Birliği",
    logo: "/images/sponsors/tmmob.png",
    website: "https://www.tmmob.org.tr",
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "sponsor4",
    name: "Amasya Teknoloji Geliştirme Bölgesi",
    logo: "/images/sponsors/amasya-teknopark.png",
    website: "https://www.amasyateknopark.com",
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  }
];

// Simüle edilmiş bildiriler
export const papers: Paper[] = [
  {
    id: "paper1",
    title: "Yapay Zeka Destekli Endüstriyel Otomasyon Sistemleri",
    abstract: "Bu çalışmada, endüstriyel otomasyon sistemlerinde yapay zeka uygulamaları incelenmiştir...",
    authors: ["Ahmet Yılmaz", "Mehmet Demir"],
    keywords: ["yapay zeka", "endüstriyel otomasyon", "makine öğrenmesi"],
    status: "accepted",
    submissionDate: "2024-01-10T10:00:00.000Z",
    lastUpdateDate: "2024-01-15T10:00:00.000Z",
    presentationType: "oral",
    paperTopicId: "topic1",
    mainTopicId: "topic1",
    reviewers: ["reviewer1", "reviewer2"],
    reviews: [
      {
        reviewerId: "reviewer1",
        comment: "Çalışma çok başarılı ve güncel.",
        score: 4,
        date: "2024-01-12T10:00:00.000Z"
      },
      {
        reviewerId: "reviewer2",
        comment: "Metodoloji iyi açıklanmış.",
        score: 5,
        date: "2024-01-13T10:00:00.000Z"
      }
    ],
    fileUrl: "/papers/paper1.pdf",
    symposiumId: "sym2025",
    userId: "user1",
    createdAt: "2024-01-10T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paper2",
    title: "Yenilenebilir Enerji Kaynaklarının Entegrasyonunda Optimizasyon Algoritmaları",
    abstract: "Bu çalışmada, yenilenebilir enerji kaynaklarının şebeke entegrasyonunda kullanılan optimizasyon algoritmaları karşılaştırılmıştır. Genetik algoritma, parçacık sürü optimizasyonu ve diferansiyel evrim algoritmalarının performansları analiz edilmiştir.",
    authors: ["Zeynep Kaya", "Ali Öztürk", "Ayşe Şahin"],
    keywords: ["yenilenebilir enerji", "optimizasyon", "genetik algoritma", "şebeke entegrasyonu"],
    status: "under_review",
    submissionDate: "2024-02-20T11:15:00.000Z",
    lastUpdateDate: "2024-02-20T11:15:00.000Z",
    presentationType: "oral",
    paperTopicId: "paperTopic5", // Güneş Enerjisi Sistemleri
    mainTopicId: "topic3", // Yenilenebilir Enerji
    reviewers: ["reviewer3", "reviewer4"],
    fileUrl: "/papers/paper2.pdf",
    symposiumId: "sym2025",
    userId: "user2",
    createdAt: "2024-02-20T11:15:00.000Z",
    updatedAt: "2024-02-20T11:15:00.000Z"
  },
  {
    id: "paper3",
    title: "Endüstri 4.0 Kapsamında Akıllı Üretim Sistemleri",
    abstract: "Bu çalışmada, Endüstri 4.0 konsepti çerçevesinde akıllı üretim sistemlerinin tasarımı ve uygulaması incelenmiştir. Nesnelerin interneti, büyük veri analizi ve siber-fiziksel sistemlerin entegrasyonu ele alınmıştır.",
    authors: ["Mustafa Aydın"],
    keywords: ["endüstri 4.0", "akıllı üretim", "nesnelerin interneti", "büyük veri"],
    status: "pending",
    submissionDate: "2024-03-05T09:30:00.000Z",
    lastUpdateDate: "2024-03-05T09:30:00.000Z",
    presentationType: "poster",
    paperTopicId: "paperTopic3", // Akıllı Üretim Sistemleri
    mainTopicId: "topic2", // Endüstri 4.0
    fileUrl: "/papers/paper3.pdf",
    symposiumId: "sym2025",
    userId: "user3",
    createdAt: "2024-03-05T09:30:00.000Z",
    updatedAt: "2024-03-05T09:30:00.000Z"
  },
  {
    id: "paper4",
    title: "Biyomedikal Görüntü İşlemede Derin Öğrenme Yaklaşımları",
    abstract: "Bu çalışmada, biyomedikal görüntülerin işlenmesinde kullanılan derin öğrenme yaklaşımları incelenmiştir. MR, BT ve ultrason görüntülerinin segmentasyonu ve sınıflandırılması için geliştirilen CNN, U-Net ve GAN tabanlı modeller karşılaştırılmıştır.",
    authors: ["Elif Yıldız", "Burak Şen"],
    keywords: ["derin öğrenme", "biyomedikal görüntüleme", "CNN", "segmentasyon"],
    status: "revision_requested",
    submissionDate: "2024-02-15T16:45:00.000Z",
    lastUpdateDate: "2024-03-10T13:20:00.000Z",
    presentationType: "oral",
    paperTopicId: "paperTopic9", // Tıbbi Görüntüleme
    mainTopicId: "topic5", // Biyomedikal Mühendisliği
    reviewers: ["reviewer1", "reviewer3"],
    reviews: [
      {
        reviewerId: "reviewer1",
        comment: "Metodoloji kısmı detaylı açıklanmış, ancak sonuçların karşılaştırılması için daha fazla nicel analiz gerekli.",
        score: 6,
        date: "2024-03-01T11:30:00.000Z"
      },
      {
        reviewerId: "reviewer3",
        comment: "Literatür taraması kapsamlı, ancak önerilen modelin özgünlüğü yeterince vurgulanmamış. Revizyon gerekli.",
        score: 5,
        date: "2024-03-02T09:45:00.000Z"
      }
    ],
    fileUrl: "/papers/paper4.pdf",
    symposiumId: "sym2025",
    userId: "user4",
    createdAt: "2024-02-15T16:45:00.000Z",
    updatedAt: "2024-03-10T13:20:00.000Z"
  },
  {
    id: "paper5",
    title: "Nanoteknoloji Tabanlı Yeni Nesil Güneş Pilleri",
    abstract: "Bu çalışmada, nanoteknoloji kullanılarak geliştirilen yeni nesil güneş pillerinin verimliliği ve maliyet etkinliği incelenmiştir. Kuantum nokta, perovskit ve organik güneş pillerinin performansları karşılaştırılmıştır.",
    authors: ["Deniz Yılmaz", "Canan Kara"],
    keywords: ["nanoteknoloji", "güneş pilleri", "kuantum nokta", "perovskit"],
    status: "rejected",
    submissionDate: "2024-02-25T10:00:00.000Z",
    lastUpdateDate: "2024-03-20T15:30:00.000Z",
    presentationType: "poster",
    paperTopicId: "paperTopic11", // Nanomateryaller
    mainTopicId: "topic6", // Malzeme Bilimi ve Nanoteknoloji
    reviewers: ["reviewer2", "reviewer4"],
    reviews: [
      {
        reviewerId: "reviewer2",
        comment: "Çalışma kapsamı sınırlı ve literatürdeki benzer çalışmalardan yeterince farklılaşmıyor.",
        score: 3,
        date: "2024-03-15T14:00:00.000Z"
      },
      {
        reviewerId: "reviewer4",
        comment: "Deneysel sonuçlar yetersiz ve metodoloji açıkça tanımlanmamış.",
        score: 2,
        date: "2024-03-18T11:20:00.000Z"
      }
    ],
    fileUrl: "/papers/paper5.pdf",
    symposiumId: "sym2025",
    userId: "user5",
    createdAt: "2024-02-25T10:00:00.000Z",
    updatedAt: "2024-03-20T15:30:00.000Z"
  }
];

// Simüle edilmiş bildiri konuları
export const paperTopics: PaperTopic[] = [
  {
    id: "topic1",
    title: "Yapay Zeka ve Makine Öğrenmesi",
    description: "Yapay zeka ve makine öğrenmesi uygulamaları",
    mainTopicId: "topic1",
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paperTopic2",
    title: "Doğal Dil İşleme",
    description: "Metin analizi, dil modelleri, duygu analizi ve doğal dil işleme uygulamaları",
    mainTopicId: "topic1", // Yapay Zeka ve Makine Öğrenmesi
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paperTopic3",
    title: "Akıllı Üretim Sistemleri",
    description: "Endüstri 4.0 kapsamında akıllı üretim sistemleri ve otomasyon çözümleri",
    mainTopicId: "topic2", // Endüstri 4.0
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paperTopic4",
    title: "Nesnelerin İnterneti (IoT)",
    description: "IoT cihazları, ağları, protokolleri ve uygulamaları",
    mainTopicId: "topic2", // Endüstri 4.0
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paperTopic5",
    title: "Güneş Enerjisi Sistemleri",
    description: "Fotovoltaik sistemler, güneş enerjisi depolama ve verimlilik çalışmaları",
    mainTopicId: "topic3", // Yenilenebilir Enerji
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paperTopic6",
    title: "Rüzgar Enerjisi Teknolojileri",
    description: "Rüzgar türbinleri, rüzgar çiftlikleri ve rüzgar enerjisi optimizasyonu",
    mainTopicId: "topic3", // Yenilenebilir Enerji
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paperTopic7",
    title: "Akıllı Ulaşım Sistemleri",
    description: "Trafik yönetimi, akıllı araçlar ve toplu taşıma optimizasyonu",
    mainTopicId: "topic4", // Akıllı Şehirler ve Ulaşım
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paperTopic8",
    title: "Akıllı Binalar ve Enerji Verimliliği",
    description: "Akıllı bina teknolojileri, enerji verimliliği ve sürdürülebilir mimari",
    mainTopicId: "topic4", // Akıllı Şehirler ve Ulaşım
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paperTopic9",
    title: "Tıbbi Görüntüleme",
    description: "MR, BT, ultrason ve diğer tıbbi görüntüleme teknolojileri",
    mainTopicId: "topic5", // Biyomedikal Mühendisliği
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paperTopic10",
    title: "Biyosensörler ve Tanı Sistemleri",
    description: "Hastalık tanısı için biyosensörler ve tanı sistemleri",
    mainTopicId: "topic5", // Biyomedikal Mühendisliği
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paperTopic11",
    title: "Nanomateryaller",
    description: "Nanomateryallerin sentezi, karakterizasyonu ve uygulamaları",
    mainTopicId: "topic6", // Malzeme Bilimi ve Nanoteknoloji
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "paperTopic12",
    title: "İleri Kompozit Malzemeler",
    description: "Polimer, metal ve seramik matrisli kompozit malzemeler",
    mainTopicId: "topic6", // Malzeme Bilimi ve Nanoteknoloji
    symposiumId: "sym2025",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z"
  }
];

// Simüle edilmiş program verileri
/*
const programItems: ProgramItem[] = [
  {
    id: '1',
    day: '1',
    startTime: '09:00',
    endTime: '09:30',
    title: 'Açılış Konuşması',
    speaker: 'Prof. Dr. Ahmet Yılmaz',
    location: 'Ana Salon',
    type: 'opening',
    description: 'Sempozyumun açılış konuşması ve hoş geldiniz mesajı.',
    symposiumId: 'sym2025',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    day: '1',
    startTime: '09:30',
    endTime: '10:30',
    title: 'Davetli Konuşmacı: Yapay Zeka ve Geleceği',
    speaker: 'Prof. Dr. Mehmet Demir',
    location: 'Ana Salon',
    type: 'keynote',
    description: 'Yapay zekanın günümüzdeki durumu ve gelecekteki potansiyel etkileri üzerine bir konuşma.',
    symposiumId: 'sym2025',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    day: '1',
    startTime: '10:30',
    endTime: '11:00',
    title: 'Kahve Molası',
    location: 'Fuaye Alanı',
    type: 'break',
    symposiumId: 'sym2025',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    day: '1',
    startTime: '11:00',
    endTime: '12:30',
    title: 'Oturum 1: Yapay Zeka Uygulamaları',
    location: 'Salon A',
    type: 'session',
    sessionChair: 'Doç. Dr. Ayşe Kaya',
    papers: [
      {
        id: 'p1',
        title: 'Derin Öğrenme ile Tıbbi Görüntü Analizi',
        authors: ['Dr. Ali Can', 'Dr. Zeynep Yılmaz'],
        time: '11:00-11:20'
      },
      {
        id: 'p2',
        title: 'Doğal Dil İşleme Teknikleri ile Duygu Analizi',
        authors: ['Arş. Gör. Burak Şahin'],
        time: '11:20-11:40'
      },
      {
        id: 'p3',
        title: 'Akıllı Şehirlerde Yapay Zeka Uygulamaları',
        authors: ['Prof. Dr. Canan Aydın', 'Dr. Deniz Yıldız'],
        time: '11:40-12:00'
      },
      {
        id: 'p4',
        title: 'Soru-Cevap Oturumu',
        authors: [],
        time: '12:00-12:30'
      }
    ],
    symposiumId: 'sym2025',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    day: '1',
    startTime: '12:30',
    endTime: '14:00',
    title: 'Öğle Yemeği',
    location: 'Yemekhane',
    type: 'break',
    symposiumId: 'sym2025',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    day: '2',
    startTime: '09:00',
    endTime: '10:30',
    title: 'Davetli Konuşmacı: Siber Güvenlik Trendleri',
    speaker: 'Prof. Dr. Jale Yılmaz',
    location: 'Ana Salon',
    type: 'keynote',
    description: 'Günümüzde siber güvenlik alanındaki son gelişmeler ve gelecek trendleri.',
    symposiumId: 'sym2025',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    day: '2',
    startTime: '10:30',
    endTime: '11:00',
    title: 'Kahve Molası',
    location: 'Fuaye Alanı',
    type: 'break',
    symposiumId: 'sym2025',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '8',
    day: '3',
    startTime: '15:30',
    endTime: '16:00',
    title: 'Kapanış Konuşması',
    speaker: 'Prof. Dr. Ahmet Yılmaz',
    location: 'Ana Salon',
    type: 'closing',
    description: 'Sempozyumun değerlendirilmesi ve kapanış konuşması.',
    symposiumId: 'sym2025',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
*/
// API'ye bağlanmak için boş array kullanıyoruz
const programItems: ProgramItem[] = [];

// Dergi verileri - Genel dergiler
/*
const journals: Journal[] = [
  {
    id: '1',
    name: 'Engineering Science Journal',
    url: 'https://example.com/esj',
    title: 'Engineering Science Journal',
    description: 'A comprehensive journal covering all aspects of engineering science',
    publishDate: '2024-01-01',
    pdfUrl: '/pdfs/esj.pdf',
    coverImage: '/images/journals/esj.jpg',
    symposiumId: 'sym2025',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: '2',
    name: 'Advanced Engineering Research',
    url: 'https://example.com/aer',
    title: 'Advanced Engineering Research',
    description: 'Latest developments in engineering research',
    publishDate: '2024-01-01',
    pdfUrl: '/pdfs/aer.pdf',
    coverImage: '/images/journals/aer.jpg',
    symposiumId: 'sym2025',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  }
];
*/

// API'ye bağlanmak için boş array kullanıyoruz
const journals: Journal[] = [];

// Yayın imkanları dergileri
const publicationJournals: PublicationJournal[] = [
  {
    id: '1',
    name: 'International Journal of Engineering Innovation',
    url: 'https://example.com/ijei',
    indexType: 'SSCI',
    symposiumId: 'sym2025',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: '2',
    name: 'Journal of Advanced Technology',
    url: 'https://example.com/jat',
    indexType: 'ESCI',
    symposiumId: 'sym2025',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: '3',
    name: 'Engineering Science and Applications',
    url: 'https://example.com/esa',
    indexType: 'Scopus',
    symposiumId: 'sym2025',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  }
];

// Örnek sayfa içerikleri
const pageContents: PageContent[] = [
  {
    id: 'home',
    pageKey: 'home',
    title: 'Ana Sayfa',
    content: `
      // ... existing home page content ...
    `,
    symposiumId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    pageKey: 'publication-opportunities',
    title: 'Yayınlama İmkanları',
    content: `
      <h2>Bildiri Yayınlama Süreci</h2>
      <p>Sempozyumda sunulan ve hakem değerlendirmesinden geçen bildiriler, aşağıdaki yayın imkanlarından faydalanabilirler:</p>
      <ul>
        <li>Sempozyum Bildiri Kitabı (ISBN numaralı)</li>
        <li>Seçilen bildiriler için özel dergi sayıları</li>
        <li>Uluslararası indekslerde taranan dergilerde yayınlanma fırsatı</li>
      </ul>
      
      <h2>Dergi Önerileri</h2>
      <p>Sempozyumumuzda sunulan bildiriler, aşağıdaki dergilerde yayınlanma imkanına sahiptir:</p>
      <ol>
        <li>
          <strong>Journal of Scientific Research</strong>
          <p>ESCI, Scopus indeksli</p>
          <p>Etki Faktörü: 2.3</p>
        </li>
        <li>
          <strong>International Journal of Technology and Innovation</strong>
          <p>SSCI indeksli</p>
          <p>Etki Faktörü: 3.1</p>
        </li>
        <li>
          <strong>Academic Research Quarterly</strong>
          <p>ESCI indeksli</p>
          <p>Etki Faktörü: 1.8</p>
        </li>
      </ol>
    `,
    symposiumId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    pageKey: 'journals',
    title: 'Dergiler',
    content: `
      <p>Sempozyumumuz kapsamında yayınlanan dergiler ve özel sayılar hakkında bilgilere bu sayfadan ulaşabilirsiniz.</p>
      <p>Dergilerimiz, akademik çalışmaların geniş kitlelere ulaşmasını sağlamak amacıyla hem basılı hem de dijital formatta yayınlanmaktadır.</p>
    `,
    symposiumId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Sample announcements data
let announcements: Announcement[] = [
  {
    id: '1',
    title: 'Sempozyum Tarihi Açıklandı',
    content: 'MÜBES 2025 sempozyumu 15-17 Eylül 2025 tarihleri arasında gerçekleştirilecektir.',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Announcement functions
export async function getAnnouncements(): Promise<Announcement[]> {
  return announcements;
}

export async function addAnnouncement(data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> {
  const newAnnouncement: Announcement = {
    id: Date.now().toString(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  announcements.push(newAnnouncement);
  return newAnnouncement;
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>): Promise<Announcement | null> {
  const index = announcements.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  announcements[index] = {
    ...announcements[index],
    ...data,
    updatedAt: new Date()
  };
  return announcements[index];
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const initialLength = announcements.length;
  announcements = announcements.filter(a => a.id !== id);
  return announcements.length !== initialLength;
}

// Veri erişim fonksiyonları - Gerçek uygulamada API çağrıları olacak
export const getSymposiumInfo = async (): Promise<SymposiumInfo> => {
  // Simüle edilmiş API gecikmesi
  await new Promise(resolve => setTimeout(resolve, 300));
  return symposiumData;
};

export const getImportantDates = async (): Promise<ImportantDate[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return importantDates;
};

// Bu fonksiyonlar API ile entegre edildi, ancak API hatası durumunda kullanılmak üzere tutulacak
export const getMainTopics = async (): Promise<MainTopic[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mainTopics;
};

// Bu fonksiyonlar API ile entegre edildi, ancak API hatası durumunda kullanılmak üzere tutulacak
export const getSponsors = async (): Promise<Sponsor[]> => {
  return sponsors;
};

export const updateSponsor = async (id: string, data: Partial<Sponsor>): Promise<Sponsor> => {
  const index = sponsors.findIndex(sponsor => sponsor.id === id);
  if (index === -1) {
    throw new Error(`Sponsor (ID: ${id}) bulunamadı`);
  }
  
  const updatedSponsor = { ...sponsors[index], ...data, updatedAt: new Date().toISOString() };
  sponsors[index] = updatedSponsor;
  return updatedSponsor;
};

export const addSponsor = async (data: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sponsor> => {
  const now = new Date().toISOString();
  const newSponsor: Sponsor = {
    id: `sponsor_${Date.now()}`,
    ...data,
    createdAt: now,
    updatedAt: now
  };
  
  sponsors.push(newSponsor);
  return newSponsor;
};

export const deleteSponsor = async (id: string): Promise<boolean> => {
  const index = sponsors.findIndex(sponsor => sponsor.id === id);
  if (index === -1) {
    return false;
  }
  
  sponsors.splice(index, 1);
  return true;
};

// Sayfa içerikleri için fonksiyonlar
export const getAllPageContents = async (): Promise<PageContent[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return pageContents;
};

export const addPageContent = async (data: Omit<PageContent, 'id' | 'createdAt' | 'updatedAt'>): Promise<PageContent> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newPage: PageContent = {
    id: `page${pageContents.length + 1}`,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  pageContents.push(newPage);
  return newPage;
};

export const deletePageContent = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = pageContents.findIndex(page => page.id === id);
  if (index === -1) throw new Error("Sayfa içeriği bulunamadı");
  
  pageContents.splice(index, 1);
  return true;
};

// Admin için güncelleme fonksiyonları
export const updateSymposiumInfo = async (data: Partial<SymposiumInfo>): Promise<SymposiumInfo> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  Object.assign(symposiumData, { ...data, updatedAt: new Date().toISOString() });
  return symposiumData;
};

export const updateImportantDate = async (id: string, data: Partial<ImportantDate>): Promise<ImportantDate> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = importantDates.findIndex(date => date.id === id);
  if (index === -1) throw new Error("Tarih bulunamadı");
  
  importantDates[index] = { 
    ...importantDates[index], 
    ...data, 
    updatedAt: new Date().toISOString() 
  };
  
  return importantDates[index];
};

export const addImportantDate = async (data: Omit<ImportantDate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ImportantDate> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newDate: ImportantDate = {
    id: `date${importantDates.length + 1}`,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  importantDates.push(newDate);
  return newDate;
};

export const deleteImportantDate = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = importantDates.findIndex(date => date.id === id);
  if (index === -1) throw new Error("Tarih bulunamadı");
  
  importantDates.splice(index, 1);
  return true;
};

// Ana konular için CRUD işlemleri
export const updateMainTopic = async (id: string, data: Partial<MainTopic>): Promise<MainTopic> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mainTopics.findIndex(topic => topic.id === id);
  if (index === -1) throw new Error("Konu bulunamadı");
  
  mainTopics[index] = { 
    ...mainTopics[index], 
    ...data, 
    updatedAt: new Date().toISOString() 
  };
  
  return mainTopics[index];
};

export const addMainTopic = async (data: Omit<MainTopic, 'id' | 'createdAt' | 'updatedAt'>): Promise<MainTopic> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newTopic: MainTopic = {
    id: `topic${mainTopics.length + 1}`,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mainTopics.push(newTopic);
  return newTopic;
};

export const deleteMainTopic = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mainTopics.findIndex(topic => topic.id === id);
  if (index === -1) throw new Error("Konu bulunamadı");
  
  mainTopics.splice(index, 1);
  return true;
};

// Bildiriler için fonksiyonlar
export const getPapers = async (): Promise<Paper[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return papers;
};

export const getPaperById = async (id: string): Promise<Paper | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const paper = papers.find(p => p.id === id);
  return paper || null;
};

export const getPapersByUserId = async (userId: string): Promise<Paper[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return papers.filter(paper => paper.userId === userId);
};

export const getPapersByTopic = async (topicId: string): Promise<Paper[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return papers.filter(paper => paper.mainTopicId === topicId);
};

export const getPapersByStatus = async (status: Paper['status']): Promise<Paper[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return papers.filter(paper => paper.status === status);
};

export const updatePaper = async (id: string, data: Partial<Paper>): Promise<Paper> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = papers.findIndex(paper => paper.id === id);
  if (index === -1) throw new Error("Bildiri bulunamadı");
  
  papers[index] = { 
    ...papers[index], 
    ...data, 
    updatedAt: new Date().toISOString(),
    lastUpdateDate: new Date().toISOString()
  };
  
  return papers[index];
};

export const addPaper = async (data: Omit<Paper, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdateDate' | 'status'>): Promise<Paper> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newPaper: Paper = {
    id: `paper${papers.length + 1}`,
    ...data,
    status: 'pending',
    lastUpdateDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  papers.push(newPaper);
  return newPaper;
};

export const deletePaper = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = papers.findIndex(paper => paper.id === id);
  if (index === -1) throw new Error("Bildiri bulunamadı");
  
  papers.splice(index, 1);
  return true;
};

export const assignReviewers = async (paperId: string, reviewerIds: string[]): Promise<Paper> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = papers.findIndex(paper => paper.id === paperId);
  if (index === -1) throw new Error("Bildiri bulunamadı");
  
  papers[index] = {
    ...papers[index],
    reviewers: reviewerIds,
    status: 'under_review',
    updatedAt: new Date().toISOString()
  };
  
  return papers[index];
};

export const addReview = async (
  paperId: string, 
  reviewerId: string, 
  comment: string, 
  score: number
): Promise<Paper> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = papers.findIndex(paper => paper.id === paperId);
  if (index === -1) throw new Error("Bildiri bulunamadı");
  
  const review = {
    reviewerId,
    comment,
    score,
    date: new Date().toISOString()
  };
  
  const currentReviews = papers[index].reviews || [];
  
  papers[index] = {
    ...papers[index],
    reviews: [...currentReviews, review],
    updatedAt: new Date().toISOString()
  };
  
  return papers[index];
};

// Bildiri konuları için fonksiyonlar
export const getPaperTopics = async (): Promise<PaperTopic[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return paperTopics;
};

export const getPaperTopicById = async (id: string): Promise<PaperTopic | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const topic = paperTopics.find(t => t.id === id);
  return topic || null;
};

export const getPaperTopicsByMainTopic = async (mainTopicId: string): Promise<PaperTopic[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return paperTopics.filter(topic => topic.mainTopicId === mainTopicId);
};

export const updatePaperTopic = async (id: string, data: Partial<PaperTopic>): Promise<PaperTopic> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = paperTopics.findIndex(topic => topic.id === id);
  if (index === -1) throw new Error("Bildiri konusu bulunamadı");
  
  paperTopics[index] = { 
    ...paperTopics[index], 
    ...data, 
    updatedAt: new Date().toISOString() 
  };
  
  return paperTopics[index];
};

export const addPaperTopic = async (data: Omit<PaperTopic, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaperTopic> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newTopic: PaperTopic = {
    id: `paperTopic${paperTopics.length + 1}`,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  paperTopics.push(newTopic);
  return newTopic;
};

export const deletePaperTopic = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = paperTopics.findIndex(topic => topic.id === id);
  if (index === -1) throw new Error("Bildiri konusu bulunamadı");
  
  // Konuya ait bildiri var mı kontrol et
  const hasPapers = papers.some(paper => paper.paperTopicId === id);
  if (hasPapers) {
    throw new Error("Bu konuya ait bildiriler bulunmaktadır. Önce bildirileri silmelisiniz.");
  }
  
  paperTopics.splice(index, 1);
  return true;
};

// Program öğeleri için CRUD işlemleri
/*
export const getProgramItems = async (): Promise<ProgramItem[]> => {
  // Simüle edilmiş gecikme
  await new Promise(resolve => setTimeout(resolve, 100));
  return programItems;
};

export const getProgramItemById = async (id: string): Promise<ProgramItem | null> => {
  // Simüle edilmiş gecikme
  await new Promise(resolve => setTimeout(resolve, 100));
  const item = programItems.find(item => item.id === id);
  return item || null;
};

export const getProgramItemsByDay = async (day: string): Promise<ProgramItem[]> => {
  // Simüle edilmiş gecikme
  await new Promise(resolve => setTimeout(resolve, 100));
  return programItems.filter(item => item.day === day);
};

export const updateProgramItem = async (id: string, data: Partial<ProgramItem>): Promise<ProgramItem> => {
  // Simüle edilmiş gecikme
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const index = programItems.findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error(`Program öğesi bulunamadı: ${id}`);
  }
  
  const updatedItem = {
    ...programItems[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  programItems[index] = updatedItem;
  return updatedItem;
};

export const addProgramItem = async (data: Omit<ProgramItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProgramItem> => {
  // Simüle edilmiş gecikme
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const newItem: ProgramItem = {
    id: `program_${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  programItems.push(newItem);
  return newItem;
};

export const deleteProgramItem = async (id: string): Promise<boolean> => {
  // Simüle edilmiş gecikme
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const index = programItems.findIndex(item => item.id === id);
  if (index === -1) {
    return false;
  }
  
  programItems.splice(index, 1);
  return true;
};
*/

// API'ye bağlanmış program fonksiyonları
import { 
  getProgramEtkinlikleri, 
  programEtkinligiEkle, 
  programEtkinligiGuncelle, 
  programEtkinligiSil 
} from './services';

export const getProgramItems = async (): Promise<ProgramItem[]> => {
  return await getProgramEtkinlikleri();
};

export const getProgramItemById = async (id: string): Promise<ProgramItem | null> => {
  const items = await getProgramEtkinlikleri();
  const item = items.find(item => item.id === id);
  return item || null;
};

export const getProgramItemsByDay = async (day: string): Promise<ProgramItem[]> => {
  const items = await getProgramEtkinlikleri();
  return items.filter(item => item.day === day);
};

export const updateProgramItem = async (id: string, data: Partial<ProgramItem>): Promise<ProgramItem> => {
  return await programEtkinligiGuncelle(id, data);
};

export const addProgramItem = async (data: Omit<ProgramItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProgramItem> => {
  return await programEtkinligiEkle(data);
};

export const deleteProgramItem = async (id: string): Promise<boolean> => {
  return await programEtkinligiSil(id);
};

// Yayın imkanları dergileri için işlemler
export const getPublicationJournalById = async (id: string): Promise<PublicationJournal | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const journal = publicationJournals.find(j => j.id === id);
  return journal || null;
};

export const addPublicationJournal = async (journal: Omit<PublicationJournal, 'id' | 'createdAt' | 'updatedAt'>): Promise<PublicationJournal> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newJournal: PublicationJournal = {
    ...journal,
    id: (publicationJournals.length + 1).toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  publicationJournals.push(newJournal);
  return newJournal;
};

export const updatePublicationJournal = async (id: string, journalData: Partial<PublicationJournal>): Promise<PublicationJournal | null> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = publicationJournals.findIndex(j => j.id === id);
  if (index === -1) return null;
  
  publicationJournals[index] = {
    ...publicationJournals[index],
    ...journalData,
    updatedAt: new Date().toISOString()
  };
  
  return publicationJournals[index];
};

export const deletePublicationJournal = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = publicationJournals.findIndex(j => j.id === id);
  if (index === -1) return false;
  
  publicationJournals.splice(index, 1);
  return true;
};

// Sayfa içeriği fonksiyonları
export const getPageContent = async (pageKey: string, symposiumId: string = '1'): Promise<PageContent | null> => {
  // Simüle edilmiş API çağrısı
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const content = pageContents.find(p => p.pageKey === pageKey && p.symposiumId === symposiumId);
  return content || null;
};

export const updatePageContent = async (pageKey: string, symposiumId: string, data: Partial<PageContent>): Promise<PageContent | null> => {
  // Simüle edilmiş API çağrısı
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = pageContents.findIndex(p => p.pageKey === pageKey && p.symposiumId === symposiumId);
  
  if (index === -1) {
    // Eğer sayfa içeriği yoksa yeni oluştur
    const newContent: PageContent = {
      id: (pageContents.length + 1).toString(),
      pageKey,
      title: data.title || pageKey,
      content: data.content || '',
      symposiumId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    pageContents.push(newContent);
    return newContent;
  }
  
  // Varolan içeriği güncelle
  pageContents[index] = {
    ...pageContents[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  return pageContents[index];
};

// Benzer CRUD işlemleri diğer veri tipleri için de eklenebilir
// updateMainTopic, addMainTopic, deleteMainTopic
// updateSponsor, addSponsor, deleteSponsor 