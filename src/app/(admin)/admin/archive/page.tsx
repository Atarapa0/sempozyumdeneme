'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import apiClient from '@/lib/apiClient';
import { Archive } from '@/lib/types';
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

const AdminArchivePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Dosya yükleme durumları için state'ler
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state for new archive
  const [newArchive, setNewArchive] = useState({
    title: '',
    description: '',
    coverImage: '',
    pdfUrl: ''
  });
  
  // Form state for editing archive
  const [editingArchive, setEditingArchive] = useState<Archive | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  
  useEffect(() => {
    if (user) {
      if (user.role !== 'admin') {
        router.push('/');
        return;
      }
      
      fetchArchives();
    } else if (user === null) {
      // Kullanıcı yüklendi ama admin değil
      router.push('/');
    }
    // user undefined ise hala yükleniyor demektir, bir şey yapmıyoruz
  }, [user, router]);
  
  const fetchArchives = async () => {
    try {
      setLoading(true);
      console.log('Arşivler alınıyor...');
      
      const token = getToken();
      if (!token) {
        console.error('Token bulunamadı - arşivler alınamayacak');
        setMessage({ type: 'error', text: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.' });
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/arsiv', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Arşivler alındı:', data.arsivler ? data.arsivler.length : 0);
      
      if (!response.ok) {
        console.error('Arşiv listesi hatası:', data);
        throw new Error(data.error || 'Arşivler alınırken bir hata oluştu');
      }
      
      // API yanıtındaki arsivler dizisini Archive tipine dönüştür
      const mappedArchives = data.arsivler.map((arsiv: any) => ({
        id: arsiv.id.toString(),
        title: arsiv.ad,
        description: arsiv.aciklama,
        coverImage: arsiv.kapakGorselUrl,
        pdfUrl: arsiv.pdfDosya,
        symposiumId: arsiv.sempozyumId.toString(),
        createdAt: arsiv.createdAt,
        updatedAt: arsiv.updatedAt
      }));
      
      setArchives(mappedArchives);
    } catch (error: any) {
      console.error('Error fetching archives:', error);
      setMessage({ type: 'error', text: error.message || 'Arşivler yüklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewArchiveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewArchive(prev => ({ ...prev, [name]: value }));
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
      
      // Yeni arşiv upload endpoint'ini kullan
      const response = await fetch('/api/upload/archive', {
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

  const handleAddArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newArchive.title || !newArchive.description) {
      setMessage({ type: 'error', text: 'Lütfen gerekli alanları doldurun.' });
      return;
    }
    
    try {
      setLoading(true);
      
      // Kapak görseli ve PDF dosyalarını yükle
      let coverImageUrl = newArchive.coverImage;
      let pdfUrl = newArchive.pdfUrl;
      
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
      
      if (pdfFile) {
        try {
          console.log('PDF dosyası yükleniyor...');
          pdfUrl = await uploadFile(pdfFile, 'pdf');
          console.log('PDF dosyası yüklendi:', pdfUrl);
        } catch (error: any) {
          console.error('PDF yükleme hatası:', error);
          setMessage({ type: 'error', text: error.message || 'PDF dosyası yüklenirken bir hata oluştu.' });
          setLoading(false);
          return;
        }
      }
      
      // Aktif sempozyumu bul
      let activeSempozyumId;
      try {
        const sempozyumResponse = await fetch('/api/sempozyum?active=true', {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });
        
        const sempozyumData = await sempozyumResponse.json();
        if (!sempozyumResponse.ok || !sempozyumData || !sempozyumData.length) {
          throw new Error('Aktif sempozyum bulunamadı');
        }
        
        activeSempozyumId = sempozyumData[0].id;
      } catch (error: any) {
        console.error('Sempozyum bulma hatası:', error);
        setMessage({ type: 'error', text: 'Aktif sempozyum bulunamadı. Lütfen önce bir sempozyum oluşturun.' });
        setLoading(false);
        return;
      }
      
      // API beklediği alan isimlerini kullanarak veriyi hazırla
      const archiveData = {
        sempozyumId: activeSempozyumId,
        ad: newArchive.title,
        aciklama: newArchive.description,
        yayinTarihi: new Date().toISOString().split('T')[0], // Bugünün tarihi
        kapakGorselUrl: coverImageUrl || "", // Eğer null ise boş string gönder
        pdfDosya: pdfUrl || "" // Eğer null ise boş string gönder
      };
      
      console.log("Gönderilen dergi verisi:", archiveData);
      
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
      const response = await fetch('/api/arsiv', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(archiveData)
      });
      
      const data = await response.json();
      console.log("API yanıtı:", response.status, data);
      
      if (!response.ok) {
        console.error("API Hata yanıtı:", data);
        throw new Error(data.error || data.detay || 'Arşiv eklenirken bir hata oluştu');
      }
      
      // Reset form
      setNewArchive({
        title: '',
        description: '',
        coverImage: '',
        pdfUrl: ''
      });
      setCoverFile(null);
      setPdfFile(null);
      
      // Refresh archives list
      await fetchArchives();
      
      setMessage({ type: 'success', text: 'Arşiv başarıyla eklendi.' });
    } catch (error: any) {
      console.error('Error adding archive:', error);
      setMessage({ type: 'error', text: error.message || 'Arşiv eklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditClick = (archive: Archive) => {
    setEditingArchive(archive);
  };
  
  const handleEditingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingArchive) {
      setEditingArchive({ ...editingArchive, [name]: value });
    }
  };

  const handleUpdateArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingArchive) return;
    
    // Validate form
    if (!editingArchive.title || !editingArchive.description) {
      setMessage({ type: 'error', text: 'Lütfen gerekli alanları doldurun.' });
      return;
    }
    
    try {
      setLoading(true);
      console.log('Arşiv güncelleniyor, ID:', editingArchive.id);
      
      // Kapak görseli ve PDF dosyalarını yükle
      let coverImageUrl = editingArchive.coverImage || '';
      let pdfUrl = editingArchive.pdfUrl || '';
      
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
      
      if (editPdfFile) {
        try {
          console.log('PDF dosyası yükleniyor (güncelleme)...');
          pdfUrl = await uploadFile(editPdfFile, 'pdf');
          console.log('PDF dosyası yüklendi (güncelleme):', pdfUrl);
        } catch (error: any) {
          console.error('PDF yükleme hatası (güncelleme):', error);
          setMessage({ type: 'error', text: error.message || 'PDF dosyası yüklenirken bir hata oluştu.' });
          setLoading(false);
          return;
        }
      }
      
      // API beklediği alan isimlerini kullanarak veriyi hazırla
      const archiveData = {
        ad: editingArchive.title,
        aciklama: editingArchive.description,
        kapakGorselUrl: coverImageUrl || "", // Eğer null ise boş string gönder
        pdfDosya: pdfUrl || "" // Eğer null ise boş string gönder
      };
      
      console.log("Güncellenen arşiv verisi:", archiveData);
      
      const token = getToken();
      if (!token) {
        setMessage({ type: 'error', text: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.' });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/arsiv/${editingArchive.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(archiveData)
      });
      
      const data = await response.json();
      console.log("Güncelleme API yanıtı:", response.status, data);
      
      if (!response.ok) {
        console.error("API Hata yanıtı (güncelleme):", data);
        throw new Error(data.error || data.detay || 'Arşiv güncellenirken bir hata oluştu');
      }
      
      // Reset editing state
      setEditingArchive(null);
      setEditCoverFile(null);
      setEditPdfFile(null);
      
      // Refresh archives list
      await fetchArchives();
      
      setMessage({ type: 'success', text: 'Arşiv başarıyla güncellendi.' });
    } catch (error: any) {
      console.error('Error updating archive:', error);
      setMessage({ type: 'error', text: error.message || 'Arşiv güncellenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteArchive = async (id: string) => {
    if (!window.confirm('Bu arşivi silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Arşiv siliniyor, ID: ${id}`);
      
      const token = getToken();
      if (!token) {
        setMessage({ type: 'error', text: 'Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.' });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/arsiv/${id}`, {
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
        throw new Error(data.error || data.detay || 'Arşiv silinirken bir hata oluştu');
      }
      
      // Refresh archives list
      await fetchArchives();
      
      setMessage({ type: 'success', text: 'Arşiv başarıyla silindi.' });
    } catch (error: any) {
      console.error('Error deleting archive:', error);
      setMessage({ type: 'error', text: error.message || 'Arşiv silinirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingArchive(null);
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
        <h1 className="text-2xl font-bold">Arşiv Yönetimi</h1>
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
        {/* Sol Taraf - Arşiv Ekleme/Düzenleme Formu */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">
              {editingArchive ? 'Arşiv Düzenle' : 'Yeni Arşiv Ekle'}
            </h2>
            
            <form onSubmit={editingArchive ? handleUpdateArchive : handleAddArchive} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arşiv Adı</label>
                <input
                  type="text"
                  name="title"
                  value={editingArchive ? editingArchive.title : newArchive.title}
                  onChange={editingArchive ? handleEditingChange : handleNewArchiveChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  name="description"
                  value={editingArchive ? editingArchive.description : newArchive.description}
                  onChange={editingArchive ? handleEditingChange : handleNewArchiveChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  required
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapak Görseli</label>
                {editingArchive?.coverImage && (
                  <div className="mb-2">
                    <Image 
                      src={editingArchive.coverImage} 
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
                  onChange={editingArchive ? handleEditCoverFileChange : handleCoverFileChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  JPEG, PNG, WebP veya GIF formatındaki görseller kabul edilir.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF Dosyası</label>
                {editingArchive?.pdfUrl && (
                  <div className="mb-2">
                    <Link href={editingArchive.pdfUrl} target="_blank" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                      <i className="text-base mr-1">📄</i> Mevcut PDF dosyasını görüntüle
                    </Link>
                  </div>
                )}
                <input
                  type="file"
                  name="pdfFile"
                  accept="application/pdf"
                  onChange={editingArchive ? handleEditPdfFileChange : handlePdfFileChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sadece PDF formatındaki dosyalar kabul edilir.
                </p>
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
                   editingArchive ? 'Güncelle' : 'Ekle'}
                </button>
                
                {editingArchive && (
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
        
        {/* Sağ Taraf - Arşiv Listesi */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Mevcut Arşivler</h2>
            
            {archives.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded">
                <p className="text-gray-600">Henüz arşiv bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {archives.map(archive => (
                  <div key={archive.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex">
                        <div className="w-24 h-32 bg-gray-100 rounded mr-4 flex-shrink-0 relative">
                          {archive.coverImage && typeof archive.coverImage === 'string' ? (
                            <Image
                              src={archive.coverImage}
                              alt={archive.title}
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
                          <h3 className="font-medium text-lg">{archive.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Oluşturulma: {new Date(archive.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            {archive.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(archive)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          title="Düzenle"
                        >
                          <i className="text-base">✏️</i>
                        </button>
                        <button
                          onClick={() => handleDeleteArchive(archive.id)}
                          className="text-red-600 hover:text-red-800 mr-2"
                          title="Sil"
                        >
                          <i className="text-base">🗑️</i>
                        </button>
                        {archive.pdfUrl ? (
                          <Link 
                            href={archive.pdfUrl} 
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

export default AdminArchivePage; 