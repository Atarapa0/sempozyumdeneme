'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { bildiriService, Bildiri } from '@/lib/services/bildiri.service';
import { sempozyumService } from '@/lib/services/sempozyum.service';

// Bildiri değerlendirme durumu tipini tanımla
interface BildiriWithHakemDurum extends Bildiri {
  hakemDegerlendirmeDurumu?: {
    durum: string | null;
    yapildi: boolean;
  };
}

const AssignedPapersPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [papers, setPapers] = useState<BildiriWithHakemDurum[]>([]);
  const [loading, setLoading] = useState(true);
  const [aktifSempozyum, setAktifSempozyum] = useState<{ id: number; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hakem olmayan kullanıcıları ana sayfaya yönlendir
  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'reviewer' && user.rolId !== 3))) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Aktif sempozyum ve bildiri verilerini yükle
  useEffect(() => {
    const loadData = async () => {
      if (user && (user.role === 'reviewer' || user.rolId === 3)) {
        try {
          // Aktif sempozyumu kontrol et
          const aktifSempozyumData = await sempozyumService.getAktifSempozyum();
          setAktifSempozyum(aktifSempozyumData);
          
          if (!aktifSempozyumData) {
            setError('Aktif sempozyum bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.');
            setLoading(false);
            return;
          }
          
          // user.id bir sayı değilse numerik bir değere dönüştür
          const hakemId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
          console.log('Hakem bilgileri:', { id: hakemId, role: user.role, rolId: user.rolId, name: user.name });
          
          const assignedPapers = await bildiriService.getByHakem(hakemId);
          console.log(`${assignedPapers.length} adet bildiri yüklendi`);
          
          // Her bildiri için hakem değerlendirme durumunu al
          const papersWithReviewStatus = await Promise.all(
            assignedPapers.map(async (bildiri) => {
              try {
                const degerlendirmeDurumu = await bildiriService.getHakemDegerlendirmeDurumu(bildiri.id, hakemId);
                console.log(`Bildiri ${bildiri.id} değerlendirme durumu:`, JSON.stringify(degerlendirmeDurumu));
                return {
                  ...bildiri,
                  hakemDegerlendirmeDurumu: degerlendirmeDurumu
                };
              } catch (error) {
                console.error(`Bildiri ${bildiri.id} için değerlendirme durumu alınamadı:`, error);
                return {
                  ...bildiri,
                  hakemDegerlendirmeDurumu: { durum: null, yapildi: false }
                };
              }
            })
          );
          
          setPapers(papersWithReviewStatus);
        } catch (error) {
          console.error('Veri yükleme hatası:', error);
          setError('Bildirileri yüklerken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        } finally {
          setLoading(false);
        }
      } else {
        console.log('Geçersiz kullanıcı:', user);
        setLoading(false);
      }
    };
    
    if (!isLoading && user) {
      loadData();
    } else if (!isLoading) {
      console.log('Kullanıcı bulunamadı');
      setLoading(false);
    }
  }, [user, isLoading]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Hakem olmayan kullanıcılar için içerik gösterme
  if (!user || (user.role !== 'reviewer' && user.rolId !== 3)) {
    return null;
  }

  // Hata durumunda mesaj göster
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Hata</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <p className="text-gray-500">Lütfen daha sonra tekrar deneyin veya sistem yöneticisi ile iletişime geçin.</p>
          </div>
        </div>
      </div>
    );
  }

  // Hakem durum metnini almak için yardımcı fonksiyon
  const getHakemDurumText = (durumObj?: { durum: string | null; yapildi: boolean }) => {
    if (!durumObj || !durumObj.yapildi) return 'Değerlendirilmedi';
    
    const durum = durumObj.durum?.toUpperCase() || '';
    console.log('Hakem durum değeri:', durum);
    
    switch (durum) {
      case 'KABUL': return 'Kabul Edildi';
      case 'RED': return 'Reddedildi';
      case 'REVIZE': return 'Revizyon İstendi';
      default: return `Değerlendirildi (${durumObj.durum})`;
    }
  };

  // Hakem durum renk sınıfını almak için yardımcı fonksiyon
  const getHakemDurumColorClass = (durumObj?: { durum: string | null; yapildi: boolean }) => {
    if (!durumObj || !durumObj.yapildi) return 'bg-yellow-100 text-yellow-800';
    
    const durum = durumObj.durum?.toUpperCase() || '';
    
    switch (durum) {
      case 'KABUL': return 'bg-green-100 text-green-800';
      case 'RED': return 'bg-red-100 text-red-800';
      case 'REVIZE': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Durum metnini almak için yardımcı fonksiyon
  const getStatusText = (status: string) => {
    switch (status) {
      case 'beklemede': return 'Beklemede';
      case 'incelemede': return 'İncelemede';
      case 'degerlendirildi': return 'Değerlendirildi';
      case 'kabul': return 'Kabul Edildi';
      case 'red': return 'Reddedildi';
      case 'duzeltme': return 'Düzeltme İstendi';
      default: return status;
    }
  };

  // Durum renk sınıfını almak için yardımcı fonksiyon
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'beklemede': return 'bg-gray-100 text-gray-800';
      case 'incelemede': return 'bg-yellow-100 text-yellow-800';
      case 'degerlendirildi': return 'bg-green-100 text-green-800';
      case 'kabul': return 'bg-green-100 text-green-800';
      case 'red': return 'bg-red-100 text-red-800';
      case 'duzeltme': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtreleme işlemi
  const filteredPapers = papers.filter(paper => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !paper.hakemDegerlendirmeDurumu?.yapildi;
    if (filter === 'completed') return paper.hakemDegerlendirmeDurumu?.yapildi;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Atanan Bildiriler</h1>
          <p className="mt-2 text-sm text-gray-600">
            {aktifSempozyum && `Aktif sempozyum: ${aktifSempozyum.title}`}. Size atanan tüm bildirileri burada görüntüleyebilir ve değerlendirebilirsiniz.
          </p>
        </div>

        {/* Filtreler */}
        <div className="mb-6 flex space-x-2">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('all')}
          >
            Tümü ({papers.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'pending' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('pending')}
          >
            Değerlendirilmemiş ({papers.filter(p => !p.hakemDegerlendirmeDurumu?.yapildi).length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'completed' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('completed')}
          >
            Değerlendirilmiş ({papers.filter(p => p.hakemDegerlendirmeDurumu?.yapildi).length})
          </button>
        </div>

        {/* Bildiri Listesi */}
        <div className="space-y-6">
          {filteredPapers.length > 0 ? (
            filteredPapers.map((paper) => (
              <div key={paper.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{paper.baslik}</h3>
                    <div className="flex items-center space-x-2">
                      {/* Hakem değerlendirme durumu */}
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getHakemDurumColorClass(paper.hakemDegerlendirmeDurumu)}`}>
                        {getHakemDurumText(paper.hakemDegerlendirmeDurumu)}
                      </span>
                      
                      {/* Bildiri genel durumu */}
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(paper.durum)}`}>
                        {getStatusText(paper.durum)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Yazarlar: {Array.isArray(paper.yazarlar) 
                        ? paper.yazarlar.join(', ') 
                        : typeof paper.yazarlar === 'string' 
                          ? paper.yazarlar 
                          : ''}
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Özet</dt>
                      <dd className="mt-1 text-sm text-gray-900">{paper.ozet}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Anahtar Kelimeler</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(paper.anahtarKelimeler) && paper.anahtarKelimeler.map((keyword, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Atanma Tarihi</dt>
                      <dd className="mt-1 text-sm text-gray-900">{new Date(paper.updatedAt).toLocaleDateString('tr-TR')}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
                      <dd className="mt-1 text-sm text-gray-900">{new Date(paper.createdAt).toLocaleDateString('tr-TR')}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex justify-end">
                        <Link
                          href={`/reviewer/review/${paper.id}`}
                          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                            paper.hakemDegerlendirmeDurumu?.yapildi
                              ? 'bg-gray-600 hover:bg-gray-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                          {paper.hakemDegerlendirmeDurumu?.yapildi ? 'Değerlendirmeyi Görüntüle' : 'Değerlendir'}
                        </Link>
                      </div>
                    </div>
                  </dl>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">Seçilen filtreye uygun bildiri bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignedPapersPage; 