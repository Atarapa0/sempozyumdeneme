'use client';

import React, { useState, useEffect } from 'react';
import { getPageContent } from '@/lib/database';
import { Journal, PageContent } from '@/lib/types';
import { 
  NewspaperIcon, 
  DocumentTextIcon, 
  GlobeAltIcon, 
  BookOpenIcon 
} from '@heroicons/react/24/outline';
import apiClient from '@/lib/apiClient';

const PublicationOpportunitiesPage = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [journalsResponse, pageContentData] = await Promise.all([
          apiClient.get('/api/dergi'),
          getPageContent('publication-opportunities', 'sym2025')
        ]);
        
        const journalsData = await journalsResponse.json();
        if (!journalsResponse.ok) {
          throw new Error('Dergiler yüklenirken bir hata oluştu');
        }
        
        setJournals(journalsData);
        setPageContent(pageContentData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Yayınlama İmkanları</h1>

      {pageContent && (
        <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{ __html: pageContent.content }} />
      )}

      {/* Bildiri Yayınlama Süreci - Şimdi ilk sırada */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Bildiri Yayınlama Süreci</h2>
        <div className="prose prose-lg max-w-none">
          <p>
            Sempozyumda sunulan ve hakem değerlendirmesinden geçen bildiriler, aşağıdaki yayın imkanlarından faydalanabilirler:
          </p>
          <ul className="list-disc pl-6 mt-4">
            <li>Sempozyum Bildiri Kitabı (ISBN numaralı)</li>
            <li>Seçilen bildiriler için özel dergi sayıları</li>
            <li>Uluslararası indekslerde taranan dergilerde yayınlanma fırsatı</li>
          </ul>
        </div>
      </div>

      {/* Dergi Önerileri Bölümü - Şimdi ikinci sırada */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Dergi Önerileri</h2>
        <p className="text-gray-700 mb-6">
          Sempozyumumuzda sunulan bildiriler, aşağıdaki dergilerde yayınlanma imkanına sahiptir:
        </p>
        <div className="space-y-4">
          {journals.map((journal) => (
            <div key={journal.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <a 
                href={journal.pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors"
                onClick={(e) => {
                  if (!journal.pdfUrl) {
                    e.preventDefault();
                    return;
                  }
                  window.open(journal.pdfUrl, '_blank');
                }}
              >
                {journal.title}
              </a>
              <p className="mt-2 text-gray-600">{journal.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bilgi Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <span className="text-blue-600">
                <NewspaperIcon className="h-5 w-5" />
              </span>
            </div>
            <h3 className="text-lg font-semibold">Bildiri Kitabı</h3>
          </div>
          <p className="text-gray-700">
            Kabul edilen tüm bildiriler, ISBN numaralı sempozyum bildiri kitabında yayınlanacaktır.
            Bildiri kitabı hem dijital hem de basılı formatta hazırlanacaktır.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-2 rounded-full mr-3">
              <span className="text-purple-600">
                <DocumentTextIcon className="h-5 w-5" />
              </span>
            </div>
            <h3 className="text-lg font-semibold">Dergi Özel Sayıları</h3>
          </div>
          <p className="text-gray-700">
            Seçilen bildiriler, anlaşmalı olduğumuz akademik dergilerin özel sayılarında 
            yayınlanma fırsatına sahip olacaktır.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <span className="text-green-600">
                <GlobeAltIcon className="h-5 w-5" />
              </span>
            </div>
            <h3 className="text-lg font-semibold">Uluslararası İndeksler</h3>
          </div>
          <p className="text-gray-700">
            İş birliği yaptığımız dergiler prestijli uluslararası indekslerde taranmaktadır.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
          <div className="flex items-center mb-4">
            <div className="bg-amber-100 p-2 rounded-full mr-3">
              <span className="text-amber-600">
                <BookOpenIcon className="h-5 w-5" />
              </span>
            </div>
            <h3 className="text-lg font-semibold">Kitap Bölümleri</h3>
          </div>
          <p className="text-gray-700">
            Öne çıkan bildiriler, uluslararası yayınevleri tarafından basılacak 
            kitaplarda bölüm olarak yayınlanma fırsatına sahip olabilir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicationOpportunitiesPage; 