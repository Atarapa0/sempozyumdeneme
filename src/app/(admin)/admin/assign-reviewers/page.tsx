'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { bildiriService } from '@/lib/services/bildiri.service';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/services/api.client';

// Bildiri tipi
type Paper = {
  id: number;
  title: string;
  authors: string;
  abstract: string;
  keywords: string[];
  submissionDate: string;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'revision';
};

// Hakem tipi
type Reviewer = {
  id: number;
  email: string;
  name: string;
  title: string;
  department: string;
  expertise: string[];
  assignedPapers: number;
};

// Atama tipi
type Assignment = {
  id: number;
  paperId: number;
  reviewerId: number;
  assignedDate: string;
  status: 'pending' | 'completed';
};

const AssignReviewersPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // State tanımlamaları
  const [papers, setPapers] = useState<Paper[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<number | null>(null);
  const [selectedReviewers, setSelectedReviewers] = useState<number[]>([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Admin olmayan kullanıcıları ana sayfaya yönlendir
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Veritabanından verileri yükle
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Bildirileri getir
        const bildiriData = await bildiriService.getAll();
        console.log("Bildiriler yüklendi:", bildiriData);
        
        // Bildiri verisini uygun formata dönüştür
        const transformedPapers = bildiriData.map(bildiri => ({
          id: bildiri.id,
          title: bildiri.baslik,
          authors: Array.isArray(bildiri.yazarlar) 
            ? bildiri.yazarlar.join(', ') 
            : typeof bildiri.yazarlar === 'string' 
              ? bildiri.yazarlar 
              : '',
          abstract: bildiri.ozet,
          keywords: Array.isArray(bildiri.anahtarKelimeler) 
            ? bildiri.anahtarKelimeler 
            : [],
          submissionDate: bildiri.createdAt.split('T')[0],
          status: mapBildiriStatus(bildiri.durum)
        })) as Paper[];
        
        setPapers(transformedPapers);

        // Hakemleri getir
        const hakemResponse = await apiClient.get('/api/kullanici/hakemler');
        console.log("Hakemler yüklendi:", hakemResponse.data);
        
        // Hakem verisini uygun formata dönüştür
        const transformedReviewers = hakemResponse.data.hakemler.map((hakem: any) => ({
          id: hakem.id,
          email: hakem.eposta,
          name: `${hakem.ad} ${hakem.soyad}`,
          title: hakem.unvan || '',
          department: hakem.bolum || '',
          expertise: hakem.uzmanlikAlanlari || [],
          assignedPapers: hakem.atananBildiriSayisi || 0
        })) as Reviewer[];
        
        setReviewers(transformedReviewers);

        // Atamaları oluştur - her bildiri için mevcut hakemleri kontrol et
        const currentAssignments: Assignment[] = [];
        
        for (const bildiri of bildiriData) {
          if (bildiri.hakemler && (Array.isArray(bildiri.hakemler) || typeof bildiri.hakemler === 'string')) {
            let hakemIds: number[] = [];
            
            if (Array.isArray(bildiri.hakemler)) {
              // Dizideki her bir elemanın sayı olup olmadığını kontrol et
              hakemIds = bildiri.hakemler.map(h => typeof h === 'number' ? h : parseInt(h.toString()));
            } else if (typeof bildiri.hakemler === 'string') {
              try {
                const parsed = JSON.parse(bildiri.hakemler);
                if (Array.isArray(parsed)) {
                  hakemIds = parsed.map(h => typeof h === 'number' ? h : parseInt(h.toString()));
                }
              } catch (e) {
                console.error("Hakem listesi parse hatası:", e);
              }
            }
            
            hakemIds.forEach((hakemId, index) => {
              currentAssignments.push({
                id: currentAssignments.length + 1,
                paperId: bildiri.id,
                reviewerId: hakemId,
                assignedDate: bildiri.updatedAt.split('T')[0],
                status: 'pending'
              });
            });
          }
        }
        
        setAssignments(currentAssignments);
        setLoading(false);
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
        setMessage({ 
          type: 'error', 
          text: 'Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' 
        });
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Bildiri durumunu sistem format değerine dönüştür
  const mapBildiriStatus = (status: string): 'pending' | 'under_review' | 'accepted' | 'rejected' | 'revision' => {
    switch (status) {
      case 'beklemede': return 'pending';
      case 'incelemede': return 'under_review';
      case 'kabul_edildi': return 'accepted';
      case 'reddedildi': return 'rejected';
      case 'revizyon_istendi': return 'revision';
      default: return 'pending';
    }
  };

  // Bildiri seçme
  const handleSelectPaper = (paperId: number) => {
    setSelectedPaper(paperId);
    setSelectedReviewers([]);
  };

  // Hakem seçme/seçimi kaldırma
  const handleToggleReviewer = (reviewerId: number) => {
    if (selectedReviewers.includes(reviewerId)) {
      setSelectedReviewers(selectedReviewers.filter(id => id !== reviewerId));
    } else {
      setSelectedReviewers([...selectedReviewers, reviewerId]);
    }
  };

  // Hakem atama
  const handleAssignReviewers = async () => {
    if (!selectedPaper || selectedReviewers.length === 0) {
      setMessage({ type: 'error', text: 'Lütfen bir bildiri ve en az bir hakem seçin.' });
      return;
    }

    try {
      // API ile hakem ataması yap
      const result = await bildiriService.assignReviewers(selectedPaper, selectedReviewers);
      
      if (!result.success) {
        throw new Error(result.error || 'Hakem atama işlemi başarısız oldu.');
      }
      
      console.log('Hakem atama sonucu:', result);
      
      // Yeni atamalar oluştur (UI için)
      const newAssignments = selectedReviewers.map(reviewerId => ({
        id: Math.max(0, ...assignments.map(a => a.id)) + 1 + selectedReviewers.indexOf(reviewerId),
        paperId: selectedPaper,
        reviewerId,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'pending' as const
      }));

      // Atamaları ekle
      setAssignments([...assignments, ...newAssignments]);

      // Bildiri durumunu güncelle
      setPapers(papers.map(paper => 
        paper.id === selectedPaper ? { ...paper, status: 'under_review' as const } : paper
      ));

      // Hakemlerin atanan bildiri sayısını güncelle
      setReviewers(reviewers.map(reviewer => 
        selectedReviewers.includes(reviewer.id) 
          ? { ...reviewer, assignedPapers: reviewer.assignedPapers + 1 } 
          : reviewer
      ));

      // Başarı mesajı göster
      setMessage({ 
        type: 'success', 
        text: `Seçilen ${selectedReviewers.length} hakem başarıyla atandı.` 
      });

      // Seçimleri sıfırla
      setSelectedPaper(null);
      setSelectedReviewers([]);

      // Mesajı 3 saniye sonra kaldır
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Hakem atama hatası:', error);
      setMessage({ 
        type: 'error', 
        text: 'Hakem ataması yapılırken bir hata oluştu. Lütfen tekrar deneyin.' 
      });
      
      // Hata mesajını 5 saniye sonra kaldır
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    }
  };

  // Atama iptal etme
  const handleCancelAssignment = async (assignmentId: number) => {
    if (window.confirm('Bu atamayı iptal etmek istediğinizden emin misiniz?')) {
      // İptal edilecek atamayı bul
      const assignmentToCancel = assignments.find(a => a.id === assignmentId);
      
      if (!assignmentToCancel) return;

      try {
        // Bildiriye atanmış tüm hakemleri bul
        const currentAssignments = assignments.filter(
          a => a.paperId === assignmentToCancel.paperId && a.id !== assignmentId
        );
        
        // Bildiriye kalan hakemlerin ID listesini oluştur
        const remainingReviewerIds = currentAssignments.map(a => a.reviewerId);
        
        // API'ye hakem listesini güncelle
        await bildiriService.assignReviewers(assignmentToCancel.paperId, remainingReviewerIds);
        
        // UI'ı güncelle
        // Atamayı kaldır
        setAssignments(assignments.filter(a => a.id !== assignmentId));

        // Hakemin atanan bildiri sayısını azalt
        setReviewers(reviewers.map(reviewer => 
          reviewer.id === assignmentToCancel.reviewerId 
            ? { ...reviewer, assignedPapers: Math.max(0, reviewer.assignedPapers - 1) } 
            : reviewer
        ));

        // Bildirinin diğer atamaları var mı kontrol et
        const otherAssignments = assignments.filter(a => 
          a.id !== assignmentId && a.paperId === assignmentToCancel.paperId
        );

        // Eğer başka atama yoksa bildiri durumunu güncelle
        if (otherAssignments.length === 0) {
          setPapers(papers.map(paper => 
            paper.id === assignmentToCancel.paperId ? { ...paper, status: 'pending' as const } : paper
          ));
        }

        // Başarı mesajı göster
        setMessage({ 
          type: 'success', 
          text: 'Hakem ataması başarıyla iptal edildi.' 
        });

        // Mesajı 3 saniye sonra kaldır
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } catch (error) {
        console.error('Hakem ataması iptal hatası:', error);
        setMessage({ 
          type: 'error', 
          text: 'Hakem ataması iptal edilirken bir hata oluştu. Lütfen tekrar deneyin.' 
        });
      }
    }
  };

  // Filtreleme
  const filteredPapers = papers.filter(paper => {
    if (filter === 'all') return true;
    if (filter === 'pending') return paper.status === 'pending';
    if (filter === 'under_review') return paper.status === 'under_review';
    if (filter === 'completed') return paper.status === 'accepted' || paper.status === 'rejected';
    return true;
  });

  // Bildiriye atanan hakemleri bul
  const getAssignedReviewers = (paperId: number) => {
    return assignments
      .filter(a => a.paperId === paperId)
      .map(a => {
        const reviewer = reviewers.find(r => r.id === a.reviewerId);
        return {
          ...a,
          reviewer
        };
      });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Admin olmayan kullanıcılar için içerik gösterme
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Hakem Atama</h1>
            <Link href="/admin/dashboard" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Admin Paneline Dön
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Bildirilere hakem atamalarını buradan yapabilirsiniz.
          </p>
        </div>

        {/* Başarı/Hata Mesajı */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Bildiri Listesi */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Bildiriler</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Bekleyen
                </button>
                <button
                  onClick={() => setFilter('under_review')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'under_review'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  İncelemede
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Tamamlanan
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seç
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Başlık
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yazarlar
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gönderim Tarihi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atanan Hakemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPapers.map((paper) => {
                    const assignedReviewers = getAssignedReviewers(paper.id);
                    return (
                      <tr key={paper.id} className={selectedPaper === paper.id ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="radio"
                            name="selectedPaper"
                            checked={selectedPaper === paper.id}
                            onChange={() => handleSelectPaper(paper.id)}
                            disabled={paper.status === 'accepted' || paper.status === 'rejected'}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {paper.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {paper.authors}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {paper.submissionDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            paper.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            paper.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                            paper.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            paper.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {paper.status === 'pending' && 'Bekliyor'}
                            {paper.status === 'under_review' && 'İncelemede'}
                            {paper.status === 'accepted' && 'Kabul Edildi'}
                            {paper.status === 'rejected' && 'Reddedildi'}
                            {paper.status === 'revision' && 'Revizyon İstendi'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {assignedReviewers.length > 0 ? (
                            <div className="space-y-1">
                              {assignedReviewers.map(assignment => (
                                <div key={assignment.id} className="flex items-center justify-between">
                                  <span>
                                    {assignment.reviewer?.name} ({assignment.reviewer?.email})
                                  </span>
                                  {assignment.status === 'pending' && (
                                    <button
                                      onClick={() => handleCancelAssignment(assignment.id)}
                                      className="text-red-600 hover:text-red-900 text-xs ml-2"
                                    >
                                      İptal
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">Hakem atanmamış</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Hakem Listesi */}
        {selectedPaper && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Hakemler</h2>
              <p className="text-sm text-gray-600 mb-4">
                Seçilen bildiri için hakem atamak üzere aşağıdaki listeden hakem seçin.
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seç
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ad Soyad
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unvan
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bölüm
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uzmanlık Alanları
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Atanan Bildiri Sayısı
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reviewers.map((reviewer) => {
                      // Bu bildiriye zaten atanmış mı kontrol et
                      const isAlreadyAssigned = assignments.some(
                        a => a.paperId === selectedPaper && a.reviewerId === reviewer.id
                      );

                      return (
                        <tr key={reviewer.id} className={selectedReviewers.includes(reviewer.id) ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedReviewers.includes(reviewer.id)}
                              onChange={() => handleToggleReviewer(reviewer.id)}
                              disabled={isAlreadyAssigned}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {reviewer.name}
                            {isAlreadyAssigned && (
                              <span className="ml-2 text-xs text-blue-600">(Zaten atanmış)</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {reviewer.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {reviewer.department}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {reviewer.expertise.map((exp, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {exp}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {reviewer.assignedPapers}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleAssignReviewers}
                  disabled={selectedReviewers.length === 0}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    selectedReviewers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Seçilen Hakemleri Ata
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignReviewersPage; 