'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { getPageContent, updatePageContent } from '@/lib/database';
import { PageContent } from '@/lib/database';
import Link from 'next/link';

const AdminPublicationOpportunitiesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('general');
  
  // Dergi önerileri için örnek şablon
  const journalRecommendationsTemplate = `
<h2>Dergi Önerileri</h2>
<p>Sempozyumumuzda sunulan bildiriler, aşağıdaki dergilerde yayınlanma imkanına sahiptir:</p>
<ol>
  <li>
    <strong>Journal of Scientific Research</strong>
    <p>ESCI, Scopus indeksli</p>
    <p>Etki Faktörü: 2.3</p>
  </li>
  <li>
    <strong>International Journal of Technology and Innovation</strong>
    <p>SSCI indeksli</p>
    <p>Etki Faktörü: 3.1</p>
  </li>
  <li>
    <strong>Academic Research Quarterly</strong>
    <p>ESCI indeksli</p>
    <p>Etki Faktörü: 1.8</p>
  </li>
</ol>
  `;
  
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
        return;
      }
      
      fetchPageContent();
    }
  }, [user, authLoading, router]);
  
  const fetchPageContent = async () => {
    try {
      setLoading(true);
      const data = await getPageContent('publication-opportunities', '1');
      setPageContent(data);
    } catch (error) {
      console.error('Error fetching page content:', error);
      setMessage({ type: 'error', text: 'Sayfa içeriği yüklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (pageContent) {
      setPageContent({ ...pageContent, [name]: value });
    } else {
      // Eğer pageContent null ise yeni bir içerik oluştur
      setPageContent({
        id: '0',
        pageKey: 'publication-opportunities',
        title: name === 'title' ? value : 'Yayınlama İmkanları',
        content: name === 'content' ? value : '',
        symposiumId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pageContent) return;
    
    // Validate form
    if (!pageContent.title || !pageContent.content) {
      setMessage({ type: 'error', text: 'Lütfen gerekli alanları doldurun.' });
      return;
    }
    
    try {
      setSaving(true);
      await updatePageContent('publication-opportunities', '1', {
        title: pageContent.title,
        content: pageContent.content
      });
      
      setMessage({ type: 'success', text: 'Sayfa içeriği başarıyla kaydedildi.' });
    } catch (error) {
      console.error('Error saving page content:', error);
      setMessage({ type: 'error', text: 'Sayfa içeriği kaydedilirken bir hata oluştu.' });
    } finally {
      setSaving(false);
    }
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  const handleUseTemplate = () => {
    if (pageContent) {
      setPageContent({
        ...pageContent,
        content: journalRecommendationsTemplate
      });
    }
  };
  
  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Yayınlama İmkanları Sayfası Yönetimi</h1>
        <Link 
          href="/admin/dashboard" 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Dashboard'a Dön
        </Link>
      </div>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => handleTabChange('general')}
              className={`py-4 px-6 font-medium text-sm ${activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Genel Ayarlar
            </button>
            <button
              onClick={() => handleTabChange('journal-recommendations')}
              className={`py-4 px-6 font-medium text-sm ${activeTab === 'journal-recommendations' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Dergi Önerileri
            </button>
          </nav>
        </div>
      </div>
      
      {activeTab === 'general' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sayfa Başlığı</label>
              <input
                type="text"
                name="title"
                value={pageContent?.title || ''}
                onChange={handleContentChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Yayınlama İmkanları"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                disabled={saving}
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {activeTab === 'journal-recommendations' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Dergi Önerileri</h2>
            <button
              onClick={handleUseTemplate}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded text-sm"
            >
              Şablon Kullan
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dergi Önerileri İçeriği (HTML destekler)</label>
              <textarea
                name="content"
                value={pageContent?.content || ''}
                onChange={handleContentChange}
                className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                rows={20}
                placeholder="<h2>Dergi Önerileri</h2><p>İçerik buraya...</p>"
                required
              ></textarea>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">Önizleme</h3>
              <div className="prose prose-sm max-w-none border p-4 bg-white rounded-md">
                <div dangerouslySetInnerHTML={{ __html: pageContent?.content || '' }} />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  disabled={saving}
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
              
              <Link 
                href="/publication-opportunities" 
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                Sayfayı Görüntüle
              </Link>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4">HTML İçerik Yardımcısı</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Başlıklar</h3>
            <div className="space-y-2">
              <div className="bg-gray-50 p-2 rounded">
                <code className="text-sm">&lt;h2&gt;Ana Başlık&lt;/h2&gt;</code>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <code className="text-sm">&lt;h3&gt;Alt Başlık&lt;/h3&gt;</code>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Paragraflar</h3>
            <div className="space-y-2">
              <div className="bg-gray-50 p-2 rounded">
                <code className="text-sm">&lt;p&gt;Paragraf metni...&lt;/p&gt;</code>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <code className="text-sm">&lt;strong&gt;Kalın metin&lt;/strong&gt;</code>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Listeler</h3>
            <div className="space-y-2">
              <div className="bg-gray-50 p-2 rounded">
                <code className="text-sm">
                  &lt;ul&gt;<br />
                  &nbsp;&nbsp;&lt;li&gt;Liste öğesi 1&lt;/li&gt;<br />
                  &nbsp;&nbsp;&lt;li&gt;Liste öğesi 2&lt;/li&gt;<br />
                  &lt;/ul&gt;
                </code>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <code className="text-sm">
                  &lt;ol&gt;<br />
                  &nbsp;&nbsp;&lt;li&gt;Sıralı liste öğesi 1&lt;/li&gt;<br />
                  &nbsp;&nbsp;&lt;li&gt;Sıralı liste öğesi 2&lt;/li&gt;<br />
                  &lt;/ol&gt;
                </code>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Diğer</h3>
            <div className="space-y-2">
              <div className="bg-gray-50 p-2 rounded">
                <code className="text-sm">&lt;a href="URL"&gt;Link metni&lt;/a&gt;</code>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <code className="text-sm">&lt;div class="bg-gray-100 p-4 rounded"&gt;Özel kutu&lt;/div&gt;</code>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-yellow-700">
          <strong>Not:</strong> Sayfa içeriği, veritabanında <code>pageContent</code> koleksiyonunda saklanmaktadır.
          HTML içeriği güvenli bir şekilde işlenmekte ve sayfada gösterilmektedir.
        </p>
      </div>
    </div>
  );
};

export default AdminPublicationOpportunitiesPage; 