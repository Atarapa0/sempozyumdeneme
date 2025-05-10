'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';

const EditorDashboardPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Editör olmayan kullanıcıları ana sayfaya yönlendir
  useEffect(() => {
    if (!isLoading && (!user || (user.rolId !== 5))) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Editör olmayan kullanıcılar için içerik gösterme
  if (!user || (user.rolId !== 5)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Editör Paneli</h1>
          <p className="mt-2 text-sm text-gray-600">
            Bildiri yönetimi ve diğer işlemleri buradan gerçekleştirebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Bildiri Yönetimi Kartı */}
          <Link href="/editor/papers" className="block">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">Bildiri Yönetimi</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Bildiri değerlendirme, hakeme atama ve bildiri durumlarını yönetme işlemleri
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6">
                <div className="text-sm text-right">
                  <div className="font-medium text-blue-600 hover:text-blue-500">Görüntüle &rarr;</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EditorDashboardPage; 