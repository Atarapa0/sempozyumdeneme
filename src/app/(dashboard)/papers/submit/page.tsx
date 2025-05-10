'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';

export default function SubmitPaper() {
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    keywords: '',
    paperFile: null as File | null,
    coAuthors: '',
    presentationType: '',
    engineeringField: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  
  const router = useRouter();
  const { user } = useAuth();

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/submit-paper');
    }
  }, [user, router]);

  // Eğer kullanıcı giriş yapmamışsa, içerik gösterme
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-amber-700 mb-4">Bildiri Gönderimi için Giriş Yapmalısınız</h1>
          <p className="text-gray-600 mb-6">Bildiri gönderebilmek için lütfen giriş yapın veya hesabınız yoksa kayıt olun.</p>
          <div className="flex flex-col space-y-4">
            <Link href="/login?redirect=/submit-paper" className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded">
              Giriş Yap
            </Link>
            <Link href="/register" className="bg-white hover:bg-gray-100 text-amber-600 border border-amber-600 font-bold py-2 px-4 rounded">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        paperFile: e.target.files![0]
      }));
      
      if (errors.paperFile) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.paperFile;
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Başlık alanı zorunludur';
    }
    
    if (!formData.abstract.trim()) {
      newErrors.abstract = 'Özet alanı zorunludur';
    }
    
    if (!formData.keywords.trim()) {
      newErrors.keywords = 'Anahtar kelimeler alanı zorunludur';
    }
    
    if (!formData.paperFile) {
      newErrors.paperFile = 'Bildiri dosyası zorunludur';
    }
    
    if (!formData.presentationType) {
      newErrors.presentationType = 'Sunum tipi seçilmelidir';
    }
    
    if (!formData.engineeringField) {
      newErrors.engineeringField = 'Mühendislik alanı seçilmelidir';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      // Simüle edilmiş başarılı gönderim
      setTimeout(() => {
        setSubmitSuccess('Bildiriniz başarıyla gönderildi! İnceleme sürecinden sonra size bilgi verilecektir.');
        setFormData({
          title: '',
          abstract: '',
          keywords: '',
          paperFile: null,
          coAuthors: '',
          presentationType: '',
          engineeringField: '',
        });
        setIsSubmitting(false);
      }, 1500);
    } catch (err) {
      setSubmitError('Bildiri gönderimi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-amber-700 mb-8 text-center">Mühendislik Bildirisi Gönder</h1>
          
          <div className="bg-amber-50 rounded-lg shadow-sm overflow-hidden border border-amber-100">
            <div className="bg-amber-100 text-amber-800 py-4 px-6">
              <h2 className="text-xl font-bold">Bildiri Gönderim Formu</h2>
            </div>
            <div className="p-6">
              {submitSuccess && (
                <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
                  {submitSuccess}
                </div>
              )}
              
              {submitError && (
                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                  {submitError}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="engineeringField" className="block text-amber-800 font-medium mb-2">
                    Mühendislik Alanı
                  </label>
                  <select
                    id="engineeringField"
                    name="engineeringField"
                    value={formData.engineeringField}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 text-amber-800 bg-white ${
                      errors.engineeringField ? 'border-red-300' : 'border-amber-200'
                    }`}
                    required
                  >
                    <option value="">Mühendislik alanı seçin</option>
                    <option value="bilgisayar">Bilgisayar Mühendisliği</option>
                    <option value="elektrik">Elektrik-Elektronik Mühendisliği</option>
                    <option value="makine">Makine Mühendisliği</option>
                    <option value="insaat">İnşaat Mühendisliği</option>
                    <option value="endustri">Endüstri Mühendisliği</option>
                    <option value="yazilim">Yazılım Mühendisliği</option>
                    <option value="kimya">Kimya Mühendisliği</option>
                    <option value="gida">Gıda Mühendisliği</option>
                    <option value="cevre">Çevre Mühendisliği</option>
                    <option value="malzeme">Malzeme Mühendisliği</option>
                  </select>
                  {errors.engineeringField && (
                    <p className="text-red-500 text-sm mt-1">{errors.engineeringField}</p>
                  )}
                </div>

                <div className="mb-6">
                  <label htmlFor="title" className="block text-amber-800 font-medium mb-2">
                    Bildiri Başlığı
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 text-amber-800 bg-white ${
                      errors.title ? 'border-red-300' : 'border-amber-200'
                    }`}
                    placeholder="Bildirinizin başlığını girin"
                    required
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="abstract" className="block text-amber-800 font-medium mb-2">
                    Özet
                  </label>
                  <textarea
                    id="abstract"
                    name="abstract"
                    value={formData.abstract}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 text-amber-800 bg-white ${
                      errors.abstract ? 'border-red-300' : 'border-amber-200'
                    }`}
                    placeholder="Bildirinizin özetini girin (250-400 kelime)"
                    rows={6}
                    required
                  ></textarea>
                  {errors.abstract && (
                    <p className="text-red-500 text-sm mt-1">{errors.abstract}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="keywords" className="block text-amber-800 font-medium mb-2">
                    Anahtar Kelimeler
                  </label>
                  <input
                    type="text"
                    id="keywords"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 text-amber-800 bg-white ${
                      errors.keywords ? 'border-red-300' : 'border-amber-200'
                    }`}
                    placeholder="Anahtar kelimeleri virgülle ayırarak girin"
                    required
                  />
                  {errors.keywords && (
                    <p className="text-red-500 text-sm mt-1">{errors.keywords}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="coAuthors" className="block text-amber-800 font-medium mb-2">
                    Ortak Yazarlar (varsa)
                  </label>
                  <input
                    type="text"
                    id="coAuthors"
                    name="coAuthors"
                    value={formData.coAuthors}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 text-amber-800 bg-white"
                    placeholder="örn. Ahmet Yılmaz (Amasya Üniversitesi), Ayşe Demir (Örnek Enstitüsü)"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="presentationType" className="block text-amber-800 font-medium mb-2">
                    Sunum Tipi
                  </label>
                  <select
                    id="presentationType"
                    name="presentationType"
                    value={formData.presentationType}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 text-amber-800 bg-white ${
                      errors.presentationType ? 'border-red-300' : 'border-amber-200'
                    }`}
                    required
                  >
                    <option value="">Sunum tipi seçin</option>
                    <option value="oral">Sözlü Sunum</option>
                    <option value="poster">Poster Sunum</option>
                    <option value="virtual">Sanal Sunum</option>
                  </select>
                  {errors.presentationType && (
                    <p className="text-red-500 text-sm mt-1">{errors.presentationType}</p>
                  )}
                </div>

                <div className="mb-6">
                  <label htmlFor="paperFile" className="block text-amber-800 font-medium mb-2">
                    Bildiri Dosyası (PDF)
                  </label>
                  <input
                    type="file"
                    id="paperFile"
                    name="paperFile"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 text-amber-800 bg-white ${
                      errors.paperFile ? 'border-red-300' : 'border-amber-200'
                    }`}
                    required
                  />
                  {errors.paperFile && (
                    <p className="text-red-500 text-sm mt-1">{errors.paperFile}</p>
                  )}
                </div>
                
                <div className="mb-8">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="terms"
                      name="terms"
                      className="h-4 w-4 text-amber-500 focus:ring-amber-300 border-amber-300 rounded"
                      required
                    />
                    <label htmlFor="terms" className="ml-2 block text-amber-800">
                      Bildiri gönderim kurallarını okudum ve kabul ediyorum
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 transition duration-200 border border-amber-200 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Bildiri Gönder'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-amber-100">
            <h3 className="text-lg font-bold text-amber-700 mb-4">Bildiri Konuları</h3>
            <ul className="list-disc pl-5 space-y-2 text-amber-700">
              <li>Yapay Zeka ve Makine Öğrenmesi Uygulamaları</li>
              <li>Endüstri 4.0 ve Akıllı Üretim Sistemleri</li>
              <li>Yenilenebilir Enerji Teknolojileri</li>
              <li>Sürdürülebilir Mühendislik Çözümleri</li>
              <li>Robotik ve Otomasyon Sistemleri</li>
              <li>Nesnelerin İnterneti (IoT) Uygulamaları</li>
              <li>Büyük Veri Analizi ve Veri Madenciliği</li>
              <li>Siber Güvenlik ve Ağ Sistemleri</li>
              <li>Akıllı Şehirler ve Altyapı Sistemleri</li>
              <li>Malzeme Bilimi ve Nanoteknoloji</li>
            </ul>
          </div>

          <div className="mt-8 bg-amber-50 rounded-lg shadow-sm overflow-hidden border border-amber-100">
            <div className="bg-amber-100 text-amber-800 py-4 px-6">
              <h2 className="text-xl font-bold">Gönderim Kuralları</h2>
            </div>
            <div className="p-6">
              <ul className="list-disc pl-5 space-y-2 text-amber-700">
                <li>Bildiriler mühendislik alanında özgün araştırma sonuçları içermelidir.</li>
                <li>Bildiriler Türkçe veya İngilizce olarak hazırlanabilir.</li>
                <li>Bildiri özeti en az 250, en fazla 400 kelime olmalıdır.</li>
                <li>Tam metin bildiriler, IEEE formatında hazırlanmalıdır.</li>
                <li>Bildiriler çift kör hakem değerlendirme sürecinden geçecektir.</li>
                <li>Kabul edilen bildirilerin en az bir yazarı sempozyumda sunum yapmalıdır.</li>
              </ul>
              <div className="mt-4">
                <Link href="/papers/template" className="text-amber-600 hover:text-amber-500 font-medium">
                  IEEE Bildiri Şablonunu İndir
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
