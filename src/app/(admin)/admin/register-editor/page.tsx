'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { userService } from '@/lib/services'; // Kullanıcı servisini ekledik

const RegisterEditorPage = () => {
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

    // Telefon formatını kontrol et - sadece rakamlardan oluşmalı
    const phoneRegex = /^\d{10,15}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      setMessage({ 
        type: 'error', 
        text: 'Telefon numarası sadece rakamlardan oluşmalı ve en az 10, en fazla 15 karakter olmalıdır.' 
      });
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
      
      // userService üzerinden editör kaydı yap
      await userService.registerEditor({
        ad: firstName,
        soyad: lastName || 'N/A', // Soyad boşsa 'N/A' olarak gönder
        eposta: formData.email,
        sifre: formData.password,
        unvan: formData.title,
        bolum: formData.department,
        universite: formData.institution,
        kurum: formData.institution,
        cepTel: formData.phone
      });
      
      // Başarılı mesajı göster
      setMessage({ 
        type: 'success', 
        text: `${formData.name} başarıyla editör olarak kaydedildi.` 
      });
      
      // Formu temizle
      setFormData({
        email: '',
        name: '',
        title: '',
        department: '',
        institution: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Editör kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.';
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
      console.error('Editör kayıt hatası:', error);
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
            <h1 className="text-3xl font-bold text-gray-900">Editör Kaydı</h1>
            <Link href="/admin/dashboard" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Admin Paneline Dön
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Sisteme yeni editör eklemek için bu formu kullanın. Editör bilgileri ve giriş şifresi otomatik olarak oluşturulacak ve e-posta adresine gönderilecektir.
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

        {/* Editör Kayıt Formu */}
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
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Telefon numarası sadece rakamlardan oluşmalı, en az 10 karakter olmalıdır (örn: 5551234567)</p>
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
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Editörü Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterEditorPage; 