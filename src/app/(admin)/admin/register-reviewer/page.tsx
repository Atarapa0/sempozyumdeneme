'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { userService } from '@/lib/services'; // Kullanıcı servisini ekledik

// Uzmanlık alanları listesi
const expertiseAreas = [
  'Yapay Zeka',
  'Veri Bilimi',
  'Makine Öğrenmesi',
  'Siber Güvenlik',
  'Robotik',
  'Gömülü Sistemler',
  'Bilgisayar Ağları',
  'Mobil Programlama',
  'Web Teknolojileri',
  'İnsan-Bilgisayar Etkileşimi',
  'Veritabanı Sistemleri',
  'Yazılım Mühendisliği',
  'Görüntü İşleme',
  'Doğal Dil İşleme',
  'Bulut Bilişim',
  'Nesnelerin İnterneti',
  'Endüstri 4.0',
  'Blok Zinciri',
  'Sanal/Artırılmış Gerçeklik',
  'Büyük Veri Analizi'
];

const RegisterReviewerPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    title: '',
    department: '',
    institution: '',
    phone: '',
    expertise: [] as string[],
    password: '',
    confirmPassword: '',
  });

  // Mesaj state
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin olmayan kullanıcıları ana sayfaya yönlendir
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Form değişikliklerini işleme
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Uzmanlık alanı seçme/seçimi kaldırma
  const handleExpertiseToggle = (expertise: string) => {
    if (formData.expertise.includes(expertise)) {
      setFormData({
        ...formData,
        expertise: formData.expertise.filter(e => e !== expertise)
      });
    } else {
      setFormData({
        ...formData,
        expertise: [...formData.expertise, expertise]
      });
    }
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    // Form doğrulama
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Şifreler eşleşmiyor.' });
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Şifre en az 6 karakter uzunluğunda olmalıdır.' });
      setIsSubmitting(false);
      return;
    }

    if (formData.expertise.length === 0) {
      setMessage({ type: 'error', text: 'En az bir uzmanlık alanı seçmelisiniz.' });
      setIsSubmitting(false);
      return;
    }

    try {
      // Ad ve soyadı ayrıştırma (boşluğa göre)
      const fullName = formData.name.trim();
      const lastSpaceIndex = fullName.lastIndexOf(' ');
      
      let firstName = fullName;
      let lastName = '';
      
      if (lastSpaceIndex !== -1) {
        firstName = fullName.substring(0, lastSpaceIndex).trim();
        lastName = fullName.substring(lastSpaceIndex + 1).trim();
      }
      
      // API'yi kullanarak hakem kaydı yap
      await userService.registerReviewer({
        ad: firstName,
        soyad: lastName || 'N/A', // Soyad boşsa 'N/A' olarak gönder
        eposta: formData.email,
        sifre: formData.password,
        unvan: formData.title,
        bolum: formData.department,
        universite: formData.institution,
        kurum: formData.institution,
        cepTel: formData.phone,
        uzmanlıkAlanları: formData.expertise,
      });
      
      // Başarılı mesajı göster
      setMessage({ 
        type: 'success', 
        text: `${formData.name} başarıyla hakem olarak kaydedildi.` 
      });
      
      // Formu temizle
      setFormData({
        email: '',
        name: '',
        title: '',
        department: '',
        institution: '',
        phone: '',
        expertise: [],
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Hakem kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.';
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
      console.error('Hakem kayıt hatası:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Hakem Kaydı</h1>
            <Link href="/admin/dashboard" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Admin Paneline Dön
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Sisteme yeni hakem eklemek için bu formu kullanın. Hakem bilgileri ve giriş şifresi otomatik olarak oluşturulacak ve e-posta adresine gönderilecektir.
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

        {/* Hakem Kayıt Formu */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-posta Adresi *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Unvan *
                  </label>
                  <select
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Prof. Dr.">Prof. Dr.</option>
                    <option value="Doç. Dr.">Doç. Dr.</option>
                    <option value="Dr. Öğr. Üyesi">Dr. Öğr. Üyesi</option>
                    <option value="Öğr. Gör. Dr.">Öğr. Gör. Dr.</option>
                    <option value="Arş. Gör. Dr.">Arş. Gör. Dr.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Öğr. Gör.">Öğr. Gör.</option>
                    <option value="Arş. Gör.">Arş. Gör.</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Bölüm *
                  </label>
                  <input
                    type="text"
                    name="department"
                    id="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                    Kurum/Üniversite *
                  </label>
                  <input
                    type="text"
                    name="institution"
                    id="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Şifre *
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Şifre en az 6 karakter uzunluğunda olmalıdır.</p>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Şifre (Tekrar) *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Uzmanlık Alanları */}
                <div className="sm:col-span-6">
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700">
                      Uzmanlık Alanları *
                    </legend>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {expertiseAreas.map(area => (
                        <div key={area} className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id={`expertise-${area}`}
                              name={`expertise-${area}`}
                              type="checkbox"
                              checked={formData.expertise.includes(area)}
                              onChange={() => handleExpertiseToggle(area)}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor={`expertise-${area}`} className="text-gray-700">
                              {area}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    {formData.expertise.length === 0 && (
                      <p className="mt-1 text-xs text-red-500">En az bir uzmanlık alanı seçmelisiniz.</p>
                    )}
                  </fieldset>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Hakemi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterReviewerPage; 