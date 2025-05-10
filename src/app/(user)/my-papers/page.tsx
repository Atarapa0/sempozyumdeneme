'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { bildiriService } from '@/lib/services';
import { isDuzeltmeStatus, getStatusColor, getStatusText } from '@/lib/utils/status-helpers';

// Bildiri tipi (API'den gelen)
interface Bildiri {
  id: number;
  baslik: string;
  ozet: string;
  yazarlar: string[];
  anaKonu?: { baslik: string };
  bildiriKonusu?: { baslik: string };
  createdAt: string;
  durum: string;
  hakemNotu?: string;
  sunumTipi: string;
  dokuman?: string;
}

// Bildiri durumları
type PaperStatus = 'BEKLEMEDE' | 'INCELEMEDE' | 'KABUL' | 'RED' | 'DUZELTME' | 'REVIZE_YAPILDI' | string;

// Bildiri tipi (component içinde kullanılan)
interface Paper {
  id: number;
  baslik: string;
  ozet: string;
  yazarlar: string[];
  anaKonu?: { baslik: string };
  bildiriKonusu?: { baslik: string };
  createdAt: string;
  durum: PaperStatus;
  hakemNotu?: string;
  sunumTipi: string;
  dokuman?: string;
}

export default function MyPapersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  useEffect(() => {
    // Token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Kullanıcı bilgilerini al
    const userData = localStorage.getItem('user');
    if (!userData) {
      setError("Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
      setLoading(false);
      return;
    }

    const userObj = JSON.parse(userData);
    const userId = userObj.id;
    
    const fetchBildiriler = async () => {
      try {
        // Kullanıcının bildirilerini çek
        const bildiriler = await bildiriService.getByKullanici(userId);
        if (bildiriler && Array.isArray(bildiriler)) {
          // Log the actual status values from the API
          console.log('Bildiri status values:', bildiriler.map(b => b.durum));
          
          // API'den gelen verileri Paper tipine dönüştür
          const formattedPapers: Paper[] = bildiriler.map((bildiri: Bildiri) => ({
            ...bildiri,
            durum: bildiri.durum as PaperStatus
          }));
          setPapers(formattedPapers);
        } else {
          // Eğer veri yoksa veya dizi değilse boş dizi ata
          console.error('Bildiriler alınamadı veya geçersiz formatta:', bildiriler);
          setPapers([]);
        }
      } catch (error) {
        console.error('Bildiriler alınırken hata oluştu:', error);
        setError('Bildiriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyiniz.');
        // Hata durumunda papers'ı boş dizi olarak ayarla
        setPapers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBildiriler();
  }, [router]);

  const handleViewDetails = (paper: Paper) => {
    // Daha detaylı durum bilgisi için konsola ekleme yapıyorum
    console.log("Bildiri durumu:", paper.durum);
    console.log("Bildiri durumunun türü:", typeof paper.durum);
    
    // Tüm bildiri verilerini konsola yazdırıyorum
    console.log("Bildiri detayları:", paper);
    
    setSelectedPaper(paper);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPaper(null);
    setShowPdfViewer(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Hata! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <Link 
            href="/login" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Bildirilerim</h1>
          <Link 
            href="/submit-paper" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Yeni Bildiri Gönder
          </Link>
        </div>
        
        {!papers || papers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">Henüz gönderilmiş bir bildiriniz bulunmamaktadır.</p>
            <Link 
              href="/submit-paper" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Bildiri Gönder
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bildiri Başlığı
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gönderim Tarihi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {papers.map((paper) => (
                    <tr key={paper.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{paper.baslik}</div>
                        <div className="text-sm text-gray-500">{paper.yazarlar.join(', ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{paper.anaKonu?.baslik || 'Belirtilmemiş'}</div>
                        <div className="text-sm text-gray-500">{paper.sunumTipi === 'oral' ? 'Sözlü Sunum' : 'Poster Sunum'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(paper.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(paper.durum as PaperStatus)}`}>
                          {getStatusText(paper.durum as PaperStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(paper)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Detaylar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Bildiri Detay Modalı */}
        {showModal && selectedPaper && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPaper.baslik}</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-6">
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(selectedPaper.durum as PaperStatus)}`}>
                    {getStatusText(selectedPaper.durum as PaperStatus)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Yazarlar</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedPaper.yazarlar.join(', ')}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Kategori</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedPaper.anaKonu?.baslik || 'Belirtilmemiş'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Bildiri Konusu</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedPaper.bildiriKonusu?.baslik || 'Belirtilmemiş'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Gönderim Tarihi</h3>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedPaper.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Sunum Tipi</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedPaper.sunumTipi === 'oral' ? 'Sözlü Sunum' : 'Poster Sunum'}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Özet</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded">{selectedPaper.ozet}</p>
                </div>
                
                {selectedPaper.hakemNotu && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Hakem Değerlendirmesi</h3>
                    <div className="bg-yellow-50 p-4 rounded border border-yellow-100">
                      <p className="text-sm text-gray-900">{selectedPaper.hakemNotu}</p>
                    </div>
                  </div>
                )}
                
                <h3 className="text-lg font-semibold mb-4">Bildiri Dokümanı</h3>
                {!selectedPaper.dokuman ? (
                  <p className="text-gray-500 italic">Bu bildiri için henüz bir doküman yüklenmemiştir.</p>
                ) : (
                  <div>
                    {showPdfViewer ? (
                      <div className="mb-4">
                        <div className="border border-gray-300 rounded-lg overflow-hidden h-[600px]">
                          <iframe 
                            src={selectedPaper.dokuman}
                            className="w-full h-full border-0"
                            title={`${selectedPaper.baslik} - PDF Dokümanı`}
                            sandbox="allow-same-origin allow-scripts allow-forms"
                          ></iframe>
                        </div>
                        <button
                          onClick={() => setShowPdfViewer(false)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          PDF Görüntüleyiciyi Kapat
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-3 mb-4">
                        <button
                          onClick={() => setShowPdfViewer(true)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                          PDF Görüntüle
                        </button>
                        <a 
                          href={selectedPaper.dokuman} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                          download
                        >
                          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                          </svg>
                          PDF İndir
                        </a>
                        <a 
                          href={selectedPaper.dokuman}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                          </svg>
                          Yeni Sekmede Aç
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Revizyon Yap Butonu - Her zaman gösterilir ve bildiri durumuna göre aktif/pasif olur */}
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">Bildiri İşlemleri</h3>
                  
                  <div className="flex flex-wrap gap-2">
                    <Link 
                      href={`/submit-revision/${selectedPaper.id}`}
                      className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500
                        ${isDuzeltmeStatus(selectedPaper.durum)
                          ? 'text-white bg-yellow-600 hover:bg-yellow-700 border-transparent'
                          : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'}`}
                      onClick={(e) => {
                        // Engellemek için kontrol
                        if (!isDuzeltmeStatus(selectedPaper.durum)) {
                          e.preventDefault();
                          alert('Bu bildiri için revizyon yapma hakkı bulunmamaktadır. Sadece revizyon istenen bildiriler için bu işlem gerçekleştirilebilir.');
                        }
                      }}
                    >
                      <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Revizyon Yap
                    </Link>
                  </div>
                  
                  {isDuzeltmeStatus(selectedPaper.durum) && (
                    <p className="text-xs text-gray-500 mt-2">
                      Bu bildiri için revizyon yapmanız isteniyor. Hakem değerlendirmelerini inceleyerek bildirinizde gerekli düzenlemeleri yapabilirsiniz.
                    </p>
                  )}

                  {!isDuzeltmeStatus(selectedPaper.durum) && (
                    <p className="text-xs text-gray-500 mt-2">
                      Bu bildiri için şu an revizyon yapma durumu bulunmamaktadır. Sadece revizyon istenen bildiriler için bu işlem aktiftir.
                    </p>
                  )}
                </div>
                
                {/* Kapatma Butonu */}
                <div className="mt-6">
                  <button
                    onClick={closeModal}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 