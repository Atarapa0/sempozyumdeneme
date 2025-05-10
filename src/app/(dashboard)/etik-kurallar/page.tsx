'use client';

import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function EtikKurallarPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Üst Başlık */}
        <div className="flex items-center mb-8">
          <Link 
            href="/" 
            className="flex items-center text-gray-600 hover:text-yellow-600 transition-colors mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> Ana Sayfaya Dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Etik Kurallar</h1>
        </div>

        {/* Ana İçerik */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Sempozyum Etik Kuralları</h2>
          
          <div className="prose max-w-none">
            <p className="mb-4 text-gray-700">
              Sempozyum sürecinde, akademik dürüstlük ve bilimsel etik ilkelere bağlılık temel değerimizdir. Tüm katılımcıların, yazarların, hakemlerin ve düzenleme kurulu üyelerinin aşağıdaki etik kurallara uyması beklenmektedir.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">Yazarlar İçin Etik Kurallar</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Özgünlük:</strong> Bildiriler özgün, daha önce başka bir yerde yayınlanmamış ve aynı anda başka bir yere değerlendirme için gönderilmemiş çalışmalar olmalıdır.</li>
              <li><strong>İntihal:</strong> Bildiriler başkalarının çalışmalarından yapılan alıntılarda uygun şekilde atıf yapılmalı ve hiçbir şekilde intihal içermemelidir.</li>
              <li><strong>Veri Bütünlüğü:</strong> Araştırma verileri doğru ve eksiksiz olarak sunulmalıdır. Verilerin manipülasyonu veya seçici kullanımı kabul edilemez.</li>
              <li><strong>Yazarlık:</strong> Bildiri yazarlığı, çalışmaya önemli katkıda bulunan kişilerle sınırlı olmalıdır. Tüm yazarlar, çalışmanın içeriğinden ve doğruluğundan eşit derece sorumludur.</li>
              <li><strong>Etik Onay:</strong> İnsan ve hayvan denekleri içeren araştırmalar için gerekli etik kurul onayları alınmış olmalıdır.</li>
              <li><strong>Çıkar Çatışması:</strong> Yazarlar, çalışmalarında potansiyel çıkar çatışmalarını açıklamalıdır.</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">Hakemler İçin Etik Kurallar</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Gizlilik:</strong> Değerlendirilen bildirilerin içeriği gizli tutulmalı ve başkalarıyla paylaşılmamalıdır.</li>
              <li><strong>Objektiflik:</strong> Değerlendirmeler önyargısız, adil ve tarafsız olmalıdır.</li>
              <li><strong>Zamanında Yanıt:</strong> Hakemler değerlendirme sürecini belirlenen zaman çerçevesinde tamamlamalıdır.</li>
              <li><strong>Yapıcı Eleştiri:</strong> Hakemler, eleştirilerini yapıcı bir şekilde iletmeli, kişisel saldırı veya küçümseyici yorumlardan kaçınmalıdır.</li>
              <li><strong>Çıkar Çatışması:</strong> Hakemler, değerlendirdikleri bildirilerle ilgili herhangi bir çıkar çatışması varsa, bunu bildirmeli ve gerekirse değerlendirme sürecinden çekilmelidir.</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">Düzenleme Kurulu İçin Etik Kurallar</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Tarafsızlık:</strong> Bildiri değerlendirme ve kabul süreçleri adil ve tarafsız olmalıdır.</li>
              <li><strong>Şeffaflık:</strong> Değerlendirme süreci ve kriterleri açık ve şeffaf olmalıdır.</li>
              <li><strong>Gizlilik:</strong> Bildiri içerikleri ve hakem değerlendirmeleri gizli tutulmalıdır.</li>
              <li><strong>Çıkar Çatışması Yönetimi:</strong> Düzenleme kurulu üyelerinin potansiyel çıkar çatışmaları uygun şekilde yönetilmelidir.</li>
              <li><strong>Etik İhlallerle Mücadele:</strong> Etik ihlal iddialarını ciddiye almalı ve uygun şekilde soruşturmalı, gerekli durumlarda yaptırımlar uygulanmalıdır.</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">İntihal ve Etik İhlaller</h3>
            <p className="mb-4 text-gray-700">
              İntihal ve diğer etik ihlaller ciddi ihlallerdir ve tolere edilmez. Şüpheli durumlarda, düzenleme kurulu aşağıdaki adımları takip eder:
            </p>

            <ol className="list-decimal pl-6 mb-6 space-y-2 text-gray-700">
              <li>İhlal iddiası dikkatle incelenir ve kanıtlar toplanır.</li>
              <li>İlgili yazarlara cevap verme fırsatı tanınır.</li>
              <li>Kanıtlanmış ihlaller durumunda, bildiri sempozyumdan çıkarılır veya sunumu iptal edilir.</li>
              <li>Bildiri yazarlarının kurumları bilgilendirilir.</li>
              <li>Gelecekteki sempozyumlara katılım konusunda kısıtlamalar getirilebilir.</li>
            </ol>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">Veri Koruma ve Gizlilik</h3>
            <p className="mb-4 text-gray-700">
              Sempozyum, tüm katılımcıların kişisel verilerini ilgili veri koruma yasalarına uygun olarak korur. Kişisel veriler yalnızca sempozyumla ilgili amaçlar için kullanılır ve üçüncü taraflarla paylaşılmaz.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mt-6 mb-3">Ayrımcılık Karşıtı Politika</h3>
            <p className="mb-4 text-gray-700">
              Sempozyum, ırk, cinsiyet, din, yaş, engellilik, cinsel yönelim veya ulusal köken temelinde ayrımcılığı reddeder. Tüm katılımcılar birbirine saygılı davranmalı ve kapsayıcı bir ortam yaratmaya katkıda bulunmalıdır.
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-md my-8">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Etik Konular İletişim</h3>
              <p className="text-yellow-700">
                Etik konularla ilgili sorularınız veya endişeleriniz için lütfen <a href="mailto:iletişim " className="text-yellow-600 underline">etik@sempozyum.org</a> adresine e-posta gönderin. Tüm bildiriler gizli tutulacak ve hızla ele alınacaktır.
              </p>
            </div>

            <p className="text-gray-700 mt-6">
              Bu etik kurallar, sempozyumun yüksek kalite standartlarını korumasını ve bilimsel bütünlüğünü güvence altına almasını sağlar. Tüm katılımcıların bu kurallara uyması, bilimsel bilginin gelişmesine katkıda bulunacak etik ve profesyonel bir ortamın yaratılmasını destekler.
            </p>
          </div>
        </div>
        
        {/* İmzalar ve Son Güncelleme Tarihi */}
        <div className="text-center text-sm text-gray-500 mb-8">
          <p>Son Güncelleme: {new Date().toLocaleDateString('tr-TR', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
          <p className="mt-2">© {new Date().getFullYear()} Mühendislik Bilimleri Sempozyumu - Tüm Hakları Saklıdır</p>
        </div>
      </div>
    </div>
  );
} 