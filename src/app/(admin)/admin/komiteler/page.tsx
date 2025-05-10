'use client';
// Komiteler sayfası - Veritabanından veri çekiyor
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  getKomiteUyeleri, 
  createKomiteUyesi, 
  deleteKomiteUyesi,
  KomiteUyesi,
  KomiteUyesiEkle,
  sempozyumService,
  Sempozyum
} from '@/lib/services';

// Komite türü tip tanımı
type KomiteTuru = 'bilim' | 'düzenleme' | 'yürütme' | 'danışma' | 'hakem';

// Unvan seçenekleri
const unvanSecenekleri = [
  'Prof. Dr.',
  'Doç. Dr.',
  'Dr. Öğr. Üyesi',
  'Dr.',
  'Arş. Gör. Dr.',
  'Arş. Gör.',
  'Öğr. Gör. Dr.',
  'Öğr. Gör.',
  'Araş. Gör.',
  'Diğer'
];

const KomitelerPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [symposium, setSymposium] = useState<Sempozyum | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Komite üyeleri state'i
  const [komiteUyeleri, setKomiteUyeleri] = useState<KomiteUyesi[]>([]);
  const [aktivKomiteTuru, setAktivKomiteTuru] = useState<KomiteTuru>('bilim');
  const [showKomiteForm, setShowKomiteForm] = useState(false);
  const [newKomiteUyesi, setNewKomiteUyesi] = useState<Partial<KomiteUyesiEkle>>({
    ad: '',
    soyad: '',
    unvan: '',
    kurum: '',
    komiteTur: 'bilim'
  });

  // Admin olmayan kullanıcıları ana sayfaya yönlendir
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Verileri yükle
  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === 'admin') {
        try {
          setLoading(true);
          
          // Aktif sempozyumu getir
          const symposiumData = await sempozyumService.getAktifSempozyum();
          setSymposium(symposiumData);
          
          // Eğer aktif sempozyum varsa komite üyelerini getir
          if (symposiumData) {
            const komiteData = await getKomiteUyeleri();
            setKomiteUyeleri(komiteData);
          }
          
        } catch (error) {
          console.error("Veri yüklenirken hata oluştu:", error);
          let errorMsg = "API Hatası: Bilinmeyen bir hata oluştu.";
          let errorDetails = "";

          if (error instanceof Error) {
            errorDetails = error.message;
          } else if (error instanceof Response) {
            if (error.status === 404) {
              errorMsg = 'API Hatası: Endpoint bulunamadı (404 Not Found)';
              errorDetails = `URL kontrolü: ${error.url}`;
            }
          }

          setMessage({ type: 'error', text: `${errorMsg}\nDetaylar: ${errorDetails}` });
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [user]);

  // Komite üyesi ekleme formu submit fonksiyonu
  const handleAddKomiteUyesi = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!symposium) {
        setMessage({ type: 'error', text: 'Aktif sempozyum bulunamadı. Komite üyesi eklemek için önce aktif bir sempozyum olmalıdır.' });
        return;
      }
      
      if (!newKomiteUyesi.ad || !newKomiteUyesi.soyad || !newKomiteUyesi.komiteTur) {
        setMessage({ type: 'error', text: 'Ad, soyad ve komite türü alanları zorunludur.' });
        return;
      }
      
      // Komite üyesini ekle
      const eklenenUye = await createKomiteUyesi({
        sempozyumId: symposium.id,
        ad: newKomiteUyesi.ad,
        soyad: newKomiteUyesi.soyad,
        unvan: newKomiteUyesi.unvan,
        kurum: newKomiteUyesi.kurum,
        komiteTur: newKomiteUyesi.komiteTur as KomiteTuru
      });
      
      // Komite üyeleri listesini güncelle
      setKomiteUyeleri([...komiteUyeleri, eklenenUye]);
      
      // Formu temizle
      setNewKomiteUyesi({
        ad: '',
        soyad: '',
        unvan: '',
        kurum: '',
        komiteTur: aktivKomiteTuru
      });
      
      // Formu kapat
      setShowKomiteForm(false);
      
      setMessage({ type: 'success', text: 'Komite üyesi başarıyla eklendi.' });
    } catch (error) {
      console.error("Komite üyesi eklenirken hata oluştu:", error);
      let errorMsg = 'Komite üyesi eklenirken bir hata oluştu.';
      let errorDetails = '';

      if (error instanceof Error) {
        errorDetails = error.message;
      } else if (error instanceof Response) {
        if (error.status === 404) {
          errorMsg = 'API Hatası: Endpoint bulunamadı (404 Not Found)';
          errorDetails = `API endpoint'in yeni adresi /api/komite olarak değiştirildi, ancak yine de bulunamıyor. URL kontrolü: ${error.url}`;
        }
      }

      setMessage({ type: 'error', text: `${errorMsg}\nDetaylar: ${errorDetails}` });
    } finally {
      setLoading(false);
    }
  };

  // Komite üyesi silme fonksiyonu
  const handleDeleteKomiteUyesi = async (id: number) => {
    try {
      if (!confirm('Bu komite üyesini silmek istediğinizden emin misiniz?')) {
        return;
      }
      
      setLoading(true);
      
      // Komite üyesini sil
      await deleteKomiteUyesi(id);
      
      // Komite üyeleri listesini güncelle
      setKomiteUyeleri(komiteUyeleri.filter(uye => uye.id !== id));
      
      setMessage({ type: 'success', text: 'Komite üyesi başarıyla silindi.' });
    } catch (error) {
      console.error("Komite üyesi silinirken hata oluştu:", error);
      setMessage({ type: 'error', text: 'Komite üyesi silinirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  // Filtrelenmiş komite üyeleri
  const filteredKomiteUyeleri = komiteUyeleri.filter(uye => uye.komiteTur === aktivKomiteTuru);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Komiteler Yönetimi</h1>
            <p className="mt-2 text-sm text-gray-600">
              {symposium 
                ? `${symposium.title} - Komite Yönetimi`
                : 'Aktif sempozyum bulunmamaktadır.'}
            </p>
          </div>
          <Link 
            href="/admin/dashboard" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded transition-colors"
          >
            ← Dashboard'a Dön
          </Link>
        </div>
        
        {/* Mesaj Gösterimi */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        {/* Aktif sempozyum kontrolü */}
        {!symposium ? (
          <div className="bg-red-100 border-l-4 border-red-500 p-6 mb-6 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold text-red-700 mb-2">
                  Aktif Sempozyum Bulunamadı!
                </h2>
                <p className="text-base text-red-700">
                  Komite yönetimi için önce bir sempozyum oluşturmanız veya mevcut bir sempozyumu aktifleştirmeniz gerekmektedir. Aktif sempozyum olmadan komite oluşturamazsınız.
                </p>
                <div className="mt-6">
                  <Link
                    href="/admin/symposium"
                    className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition ease-in-out duration-150"
                  >
                    Sempozyum Yönetimine Git
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Komiteler Bölümü */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Komite Üyeleri</h2>
                <button
                  onClick={() => setShowKomiteForm(!showKomiteForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                >
                  {showKomiteForm ? 'İptal' : 'Yeni Komite Üyesi Ekle'}
                </button>
              </div>
            
              {/* Komite üyesi ekleme formu */}
              {showKomiteForm && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-4">Yeni Komite Üyesi Ekle</h3>
                  <form onSubmit={handleAddKomiteUyesi} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unvan</label>
                        <select
                          value={newKomiteUyesi.unvan || ''}
                          onChange={(e) => setNewKomiteUyesi({...newKomiteUyesi, unvan: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Seçiniz</option>
                          {unvanSecenekleri.map((unvan) => (
                            <option key={unvan} value={unvan}>{unvan}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                        <input
                          type="text"
                          value={newKomiteUyesi.ad || ''}
                          onChange={(e) => setNewKomiteUyesi({...newKomiteUyesi, ad: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
                        <input
                          type="text"
                          value={newKomiteUyesi.soyad || ''}
                          onChange={(e) => setNewKomiteUyesi({...newKomiteUyesi, soyad: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kurum</label>
                        <input
                          type="text"
                          value={newKomiteUyesi.kurum || ''}
                          onChange={(e) => setNewKomiteUyesi({...newKomiteUyesi, kurum: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="Amasya Üniversitesi"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Komite Türü *</label>
                        <select
                          value={newKomiteUyesi.komiteTur || 'bilim'}
                          onChange={(e) => setNewKomiteUyesi({...newKomiteUyesi, komiteTur: e.target.value as KomiteTuru})}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        >
                          <option value="bilim">Bilim Komitesi</option>
                          <option value="düzenleme">Düzenleme Komitesi</option>
                          <option value="yürütme">Yürütme Komitesi</option>
                          <option value="danışma">Danışma Komitesi</option>
                          <option value="hakem">Hakem Komitesi</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                        disabled={loading}
                      >
                        {loading ? 'Ekleniyor...' : 'Ekle'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Komite türü seçimi */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex -mb-px space-x-8 overflow-x-auto">
                  <button
                    onClick={() => setAktivKomiteTuru('bilim')}
                    className={`py-4 px-1 ${aktivKomiteTuru === 'bilim' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'} font-medium text-sm whitespace-nowrap`}
                  >
                    Bilim Komitesi
                  </button>
                  <button
                    onClick={() => setAktivKomiteTuru('düzenleme')}
                    className={`py-4 px-1 ${aktivKomiteTuru === 'düzenleme' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'} font-medium text-sm whitespace-nowrap`}
                  >
                    Düzenleme Komitesi
                  </button>
                  <button
                    onClick={() => setAktivKomiteTuru('yürütme')}
                    className={`py-4 px-1 ${aktivKomiteTuru === 'yürütme' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'} font-medium text-sm whitespace-nowrap`}
                  >
                    Yürütme Komitesi
                  </button>
                  <button
                    onClick={() => setAktivKomiteTuru('danışma')}
                    className={`py-4 px-1 ${aktivKomiteTuru === 'danışma' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'} font-medium text-sm whitespace-nowrap`}
                  >
                    Danışma Komitesi
                  </button>
                  <button
                    onClick={() => setAktivKomiteTuru('hakem')}
                    className={`py-4 px-1 ${aktivKomiteTuru === 'hakem' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'} font-medium text-sm whitespace-nowrap`}
                  >
                    Hakem Komitesi
                  </button>
                </nav>
              </div>
              
              {/* Komite üyeleri listesi */}
              {filteredKomiteUyeleri.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kurum</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredKomiteUyeleri.map((uye) => (
                        <tr key={uye.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{uye.unvan} {uye.ad} {uye.soyad}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{uye.kurum || '—'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteKomiteUyesi(uye.id)}
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
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">{aktivKomiteTuru.charAt(0).toUpperCase() + aktivKomiteTuru.slice(1)} komitesinde henüz üye bulunmuyor.</p>
                  <button
                    onClick={() => setShowKomiteForm(true)}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Yeni Üye Ekle
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KomitelerPage; 