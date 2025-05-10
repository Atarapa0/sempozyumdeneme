'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Archive {
  id: string;
  ad: string;
  aciklama: string;
  kapakGorselUrl: string | null;
  pdfDosya: string | null;
  createdAt: string;
}

const ArchivePage = () => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  useEffect(() => {
    const fetchArchives = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/arsiv');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Arşivler alınırken bir hata oluştu');
        }

        // Arşivleri tarihe göre sırala (en yeni en üstte)
        const sortedArchives = data.arsivler.sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setArchives(sortedArchives);
        setError(null);
      } catch (err: any) {
        console.error('Arşivleri alma hatası:', err);
        setError(err.message || 'Arşivler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchArchives();
  }, []);

  const handleArchiveClick = (archive: Archive) => {
    setSelectedArchive(archive);
    // PDF varsa görüntüleyiciyi göster, yoksa sadece detay modalını göster
    if (archive.pdfDosya) {
      setShowPdfViewer(true);
    } else {
      setShowPdfViewer(false);
    }
  };

  const handleClosePdfViewer = () => {
    setShowPdfViewer(false);
    setSelectedArchive(null); // PDF görüntüleyiciyi kapatırken seçili arşivi de temizle
  };

  const handleCloseArchiveDetail = () => {
    setSelectedArchive(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (archives.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Arşivler</h1>
        <div className="bg-gray-100 p-8 rounded-md text-center">
          <p className="text-gray-600">Henüz arşiv bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Arşivler</h1>

      {/* Arşiv Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {archives.map((archive) => (
          <div 
            key={archive.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 cursor-pointer"
            onClick={() => handleArchiveClick(archive)}
          >
            <div className="relative h-64 w-full bg-gray-200">
              {archive.kapakGorselUrl ? (
                <Image
                  src={archive.kapakGorselUrl}
                  alt={archive.ad}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Görsel Yok</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{archive.ad}</h2>
              <p className="text-gray-600 line-clamp-3">{archive.aciklama}</p>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {new Date(archive.createdAt).toLocaleDateString('tr-TR')}
                </p>
                {archive.pdfDosya && (
                  <div className="text-blue-600 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>PDF Görüntüle</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PDF Görüntüleyici Modal */}
      {selectedArchive && showPdfViewer && selectedArchive.pdfDosya && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedArchive.ad}</h2>
              <div className="flex space-x-2">
                <Link 
                  href={selectedArchive.pdfDosya} 
                  target="_blank" 
                  className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Yeni Sekmede Aç
                </Link>
                <a 
                  href={selectedArchive.pdfDosya} 
                  download 
                  className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  İndir
                </a>
                <button 
                  onClick={handleClosePdfViewer} 
                  className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Kapat
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 h-full">
              <iframe
                src={selectedArchive.pdfDosya}
                title={selectedArchive.ad}
                className="w-full h-full"
                style={{ minHeight: "75vh" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Arşiv Detay Modal (PDF yoksa) */}
      {selectedArchive && !showPdfViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedArchive.ad}</h2>
              <button 
                onClick={handleCloseArchiveDetail} 
                className="text-gray-600 hover:text-gray-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 relative h-60 bg-gray-200 rounded">
                  {selectedArchive.kapakGorselUrl ? (
                    <Image
                      src={selectedArchive.kapakGorselUrl}
                      alt={selectedArchive.ad}
                      fill
                      className="object-cover rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Görsel Yok</p>
                    </div>
                  )}
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-2xl font-bold mb-3">{selectedArchive.ad}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Oluşturulma: {new Date(selectedArchive.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                  <div className="prose max-w-none">
                    <p>{selectedArchive.aciklama}</p>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-gray-500">Bu arşiv için PDF dosyası bulunmamaktadır.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end">
              <button 
                onClick={handleCloseArchiveDetail} 
                className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivePage; 