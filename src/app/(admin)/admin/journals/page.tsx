'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import apiClient from '@/lib/apiClient';
import { Journal } from '@/lib/types';
import { FaEdit, FaTrash, FaPlus, FaEye } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

// Token alma fonksiyonu
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const AdminJournalsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [symposiums, setSymposiums] = useState<{id: number, title: string}[]>([]);
  
  // Dosya yükleme durumları için state'ler
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state for new journal
  const [newJournal, setNewJournal] = useState({
    title: '',
    description: '',
    publishDate: '',
    coverImage: '',
    pdfUrl: '',
    symposiumId: '1' // Default symposium ID
  });
  
  // Form state for editing journal
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  
  useEffect(() => {
    if (user) {
      if (user.role !== 'admin') {
        router.push('/');
        return;
      }
      
      fetchJournals();
      fetchSymposiums();
    } else if (user === null) {
      // Kullanıcı yüklendi ama admin değil
      router.push('/');
    }
    // user undefined ise hala yükleniyor demektir, bir şey yapmıyoruz
  }, [user, router]);
  
  const fetchJournals = async () => {
    try {
      setLoading(true);
      console.log('Dergiler alınıyor...');
      
      const token = getToken();
      if (!token) {
        console.error('Token bulunamadı - dergiler alınamayacak');
        setMessage({ type: 'error', text: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.' });
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/dergi', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Dergiler alındı, sonuç:', response.status, data ? data.length : 0);
      
      if (!response.ok) {
        console.error('Dergi listesi hatası:', data);
        throw new Error(data.error || 'Dergiler alınırken bir hata oluştu');
      }
      
      setJournals(data);
    } catch (error: any) {
      console.error('Error fetching journals:', error);
      setMessage({ type: 'error', text: error.message || 'Dergiler yüklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSymposiums = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/sempozyum', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSymposiums(data);
        // Eğer sempozyum varsa, varsayılan olarak ilkini seç
        if (data.length > 0) {
          setNewJournal(prev => ({
            ...prev,
            symposiumId: data[0].id.toString()
          }));
        }
      } else {
        console.error('Sempozyumlar alınırken hata:', data);
      }
    } catch (error) {
      console.error('Sempozyumlar alınırken hata:', error);
    }
  };
  
  const handleNewJournalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewJournal(prev => ({ ...prev, [name]: value }));
  };
  
  // Dosya yükleme fonksiyonları
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCoverFile(e.target.files[0]);
    }
  };
  
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };
  
  const handleEditCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setEditCoverFile(e.target.files[0]);
    }
  };
  
  const handleEditPdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setEditPdfFile(e.target.files[0]);
    }
  };
  
  // Dosya yükleme işlevi
  const uploadFile = async (file: File, fileType: 'cover' | 'pdf'): Promise<string> => {
    try {
      setUploading(true);
      console.log(`${fileType} dosyası yükleniyor:`, file.name, file.type, file.size);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      
      const token = getToken();
      if (!token) {
        console.error('Token bulunamadı!');
        throw new Error('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      }
      
      const response = await fetch('/api/upload/journal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });
      
      const data = await response.json();
      console.log(`${fileType} dosyası yükleme yanıtı:`, response.status, data);
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || `${fileType === 'cover' ? 'Kapak görseli' : 'PDF'} yüklenirken bir hata oluştu`);
      }
      
      return data.url;
    } catch (error: any) {
      console.error(`Dosya yükleme hatası (${fileType}):`, error);
      throw error;
    } finally {
      setUploading(false);
    }
  };
  
  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newJournal.title || !newJournal.description || !newJournal.publishDate) {
      setMessage({ type: 'error', text: 'Lütfen gerekli alanları doldurun.' });
      return;
    }
    
    try {
      setLoading(true);
      
      // Kapak görseli yükle
      let coverImageUrl = newJournal.coverImage;
      
      if (coverFile) {
        try {
          console.log('Kapak dosyası yükleniyor...');
          coverImageUrl = await uploadFile(coverFile, 'cover');
          console.log('Kapak dosyası yüklendi:', coverImageUrl);
        } catch (error: any) {
          console.error('Kapak yükleme hatası:', error);
          setMessage({ type: 'error', text: error.message || 'Kapak görseli yüklenirken bir hata oluştu.' });
          setLoading(false);
          return;
        }
      }
      
      // PDF URL'sini doğrudan kullan
      const pdfUrl = newJournal.pdfUrl;
      
      // API beklediği alan isimlerini kullanarak veriyi hazırla
      const journalData = {
        ad: newJournal.title,
        aciklama: newJournal.description,
        yayinTarihi: newJournal.publishDate,
        kapakGorselUrl: coverImageUrl || "", // Eğer null ise boş string gönder
        pdfDosya: pdfUrl || "", // PDF URL'sini gönder
        sempozyumId: parseInt(newJournal.symposiumId)
      };
      
      console.log("Gönderilen dergi verisi:", journalData);
      
      // Token al ve kontrol et
      const token = getToken();
      if (!token) {
        setMessage({ type: 'error', text: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.' });
        setLoading(false);
        return;
      }
      
      // Headers'ı doğru şekilde ayarlıyoruz
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      console.log("API isteği gönderiliyor, headers:", headers);
      
      // API isteği yaparken headers tanımını kullan
      const response = await fetch('/api/dergi', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(journalData)
      });
      
      // Yanıtı al
      let data;
      try {
        const responseText = await response.text();
        console.log('API yanıt metni:', responseText);
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('API yanıtı parse hatası:', parseError);
        throw new Error('API yanıtı işlenirken bir hata oluştu');
      }
      
      console.log("API yanıtı:", response.status, data);
      
      if (!response.ok) {
        console.error("API Hata yanıtı:", data);
        throw new Error(data.error || data.detay || 'Dergi eklenirken bir hata oluştu');
      }
      
      // Reset form
      setNewJournal({
        title: '',
        description: '',
        publishDate: '',
        coverImage: '',
        pdfUrl: '',
        symposiumId: symposiums.length > 0 ? symposiums[0].id.toString() : '1'
      });
      setCoverFile(null);
      
      // Refresh journals list
      await fetchJournals();
      
      setMessage({ type: 'success', text: 'Dergi başarıyla eklendi.' });
    } catch (error: any) {
      console.error('Error adding journal:', error);
      setMessage({ type: 'error', text: error.message || 'Dergi eklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditClick = (journal: Journal) => {
    setEditingJournal(journal);
  };
  
  const handleEditingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingJournal) {
      setEditingJournal({ ...editingJournal, [name]: value });
    }
  };
  
  const handleUpdateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingJournal) return;
    
    // Validate form
    if (!editingJournal.title || !editingJournal.description || !editingJournal.publishDate) {
      setMessage({ type: 'error', text: 'Lütfen gerekli alanları doldurun.' });
      return;
    }
    
    try {
      setLoading(true);
      console.log('Dergi güncelleniyor, ID:', editingJournal.id);
      
      // Kapak görseli yükle
      let coverImageUrl = editingJournal.coverImage || '';
      
      if (editCoverFile) {
        try {
          console.log('Kapak dosyası yükleniyor (güncelleme)...');
          coverImageUrl = await uploadFile(editCoverFile, 'cover');
          console.log('Kapak dosyası yüklendi (güncelleme):', coverImageUrl);
        } catch (error: any) {
          console.error('Kapak yükleme hatası (güncelleme):', error);
          setMessage({ type: 'error', text: error.message || 'Kapak görseli yüklenirken bir hata oluştu.' });
          setLoading(false);
          return;
        }
      }
      
      // PDF URL'sini doğrudan kullan
      const pdfUrl = editingJournal.pdfUrl || '';
      
      // API beklediği alan isimlerini kullanarak veriyi hazırla
      const journalData = {
        ad: editingJournal.title,
        aciklama: editingJournal.description,
        yayinTarihi: editingJournal.publishDate,
        kapakGorselUrl: coverImageUrl || "", // Eğer null ise boş string gönder
        pdfDosya: pdfUrl || "", // PDF URL'sini gönder
        sempozyumId: parseInt(editingJournal.symposiumId),
      };
      
      console.log("Güncellenen dergi verisi:", journalData);
      
      const token = getToken();
      if (!token) {
        setMessage({ type: 'error', text: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.' });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/dergi/${editingJournal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(journalData)
      });
      
      // Yanıtı al
      let data;
      try {
        const responseText = await response.text();
        console.log('Güncelleme API yanıt metni:', responseText);
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Güncelleme API yanıtı parse hatası:', parseError);
        throw new Error('API yanıtı işlenirken bir hata oluştu');
      }
      
      console.log("Güncelleme API yanıtı:", response.status, data);
      
      if (!response.ok) {
        console.error("API Hata yanıtı (güncelleme):", data);
        throw new Error(data.error || data.detay || 'Dergi güncellenirken bir hata oluştu');
      }
      
      // Reset editing state
      setEditingJournal(null);
      setEditCoverFile(null);
      
      // Refresh journals list
      await fetchJournals();
      
      setMessage({ type: 'success', text: 'Dergi başarıyla güncellendi.' });
    } catch (error: any) {
      console.error('Error updating journal:', error);
      setMessage({ type: 'error', text: error.message || 'Dergi güncellenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteJournal = async (id: string) => {
    if (!window.confirm('Bu dergiyi silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Dergi siliniyor, ID: ${id}`);
      
      const token = getToken();
      if (!token) {
        setMessage({ type: 'error', text: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.' });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/dergi/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log("Silme işlemi yanıtı:", response.status, data);
      
      if (!response.ok) {
        console.error("Silme hatası:", data);
        throw new Error(data.error || data.detay || 'Dergi silinirken bir hata oluştu');
      }
      
      // Refresh journals list
      await fetchJournals();
      
      setMessage({ type: 'success', text: 'Dergi başarıyla silindi.' });
    } catch (error: any) {
      console.error('Error deleting journal:', error);
      setMessage({ type: 'error', text: error.message || 'Dergi silinirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingJournal(null);
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dergi Yönetimi</h1>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sol Taraf - Dergi Ekleme/Düzenleme Formu */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">
              {editingJournal ? 'Dergi Düzenle' : 'Yeni Dergi Ekle'}
            </h2>
            
            <form onSubmit={editingJournal ? handleUpdateJournal : handleAddJournal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dergi Adı</label>
                <input
                  type="text"
                  name="title"
                  value={editingJournal ? editingJournal.title : newJournal.title}
                  onChange={editingJournal ? handleEditingChange : handleNewJournalChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  name="description"
                  value={editingJournal ? editingJournal.description : newJournal.description}
                  onChange={editingJournal ? handleEditingChange : handleNewJournalChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  required
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yayın Tarihi</label>
                <input
                  type="date"
                  name="publishDate"
                  value={editingJournal ? editingJournal.publishDate : newJournal.publishDate}
                  onChange={editingJournal ? handleEditingChange : handleNewJournalChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapak Görseli</label>
                {editingJournal?.coverImage && (
                  <div className="mb-2">
                    <Image 
                      src={editingJournal.coverImage} 
                      alt="Mevcut kapak" 
                      width={100} 
                      height={140} 
                      className="border rounded object-cover"
                    />
                    <p className="text-xs text-gray-500 mt-1">Mevcut kapak görseli</p>
                  </div>
                )}
                <input
                  type="file"
                  name="coverFile"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={editingJournal ? handleEditCoverFileChange : handleCoverFileChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  JPEG, PNG, WebP veya GIF formatındaki görseller kabul edilir.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF Dosyası</label>
                {editingJournal?.pdfUrl && (
                  <div className="mb-2">
                    <a href={editingJournal.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                      <i className="text-base mr-1">📄</i> Mevcut PDF dosyasını görüntüle
                    </a>
                  </div>
                )}
                <input
                  type="url"
                  name="pdfUrl"
                  placeholder="https://example.com/dosya.pdf"
                  value={editingJournal ? editingJournal.pdfUrl : newJournal.pdfUrl}
                  onChange={editingJournal ? handleEditingChange : handleNewJournalChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PDF dosyasına erişilebilecek tam URL adresini girin.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sempozyum</label>
                <select
                  name="symposiumId"
                  value={editingJournal ? editingJournal.symposiumId : newJournal.symposiumId}
                  onChange={editingJournal ? handleEditingChange : handleNewJournalChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {symposiums.map(symposium => (
                    <option key={symposium.id} value={symposium.id.toString()}>
                      {symposium.title}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Uyarı mesajı */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Not:</strong> Kapak görseli ve PDF dosyası opsiyoneldir. Daha sonra da ekleyebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  disabled={loading || uploading}
                >
                  {uploading ? 'Dosyalar Yükleniyor...' : 
                   loading ? 'İşleniyor...' : 
                   editingJournal ? 'Güncelle' : 'Ekle'}
                </button>
                
                {editingJournal && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                    disabled={uploading}
                  >
                    İptal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Sağ Taraf - Dergi Listesi */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Mevcut Dergiler</h2>
            
            {journals.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded">
                <p className="text-gray-600">Henüz dergi bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {journals.map(journal => (
                  <div key={journal.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex">
                        <div className="w-24 h-32 bg-gray-100 rounded mr-4 flex-shrink-0 relative">
                          {journal.coverImage && typeof journal.coverImage === 'string' ? (
                            <Image
                              src={journal.coverImage}
                              alt={journal.title}
                              fill
                              className="object-cover rounded"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              Görsel Yok
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{journal.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Yayın Tarihi: {new Date(journal.publishDate).toLocaleDateString('tr-TR')}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            {journal.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(journal)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          title="Düzenle"
                        >
                          <i className="text-base">✏️</i>
                        </button>
                        <button
                          onClick={() => handleDeleteJournal(journal.id)}
                          className="text-red-600 hover:text-red-800 mr-2"
                          title="Sil"
                        >
                          <i className="text-base">🗑️</i>
                        </button>
                        {journal.pdfUrl ? (
                          <Link 
                            href={journal.pdfUrl} 
                            target="_blank"
                            className="text-green-600 hover:text-green-800"
                            title="Görüntüle"
                          >
                            <i className="text-base">👁️</i>
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="text-gray-400 cursor-not-allowed"
                            title="PDF Mevcut Değil"
                          >
                            <i className="text-base">👁️</i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminJournalsPage; 