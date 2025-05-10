'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { bildiriService, Bildiri } from '@/lib/services/bildiri.service';
import { sempozyumService } from '@/lib/services/sempozyum.service';

// BildiriWithHakemDurum arayüzünü ekleyelim
interface BildiriWithHakemDurum extends Bildiri {
  hakemDegerlendirmeDurumu?: {
    durum: string | null;
    yapildi: boolean;
  };
}

const ReviewerDashboard = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    assignedPapers: 0,
    pendingReviews: 0,
    completedReviews: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState<BildiriWithHakemDurum[]>([]);
  const [loading, setLoading] = useState(true);
  const [aktifSempozyum, setAktifSempozyum] = useState<{ id: number; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hakem rolü kontrolü
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
          
          const papers = await bildiriService.getByHakem(hakemId);
          console.log(`${papers.length} adet bildiri yüklendi`);
          
          // Her bildiri için hakem değerlendirme durumunu al
          const papersWithReviewStatus = await Promise.all(
            papers.map(async (bildiri) => {
              try {
                const degerlendirmeDurumu = await bildiriService.getHakemDegerlendirmeDurumu(bildiri.id, hakemId);
                console.log(`Bildiri ${bildiri.id} değerlendirme durumu:`, degerlendirmeDurumu);
                return {
                  ...bildiri,
                  hakemDegerlendirmeDurumu: degerlendirmeDurumu
                } as BildiriWithHakemDurum;
              } catch (error) {
                console.error(`Bildiri ${bildiri.id} için değerlendirme durumu alınamadı:`, error);
                return {
                  ...bildiri,
                  hakemDegerlendirmeDurumu: { durum: null, yapildi: false }
                } as BildiriWithHakemDurum;
              }
            })
          );
          
          // İstatistikleri hesapla - değerlendirilmiş ve değerlendirilmemiş bildiri sayıları
          const pendingCount = papersWithReviewStatus.filter(p => !p.hakemDegerlendirmeDurumu?.yapildi).length;
          const completedCount = papersWithReviewStatus.filter(p => p.hakemDegerlendirmeDurumu?.yapildi).length;
          
          setStats({
            assignedPapers: papers.length,
            pendingReviews: pendingCount,
            completedReviews: completedCount,
          });
          
          // Son atanan bildirileri al (en yeni 5 tanesi)
          const recentPapers = [...papersWithReviewStatus].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ).slice(0, 5);
          
          setRecentAssignments(recentPapers);
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

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hakem Paneli</h1>
          <p className="mt-2 text-sm text-gray-600">
            Hoş geldiniz, {user.name || 'Hakem'}. {aktifSempozyum && `Aktif sempozyum: ${aktifSempozyum.title}`}
          </p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Atanan Bildiriler</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.assignedPapers}</dd>
              </dl>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Bekleyen Değerlendirmeler</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingReviews}</dd>
              </dl>
            </div>
          </div>
          
        </div>

        {/* Hızlı Erişim Bağlantıları */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Hızlı Erişim</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link href="/reviewer/assigned-papers" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Atanan Bildirileri Görüntüle
              </Link>
             
            </div>
          </div>
        </div>

        {/* Son Atanan Bildiriler */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Son Atanan Bildiriler</h2>
            <div className="overflow-x-auto">
              {recentAssignments.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bildiri Başlığı
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yazarlar
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Atanma Tarihi
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAssignments.map((paper) => (
                      <tr key={paper.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {paper.baslik}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Array.isArray(paper.yazarlar) 
                            ? paper.yazarlar.join(', ') 
                            : typeof paper.yazarlar === 'string' 
                              ? paper.yazarlar 
                              : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(paper.updatedAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {/* Bildiri genel durumu */}
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(paper.durum)}`}>
                              {getStatusText(paper.durum)}
                            </span>
                            
                            {/* Hakem değerlendirme durumu */}
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getHakemDurumColorClass(paper.hakemDegerlendirmeDurumu)}`}>
                              {getHakemDurumText(paper.hakemDegerlendirmeDurumu)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link href={`/reviewer/review/${paper.id}`} className="text-blue-600 hover:text-blue-900">
                            {paper.hakemDegerlendirmeDurumu?.yapildi ? 'Görüntüle' : 'Değerlendir'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Henüz atanmış bildiri bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewerDashboard; 