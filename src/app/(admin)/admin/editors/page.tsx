'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/services/api.client';

// Editör tipi
type Editor = {
  id: number;
  eposta: string;
  ad: string;
  soyad: string;
  unvan: string;
  bolum: string | null;
  kurum: string | null;
  tel: string | null;
  rol: {
    ad: string;
  };
};

const EditorsManagementPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // State tanımlamaları
  const [editors, setEditors] = useState<Editor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin olmayan kullanıcıları ana sayfaya yönlendir
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Editörleri veritabanından yükle
  useEffect(() => {
    const fetchEditors = async () => {
      try {
        setLoading(true);
        // Editör rolü ID'si 5 olarak varsayılıyor
        const response = await apiClient.get('/kullanici?rolId=5');
        const editorler = response.data;
        
        if (!editorler || !Array.isArray(editorler)) {
          throw new Error('API geçersiz veri döndürdü');
        }
        
        // Editörleri dönüştür ve durum bilgisini ekle
        const formattedEditors = editorler.map((editor: any) => ({
          id: editor.id,
          eposta: editor.eposta,
          ad: editor.ad,
          soyad: editor.soyad,
          unvan: editor.unvan || '',
          bolum: editor.bolum || null,
          kurum: editor.kurum || null,
          tel: editor.cepTel || null,
          rol: {
            ad: editor.rol?.ad || 'Editör'
          },
        }));
        
        setEditors(formattedEditors);
      } catch (error) {
        console.error('Editörler yüklenirken hata oluştu:', error);
        setError('Editörler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      fetchEditors();
    }
  }, [user]);

  // Editör sil
  const handleDeleteEditor = async (id: number) => {
    if (window.confirm('Bu editörü silmek istediğinizden emin misiniz?')) {
      try {
        // API çağrısı yap
        await apiClient.delete(`/kullanici/${id}`);
        
        // UI'ı güncelle
        setEditors(editors.filter(editor => editor.id !== id));
        
        setMessage({ 
          type: 'success', 
          text: 'Editör başarıyla silindi.' 
        });

        // Mesajı 3 saniye sonra kaldır
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } catch (error) {
        console.error('Editör silinirken hata oluştu:', error);
        setMessage({ 
          type: 'error', 
          text: 'Editör silinirken bir hata oluştu.' 
        });
      }
    }
  };

  // Filtrelenmiş editörleri hesapla
  const filteredEditors = editors.filter(editor => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      editor.ad.toLowerCase().includes(searchLower) ||
      editor.soyad.toLowerCase().includes(searchLower) ||
      editor.eposta.toLowerCase().includes(searchLower) ||
      (editor.bolum?.toLowerCase().includes(searchLower) || false) ||
      (editor.kurum?.toLowerCase().includes(searchLower) || false);
    
    return matchesSearch;
  });

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

  // Hata durumu
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-bold">Hata!</p>
            <p>{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Editör Yönetimi</h1>
            <Link href="/admin/dashboard" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Admin Paneline Dön
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Sistemdeki editörleri görüntüleyebilir, düzenleyebilir veya silebilirsiniz.
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

        {/* Filtreler ve Arama */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="w-full md:w-1/2">
                <label htmlFor="search" className="sr-only">Editör Ara</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    id="search"
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="İsim, e-posta, bölüm veya kurum ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Link href="/admin/register-editor" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Yeni Editör Ekle
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Editör Listesi */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ad Soyad
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      E-posta
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unvan/Bölüm
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kurum
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEditors.map((editor) => (
                    <tr key={editor.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {editor.ad} {editor.soyad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editor.eposta}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editor.unvan}{editor.bolum ? `, ${editor.bolum}` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editor.kurum || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteEditor(editor.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredEditors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Arama kriterlerine uygun editör bulunamadı.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorsManagementPage; 