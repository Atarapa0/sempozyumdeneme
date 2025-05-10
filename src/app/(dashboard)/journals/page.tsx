'use client';

import React, { useState, useEffect } from 'react';
import { getPageContent } from '@/lib/database';
import { Journal, PageContent } from '@/lib/types';
import { CalendarIcon, DocumentIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';

const JournalsPage = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [journalsResponse, pageContentData] = await Promise.all([
          apiClient.get('/api/dergi'),
          getPageContent('journals')
        ]);
        
        const journalsData = await journalsResponse.json();
        if (!journalsResponse.ok) {
          throw new Error('Dergiler yüklenirken bir hata oluştu');
        }
        
        setJournals(journalsData);
        setPageContent(pageContentData);
      } catch (error) {
        console.error('Error fetching journals data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          {pageContent?.title || 'Dergiler'}
        </h1>
        
        {pageContent?.content && (
          <div 
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: pageContent.content }}
          />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {journals.length > 0 ? (
            journals.map((journal) => (
              <div 
                key={journal.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-transform hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 p-4 flex justify-center items-start">
                    <div className="relative w-32 h-44 shadow-md">
                      {journal.coverImage ? (
                        <Image
                          src={journal.coverImage}
                          alt={journal.title}
                          fill
                          className="object-cover rounded"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 rounded">
                          Görsel Yok
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:w-2/3 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{journal.title}</h2>
                    
                    <div className="flex items-center text-gray-600 mb-3">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      <span>Yayın Tarihi: {new Date(journal.publishDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}</span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{journal.description}</p>
                    
                    <div className="flex">
                      {journal.pdfUrl && (
                        <Link 
                          href={journal.pdfUrl} 
                          target="_blank"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <DocumentIcon className="h-5 w-5 mr-2" />
                          PDF Görüntüle
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-xl font-medium text-gray-700 mb-2">Henüz dergi bulunmamaktadır</h3>
              <p className="text-gray-600">
                Sempozyum kapsamında yayınlanan dergiler burada listelenecektir.
              </p>
            </div>
          )}
        </div>
      </div> 
    </div>
  );
};

export default JournalsPage; 