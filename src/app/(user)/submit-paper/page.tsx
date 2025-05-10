'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { bildiriService, getAktifAnaKonular, getBildiriKonulari, sempozyumService } from '@/lib/services';
import { apiClient } from '@/lib/services/api.client';
import { toast } from 'react-hot-toast';

interface Message {
  type: 'success' | 'error';
  text: string;
}

export default function SubmitPaperPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [mainTopics, setMainTopics] = useState<any[]>([]);
  const [paperTopics, setPaperTopics] = useState<any[]>([]);
  const [filteredPaperTopics, setFilteredPaperTopics] = useState<any[]>([]);
  const [message, setMessage] = useState<Message | null>(null);
  const [activeSempozyum, setActiveSempozyum] = useState<any>(null);
  const [showMainTopicWarning, setShowMainTopicWarning] = useState(false);
  const [showPaperTopicWarning, setShowPaperTopicWarning] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    anaKonuId: '',
    bildiriKonusuId: '',
    baslik: '',
    baslikEn: '',
    ozet: '',
    ozetEn: '',
    yazarlar: [''],
    anahtarKelimeler: [''],
    anahtarKelimelerEn: [''],
    sunumTipi: 'sözlü',
    kongreyeMesaj: ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add useEffect to filter paper topics when ana konu changes
  useEffect(() => {
    if (formData.anaKonuId && paperTopics.length > 0) {
      const filtered = paperTopics.filter((topic: any) => {
        const topicMainId = topic.mainTopicId || topic.anaKonuId;
        return topicMainId?.toString() === formData.anaKonuId.toString();
      });
      
      setFilteredPaperTopics(filtered);
      
      // Reset bildiriKonusuId when ana konu changes
      if (formData.bildiriKonusuId && !filtered.some(topic => topic.id.toString() === formData.bildiriKonusuId)) {
        setFormData(prev => ({
          ...prev,
          bildiriKonusuId: ''
        }));
      }
    } else {
      setFilteredPaperTopics([]);
    }
  }, [formData.anaKonuId, paperTopics]);

  useEffect(() => {
    // Token kontrolü - her sayfa yüklendiğinde token'ı kontrol et
    const checkToken = () => {
      const token = localStorage.getItem('token');
      console.log('Token kontrolü:', token ? 'Token mevcut' : 'Token bulunamadı');
      
      if (!token) {
        setError('Oturum bilgisi bulunamadı. Lütfen giriş yapın veya sayfayı yenileyin.');
        return false;
      }
      return true;
    };

    if (!checkToken()) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Aktif sempozyumu getir
        const activeSempozyum = await sempozyumService.getAktifSempozyum();
        setActiveSempozyum(activeSempozyum);
        
        if (!activeSempozyum) {
          setError('Şu anda aktif bir sempozyum bulunmamaktadır. Bildiri gönderimi için aktif bir sempozyum olması gerekmektedir.');
          setLoading(false);
          return;
        }

        // Ana konuları getir
        const mainTopicsData = await getAktifAnaKonular();
        if (mainTopicsData && mainTopicsData.length > 0) {
          setMainTopics(mainTopicsData);
          
          // Bildiri konularını getir
          const paperTopicsData = await getBildiriKonulari();
          if (paperTopicsData && paperTopicsData.length > 0) {
            setPaperTopics(paperTopicsData);
            
            // Don't pre-select any main topic, make the user choose explicitly
            setFilteredPaperTopics([]);
          }
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        setError('Veri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyiniz.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Token kontrolü
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Bildiri göndermek için lütfen giriş yapın.");
        setLoading(false);
        return;
      }

      // Kullanıcı bilgilerini kontrol et
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError("Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      if (!user.id) {
        setError("Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.");
        setLoading(false);
        return;
      }

      // Aktif sempozyum var mı kontrol et
      if (!activeSempozyum) {
        setError("Aktif sempozyum bulunamadı.");
        setLoading(false);
        return;
      }

      // Form validasyonları
      if (!formData.baslik || !formData.ozet || !formData.anaKonuId || !formData.bildiriKonusuId) {
        setError("Lütfen tüm zorunlu alanları doldurunuz.");
        setLoading(false);
        return;
      }

      if (formData.yazarlar.length === 0) {
        setError("En az bir yazar eklemelisiniz.");
        setLoading(false);
        return;
      }

      if (formData.anahtarKelimeler.length === 0) {
        setError("En az bir anahtar kelime eklemelisiniz.");
        setLoading(false);
        return;
      }

      if (!selectedFile) {
        setError("Lütfen bildiri dosyasını yükleyiniz.");
        setLoading(false);
        return;
      }

      // Upload file
      const formDataForUpload = new FormData();
      formDataForUpload.append('file', selectedFile);
      formDataForUpload.append('sempozyumId', activeSempozyum.id.toString());

      // Dosya yükleme işlemi
      let dosyaUrl;
      try {
        console.log('📤 Dosya yükleme başlıyor, token:', token.substring(0, 15) + '...');
        
        const uploadResponse = await fetch('/api/bildiri/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataForUpload
        });

        if (!uploadResponse.ok) {
          if (uploadResponse.status === 401) {
            throw new Error('Yetkilendirme hatası. Oturumunuz sonlanmış olabilir. Lütfen sayfayı yenileyip tekrar giriş yapın.');
          }
          
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Dosya yükleme sırasında bir hata oluştu.');
        }

        const responseData = await uploadResponse.json();
        dosyaUrl = responseData.fileInfo.url;
        console.log('✅ Dosya başarıyla yüklendi:', dosyaUrl);
      } catch (uploadError) {
        console.error('Dosya yükleme hatası:', uploadError);
        throw new Error(uploadError instanceof Error ? uploadError.message : 'Dosya yükleme sırasında bir hata oluştu.');
      }

      // Bildiri verilerini hazırla ve gönder
      const bildiriData = {
        ...formData,
        yazarlar: formData.yazarlar.map((yazar) => JSON.stringify(yazar)),
        anahtarKelimeler: formData.anahtarKelimeler,
        anahtarKelimelerEn: formData.anahtarKelimelerEn,
        dokuman: dosyaUrl,
        kullaniciId: user.id,
        sempozyumId: activeSempozyum.id,
        anaKonuId: parseInt(formData.anaKonuId as string),
        bildiriKonusuId: parseInt(formData.bildiriKonusuId as string)
      };

      console.log("Bildiri gönderiliyor...", bildiriData);

      // Bildiri servisini çağır
      const bildiri = await bildiriService.add(bildiriData);
      console.log("Bildiri başarıyla eklendi: ", bildiri);

      // Başarılı bildirim ve form sıfırlama
      toast.success("Bildiri başarıyla gönderildi.");
      
      // Form verilerini sıfırla
      setFormData({
        anaKonuId: '',
        bildiriKonusuId: '',
        baslik: '',
        baslikEn: '',
        ozet: '',
        ozetEn: '',
        yazarlar: [''],
        anahtarKelimeler: [''],
        anahtarKelimelerEn: [''],
        sunumTipi: 'sözlü',
        kongreyeMesaj: ''
      });
      setSelectedFile(null);
      
      // Display success message
      setMessage({ type: 'success', text: 'Bildiri başarıyla gönderildi! Bildirilerinizi "Bildirilerim" sayfasından görüntüleyebilirsiniz.' });
    } catch (error: any) {
      console.error("Bildiri gönderme hatası:", error);
      
      // Hata mesajını doğrudan ekranda göster
      setError(error.message || "Bildiri gönderilirken bir hata oluştu.");
      
      // Hata bildirimi göster
      toast.error(error.message || "Bildiri gönderilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bildiri Gönder</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Hata! </strong>
          <span className="block sm:inline">{error}</span>
          <p className="text-sm mt-2">
            Sorun devam ederse lütfen <a href="mailto:info@sempozyum.org" className="underline">info@sempozyum.org</a> adresinden bizimle iletişime geçin.
          </p>
        </div>
      )}
      
      {message && (
        <div className={`px-4 py-3 rounded relative mb-6 ${message.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`} role="alert">
          <strong className="font-bold">{message.type === 'success' ? 'Başarılı! ' : 'Hata! '}</strong>
          <span className="block sm:inline">{message.text}</span>
        </div>
      )}
      
      {!activeSempozyum ? (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md">
          Şu anda aktif bir sempozyum bulunmamaktadır. Bildiri gönderimi için aktif bir sempozyum olması gerekmektedir.
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bildiri Başlığı (Türkçe)</label>
              <input
                type="text"
                name="baslik"
                value={formData.baslik}
                onChange={(e) => setFormData({ ...formData, baslik: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bildiri Başlığı (İngilizce)</label>
              <input
                type="text"
                name="baslikEn"
                value={formData.baslikEn}
                onChange={(e) => setFormData({ ...formData, baslikEn: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bildiri Özeti (Türkçe - en fazla 300 kelime)</label>
              <textarea
                name="ozet"
                value={formData.ozet}
                onChange={(e) => setFormData({ ...formData, ozet: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={6}
                maxLength={2000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.ozet.split(/\s+/).filter(Boolean).length}/300 kelime
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bildiri Özeti (İngilizce - en fazla 300 kelime)</label>
              <textarea
                name="ozetEn"
                value={formData.ozetEn}
                onChange={(e) => setFormData({ ...formData, ozetEn: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={6}
                maxLength={2000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.ozetEn.split(/\s+/).filter(Boolean).length}/300 kelime
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Yazarlar</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, yazarlar: [...formData.yazarlar, ''] })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Yazar Ekle
                </button>
              </div>
              
              {formData.yazarlar.map((author, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => {
                      const newAuthors = [...formData.yazarlar];
                      newAuthors[index] = e.target.value;
                      setFormData({ ...formData, yazarlar: newAuthors });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder={`Yazar ${index + 1}`}
                    required
                  />
                  {formData.yazarlar.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newAuthors = formData.yazarlar.filter((_, i) => i !== index);
                        setFormData({ ...formData, yazarlar: newAuthors });
                      }}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Anahtar Kelimeler (Türkçe)</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, anahtarKelimeler: [...formData.anahtarKelimeler, ''] })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Anahtar Kelime Ekle
                </button>
              </div>
              
              {formData.anahtarKelimeler.map((keyword, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => {
                      const newKeywords = [...formData.anahtarKelimeler];
                      newKeywords[index] = e.target.value;
                      setFormData({ ...formData, anahtarKelimeler: newKeywords });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder={`Anahtar Kelime ${index + 1}`}
                    required
                  />
                  {formData.anahtarKelimeler.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newKeywords = formData.anahtarKelimeler.filter((_, i) => i !== index);
                        setFormData({ ...formData, anahtarKelimeler: newKeywords });
                      }}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Anahtar Kelimeler (İngilizce)</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, anahtarKelimelerEn: [...formData.anahtarKelimelerEn, ''] })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Keyword
                </button>
              </div>
              
              {formData.anahtarKelimelerEn.map((keyword, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => {
                      const newKeywords = [...formData.anahtarKelimelerEn];
                      newKeywords[index] = e.target.value;
                      setFormData({ ...formData, anahtarKelimelerEn: newKeywords });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder={`Keyword ${index + 1}`}
                    required
                  />
                  {formData.anahtarKelimelerEn.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newKeywords = formData.anahtarKelimelerEn.filter((_, i) => i !== index);
                        setFormData({ ...formData, anahtarKelimelerEn: newKeywords });
                      }}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sunum Tipi</label>
              <select
                name="sunumTipi"
                value={formData.sunumTipi}
                onChange={(e) => setFormData({ ...formData, sunumTipi: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="oral">Sözlü Sunum</option>
                <option value="poster">Poster Sunumu</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ana Konu</label>
              <div className="relative">
                <select
                  name="anaKonuId"
                  value={formData.anaKonuId}
                  onChange={(e) => {
                    const newAnaKonuId = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      anaKonuId: newAnaKonuId,
                      bildiriKonusuId: '' // Reset bildiri konusu when ana konu changes
                    }));
                  }}
                  onMouseEnter={() => setShowMainTopicWarning(true)}
                  onMouseLeave={() => setShowMainTopicWarning(false)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Ana Konu Seçin</option>
                  {mainTopics.length > 0 ? (
                    mainTopics.map((topic) => (
                      <option key={topic.id} value={topic.id}>{topic.title}</option>
                    ))
                  ) : (
                    <option value="" disabled>Ana konular yüklenemedi</option>
                  )}
                </select>
                {showMainTopicWarning && (
                  <div className="absolute z-10 w-full p-2 mt-1 text-sm text-white bg-gray-800 rounded-md shadow-lg">
                    Lütfen en yakın ana konuyu seçiniz
                  </div>
                )}
              </div>
              {mainTopics.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  Ana konular yüklenemedi. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
                </p>
              )}
              
              {formData.anaKonuId && (
                <p className="text-xs text-blue-500 mt-1">
                  Ana konuyu değiştirdiğinizde bildiri konuları otomatik olarak filtrelenir.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bildiri Konusu</label>
              <div className="relative">
                <select
                  name="bildiriKonusuId"
                  value={formData.bildiriKonusuId}
                  onChange={(e) => setFormData({ ...formData, bildiriKonusuId: e.target.value })}
                  onMouseEnter={() => setShowPaperTopicWarning(true)}
                  onMouseLeave={() => setShowPaperTopicWarning(false)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  disabled={filteredPaperTopics.length === 0 && formData.anaKonuId === ''}
                >
                  {formData.anaKonuId === '' ? (
                    <option value="">Lütfen önce bir ana konu seçiniz</option>
                  ) : filteredPaperTopics.length === 0 ? (
                    <option value="" disabled>Bu ana konuya ait bildiri konusu bulunamadı</option>
                  ) : (
                    <>
                      <option value="">Bildiri Konusu Seçin</option>
                      {filteredPaperTopics.map((topic) => (
                        <option key={topic.id} value={topic.id}>{topic.title}</option>
                      ))}
                    </>
                  )}
                </select>
                {showPaperTopicWarning && (
                  <div className="absolute z-10 w-full p-2 mt-1 text-sm text-white bg-gray-800 rounded-md shadow-lg">
                    Lütfen en yakın bildiri konusunu seçiniz
                  </div>
                )}
              </div>
              {filteredPaperTopics.length === 0 && formData.anaKonuId && (
                <p className="text-xs text-red-500 mt-1">
                  Seçilen ana konuya ait bildiri konusu bulunmamaktadır. Lütfen başka bir ana konu seçiniz.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kongreye Mesaj (İsteğe Bağlı)</label>
              <textarea
                name="kongreyeMesaj"
                value={formData.kongreyeMesaj}
                onChange={(e) => setFormData({ ...formData, kongreyeMesaj: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Kongre düzenleme kuruluna iletmek istediğiniz mesajı buraya yazabilirsiniz."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bildiri Dosyası (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // PDF dosyası kontrolü
                    if (file.type !== 'application/pdf') {
                      setMessage({ type: 'error', text: 'Lütfen sadece PDF dosyası yükleyin.' });
                      return;
                    }
                    
                    // Dosya boyutu kontrolü (20MB)
                    if (file.size > 20 * 1024 * 1024) {
                      setMessage({ type: 'error', text: 'Dosya boyutu 20MB\'dan büyük olamaz.' });
                      return;
                    }
                    
                    setSelectedFile(file);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Sadece PDF formatında dosyalar kabul edilmektedir. Maksimum dosya boyutu: 20MB
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">Önemli Bilgiler</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>Bildiri özetiniz en fazla 300 kelime olmalıdır.</li>
                <li>Bildiri tam metni için şablonu <a href="#" className="text-blue-600 hover:underline">buradan</a> indirebilirsiniz.</li>
                <li>Bildiri değerlendirme süreci yaklaşık 2-3 hafta sürmektedir.</li>
                <li>Kabul edilen bildiriler için kayıt ücreti ödemeniz gerekmektedir.</li>
                <li>Bildiri gönderimi ile ilgili sorularınız için <a href="mailto:info@sempozyum.org" className="text-blue-600 hover:underline">info@sempozyum.org</a> adresine e-posta gönderebilirsiniz.</li>
              </ul>
            </div>
            
            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                Bildiri gönderim koşullarını ve <a href="/etik-kurallar" className="text-blue-600 hover:underline">etik kuralları</a> okudum ve kabul ediyorum.
              </label>
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Bildiri Gönder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 