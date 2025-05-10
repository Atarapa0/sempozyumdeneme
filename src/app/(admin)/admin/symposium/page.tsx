'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { sempozyumService } from '@/lib/services';

const AdminSymposiumPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning' | ''; text: string }>({ type: '', text: '' });
  const [activeSymposium, setActiveSymposium] = useState<any>(null);
  const [allSymposiums, setAllSymposiums] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    tarih: '',
    aktiflik: true
  });

  useEffect(() => {
    if (user) {
      if (user.role !== 'admin') {
        router.push('/');
        return;
      }
      fetchSymposiums();
    } else if (user === null) {
      router.push('/');
    }
  }, [user, router]);

  const fetchSymposiums = async () => {
    try {
      setLoading(true);
      // API'den tüm sempozyumları al
      const data = await sempozyumService.getAllSempozyumlar();
      setAllSymposiums(data);
      
      // Aktif sempozyumu bul
      const active = data.find((s: any) => s.aktiflik === true);
      setActiveSymposium(active || null);
      
      if (active) {
        setFormData({
          title: active.title,
          tarih: formatDateForInput(active.tarih),
          aktiflik: active.aktiflik
        });
      }
    } catch (error) {
      console.error('Error fetching symposium data:', error);
      setMessage({ type: 'error', text: 'Sempozyum bilgileri yüklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD formatına dönüştür
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleActiveSymposiumChange = async (sempozyumId: number) => {
    try {
      setSaving(true);
      
      // Token kontrolü
      const token = localStorage.getItem('token');
      console.log('Token kontrolü:', !!token);
      
      if (!token) {
        setMessage({ 
          type: 'error', 
          text: 'Oturum anahtarı bulunamadı. Lütfen tekrar giriş yapın.' 
        });
        return;
      }
      
      console.log(`Sempozyum ID ${sempozyumId} aktif yapılıyor...`);
      
      // Önce tüm sempozyumları pasif yap
      for (const sempozyum of allSymposiums) {
        if (sempozyum.aktiflik) {
          console.log(`Sempozyum ID ${sempozyum.id} pasif yapılıyor...`);
          await sempozyumService.updateSempozyum(sempozyum.id, { aktiflik: false });
          console.log(`Sempozyum ID ${sempozyum.id} pasif yapıldı.`);
        }
      }
      
      // Sonra seçilen sempozyumu aktif yap
      console.log(`Sempozyum ID ${sempozyumId} aktif yapılıyor...`);
      const updatedSempozyum = await sempozyumService.updateSempozyum(sempozyumId, { aktiflik: true });
      console.log('Güncellenen sempozyum:', updatedSempozyum);
      
      // Verileri yeniden yükle
      console.log('Sempozyumlar yeniden yükleniyor...');
      await fetchSymposiums();
      
      setMessage({ type: 'success', text: 'Aktif sempozyum başarıyla güncellendi.' });
    } catch (error: any) {
      console.error('Sempozyum aktifleştirme hatası:', error);
      
      let errorMessage = 'Sempozyum durumu güncellenirken bir hata oluştu.';
      
      // Hata detayları
      if (error.response) {
        console.error('API yanıt detayları:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        if (error.response.status === 401) {
          errorMessage = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.';
        } else if (error.response.status === 403) {
          errorMessage = 'Bu işlem için yetkiniz yok. Sadece admin kullanıcılar sempozyum güncelleyebilir.';
        } else if (error.response.data?.error) {
          errorMessage = `API Hatası: ${error.response.data.error}`;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Token kontrolü
      const token = localStorage.getItem('token');
      console.log('Token kontrolü:', !!token);
      
      if (!token) {
        setMessage({ 
          type: 'error', 
          text: 'Oturum anahtarı bulunamadı. Lütfen tekrar giriş yapın.' 
        });
        return;
      }
      
      if (activeSymposium) {
        // Mevcut sempozyumu güncelle
        console.log(`Sempozyum ID ${activeSymposium.id} güncelleniyor:`, formData);
        
        const updatedSempozyum = await sempozyumService.updateSempozyum(activeSymposium.id, {
          title: formData.title,
          tarih: formData.tarih,
          aktiflik: true
        });
        
        console.log('Güncellenen sempozyum:', updatedSempozyum);
        setMessage({ type: 'success', text: 'Sempozyum bilgileri başarıyla güncellendi.' });
      } else {
        // Yeni sempozyum oluşturmadan önce aktif sempozyum kontrolü
        const aktifSempozyum = allSymposiums.find(s => s.aktiflik);
        if (aktifSempozyum) {
          setMessage({ 
            type: 'error', 
            text: 'Yeni sempozyum oluşturmadan önce aktif sempozyumu pasif hale getirmelisiniz.' 
          });
          return;
        }
        
        // Yeni sempozyum oluştur
        console.log('Yeni sempozyum oluşturuluyor:', formData);
        
        const newSymposium = await sempozyumService.createSempozyum({
          title: formData.title,
          tarih: formData.tarih,
          aktiflik: true
        });
        
        console.log('Oluşturulan sempozyum:', newSymposium);
        
        // Yeni sempozyum için otomatik olarak genel bilgiler oluştur
        try {
          const { saveGenelBilgiler } = await import('@/lib/services');
          
          // Varsayılan genel bilgiler
          const currentYear = new Date().getFullYear();
          const defaultGenelBilgiler = {
            title: formData.title,
            subtitle: `${currentYear} Sempozyumu`,
            dates: `${new Date(formData.tarih).toLocaleDateString('tr-TR')}`,
            countdownDate: formData.tarih,
            description: `${formData.title} açıklaması`,
            longDescription: `${formData.title} detaylı açıklaması`,
            venue: "Belirlenecek",
            organizer: "Sempozyum Organizasyon Komitesi",
            year: currentYear,
            docentlikInfo: "",
            isActive: true
          };
          
          console.log('Yeni sempozyum için genel bilgiler kaydediliyor:', defaultGenelBilgiler);
          const genelBilgiler = await saveGenelBilgiler(defaultGenelBilgiler, newSymposium.id);
          console.log('Kaydedilen genel bilgiler:', genelBilgiler);
          
          setMessage({ type: 'success', text: 'Yeni sempozyum ve genel bilgileri başarıyla oluşturuldu.' });
        } catch (genelBilgilerError) {
          console.error('Genel bilgiler oluşturulurken hata:', genelBilgilerError);
          setMessage({ 
            type: 'warning', 
            text: 'Sempozyum oluşturuldu fakat genel bilgiler kaydedilemedi. Lütfen Ana Sayfa Yönetimi sayfasından genel bilgileri güncelleyin.' 
          });
        }
      }
      
      // Verileri yeniden yükle
      console.log('Sempozyumlar yeniden yükleniyor...');
      await fetchSymposiums();
    } catch (error: any) {
      console.error('Sempozyum kaydetme hatası:', error);
      
      let errorMessage = 'Sempozyum kaydedilirken bir hata oluştu.';
      
      // Hata detayları
      if (error.response) {
        console.error('API yanıt detayları:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        if (error.response.status === 401) {
          errorMessage = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.';
        } else if (error.response.status === 403) {
          errorMessage = 'Bu işlem için yetkiniz yok. Sadece admin kullanıcılar sempozyum oluşturabilir/güncelleyebilir.';
        } else if (error.response.data?.error) {
          errorMessage = `API Hatası: ${error.response.data.error}`;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  // Aktif sempozyumu pasif hale getirme fonksiyonu
  const handleDeactivateSymposium = async (sempozyumId: number) => {
    try {
      setSaving(true);
      
      // Token kontrolü
      const token = localStorage.getItem('token');
      console.log('Token kontrolü:', !!token);
      
      if (!token) {
        setMessage({ 
          type: 'error', 
          text: 'Oturum anahtarı bulunamadı. Lütfen tekrar giriş yapın.' 
        });
        return;
      }
      
      console.log(`Sempozyum ID ${sempozyumId} pasif yapılıyor...`);
      
      // Sempozyumu pasif yap
      const updatedSempozyum = await sempozyumService.updateSempozyum(sempozyumId, { aktiflik: false });
      console.log('Pasif yapılan sempozyum:', updatedSempozyum);
      
      // Verileri yeniden yükle
      console.log('Sempozyumlar yeniden yükleniyor...');
      await fetchSymposiums();
      
      setMessage({ type: 'success', text: 'Sempozyum başarıyla pasif hale getirildi.' });
    } catch (error: any) {
      console.error('Sempozyum pasif yapma hatası:', error);
      
      let errorMessage = 'Sempozyum pasif hale getirilirken bir hata oluştu.';
      
      // Hata detayları
      if (error.response) {
        console.error('API yanıt detayları:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        if (error.response.status === 401) {
          errorMessage = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.';
        } else if (error.response.status === 403) {
          errorMessage = 'Bu işlem için yetkiniz yok. Sadece admin kullanıcılar sempozyum güncelleyebilir.';
        } else if (error.response.data?.error) {
          errorMessage = `API Hatası: ${error.response.data.error}`;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Sempozyum Yönetimi</h1>
          <Link 
            href="/admin/dashboard" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Dashboard'a Dön
          </Link>
        </div>

        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700' 
              : message.type === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Aktif Sempozyum Bilgileri */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 mb-8">
          <h2 className="text-xl font-bold border-b pb-2">Aktif Sempozyum</h2>
          
          {activeSymposium ? (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold">{activeSymposium.title}</h3>
              <p className="text-gray-600">Tarih: {new Date(activeSymposium.tarih).toLocaleDateString('tr-TR')}</p>
              <div className="flex justify-end mt-4 space-x-4">
                <button
                  onClick={() => handleDeactivateSymposium(activeSymposium.id)}
                  disabled={saving}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {saving ? 'İşleniyor...' : 'Pasif Yap'}
                </button>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Aktif</span>
              </div>
            </div>
          ) : (
            <p className="text-amber-700">Şu anda aktif bir sempozyum bulunmuyor.</p>
          )}
        </div>

        {/* Sempozyum Düzenleme Formu */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 mb-8">
          <h2 className="text-xl font-bold border-b pb-2">
            {activeSymposium ? 'Sempozyumu Düzenle' : 'Yeni Sempozyum Oluştur'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="title">
                Sempozyum Başlığı
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={activeSymposium && !activeSymposium.aktiflik}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="tarih">
                Sempozyum Tarihi
              </label>
              <input
                type="date"
                id="tarih"
                name="tarih"
                value={formData.tarih}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={activeSymposium && !activeSymposium.aktiflik}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving || (activeSymposium && !activeSymposium.aktiflik)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Kaydediliyor...' : activeSymposium ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </div>

        {/* Tüm Sempozyumlar Listesi */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Tüm Sempozyumlar</h2>
          
          {allSymposiums.length > 0 ? (
            <div className="space-y-4">
              {allSymposiums.map((sempozyum) => (
                <div key={sempozyum.id} className="p-4 border rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{sempozyum.title}</h3>
                    <p className="text-sm text-gray-600">Tarih: {new Date(sempozyum.tarih).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span 
                      className={`px-3 py-1 rounded-full text-sm ${
                        sempozyum.aktiflik 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {sempozyum.aktiflik ? 'Aktif' : 'Pasif'}
                    </span>
                    {!sempozyum.aktiflik && (
                      <button
                        onClick={() => handleActiveSymposiumChange(sempozyum.id)}
                        disabled={saving}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        {saving ? 'İşleniyor...' : 'Aktif Yap'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Henüz sempozyum bulunmuyor.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSymposiumPage; 