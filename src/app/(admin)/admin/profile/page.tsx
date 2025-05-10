'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';  
import { useAuth } from '@/lib/context/AuthContext';
import { userService } from '@/lib/services';

// Unvan listesi
const titleOptions = [
  { value: "Prof. Dr.", label: "Prof. Dr." },
  { value: "Doç. Dr.", label: "Doç. Dr." },
  { value: "Dr. Öğr. Üyesi", label: "Dr. Öğr. Üyesi" },
  { value: "Öğr. Gör. Dr.", label: "Öğr. Gör. Dr." },
  { value: "Arş. Gör. Dr.", label: "Arş. Gör. Dr." },
  { value: "Dr.", label: "Dr." },
  { value: "Öğr. Gör.", label: "Öğr. Gör." },
  { value: "Arş. Gör.", label: "Arş. Gör." },
  { value: "Uzm.", label: "Uzm." },
  { value: "Diğer", label: "Diğer" }
];

export default function AdminProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    institution: '',
    department: '',
    title: '',
    phone: '',
    university: '',
    faculty: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Admin kontrolü ve profil verilerini yükleme
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
    } else {
      // Ad ve soyadı ayır
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      // Kullanıcı bilgilerini form state'e yükle
      setFormData({
        ...formData,
        firstName: firstName,
        lastName: lastName,
        email: user.email || '',
        institution: user.institution || '',
        department: user.department || '',
        title: user.title || '',
        phone: user.phone || '',
        university: user.university || '',
        faculty: user.faculty || ''
      });

      // API'den güncel profil bilgilerini çek
      fetchUserProfile();
    }
  }, [user, router]);

  // API'den profil bilgilerini çekme
  const fetchUserProfile = async () => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      console.log('Admin profil bilgileri çekiliyor...');
      const userData = await userService.getProfile();
      
      console.log('Admin profil verileri:', userData);
      
      // API'den gelen verileri state'e aktar
      setFormData(prev => ({
        ...prev,
        firstName: userData.ad || '',
        lastName: userData.soyad || '',
        email: userData.eposta || '',
        title: userData.unvan || '',
        department: userData.bolum || '',
        institution: userData.kurum || '',
        university: userData.universite || '',
        faculty: userData.fakulte || '',
        phone: userData.cepTel || ''
      }));
    } catch (error: any) {
      console.error('Admin profil bilgileri çekilemedi:', error);
      
      // Oturum hatası durumunda login sayfasına yönlendir
      if (error.message && error.message.includes('Oturum')) {
        router.push('/login?redirect=/admin/profile');
        return;
      }
      
      // Hata durumunda mevcut kullanıcı bilgilerini kullanmaya devam et
      console.log('Context kullanıcı verileri kullanılıyor:', user);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // API'nin beklediği formata dönüştürme
      const updateData = {
        ad: formData.firstName,
        soyad: formData.lastName,
        unvan: formData.title,
        bolum: formData.department,
        kurum: formData.institution,
        universite: formData.university,
        fakulte: formData.faculty,
        cepTel: formData.phone,
      };

      console.log('Admin profil güncellemesi - gönderilen veri:', updateData);
      const result = await userService.updateProfile(updateData);
      console.log('Admin profil güncellemesi - başarılı cevap:', result);
      
      // LocalStorage'daki kullanıcı bilgilerini güncelle
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          const updatedUserData = {
            ...userData,
            name: `${formData.firstName} ${formData.lastName}`,
            title: formData.title,
            department: formData.department,
            institution: formData.institution,
            university: formData.university,
            faculty: formData.faculty,
            phone: formData.phone,
          };
          localStorage.setItem('user', JSON.stringify(updatedUserData));
        }
      } catch (error) {
        console.error('localStorage güncelleme hatası:', error);
      }
      
      setIsEditing(false);
      setMessage({
        type: 'success',
        text: 'Profil bilgileriniz başarıyla güncellendi.'
      });
      
      // Mesajı 3 saniye sonra temizle
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error: any) {
      console.error('Admin profil güncelleme hatası:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Profil güncellenirken bir hata oluştu.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Şifre kontrolleri
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Yeni şifreler eşleşmiyor.'
      });
      setIsSubmitting(false);
      return;
    }

    // Şifre uzunluğu kontrolü
    if (formData.newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Yeni şifre en az 6 karakter olmalıdır.'
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const passwordChangeData = {
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword
      };
      
      console.log('Admin şifre değiştirme - istek gönderiliyor');
      const result = await userService.changePassword(passwordChangeData);
      console.log('Admin şifre değiştirme - başarılı cevap:', result);
      
      setIsChangingPassword(false);
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setMessage({
        type: 'success',
        text: 'Şifreniz başarıyla güncellendi.'
      });
      
      // Mesajı 3 saniye sonra temizle
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error: any) {
      console.error('Admin şifre değiştirme hatası:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Şifre değiştirme işlemi başarısız oldu. Mevcut şifrenizi kontrol edin.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-amber-100 max-w-md w-full">
          <h1 className="text-2xl font-bold text-amber-800 mb-4 text-center">Yetkisiz Erişim</h1>
          <p className="text-amber-700 mb-6 text-center">
            Bu sayfaya erişmek için admin yetkilerine sahip olmanız gerekmektedir.
          </p>
          <div className="flex justify-center">
            <Link href="/login" className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold py-3 px-6 rounded-lg transition duration-200 border border-amber-200">
              Giriş Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-amber-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Link href="/admin" className="text-amber-700 hover:text-amber-800 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-amber-800">Admin Profili</h1>
          </div>
          
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-amber-100 mb-8">
            <div className="flex border-b border-amber-100">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-medium text-lg transition-colors duration-200 ${
                  activeTab === 'profile' 
                    ? 'text-amber-800 border-b-2 border-amber-500' 
                    : 'text-amber-600 hover:text-amber-700'
                }`}
              >
                Profil Bilgileri
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`px-6 py-3 font-medium text-lg transition-colors duration-200 ${
                  activeTab === 'security' 
                    ? 'text-amber-800 border-b-2 border-amber-500' 
                    : 'text-amber-600 hover:text-amber-700'
                }`}
              >
                Güvenlik
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`px-6 py-3 font-medium text-lg transition-colors duration-200 ${
                  activeTab === 'notifications' 
                    ? 'text-amber-800 border-b-2 border-amber-500' 
                    : 'text-amber-600 hover:text-amber-700'
                }`}
              >
                Bildirimler
              </button>
            </div>
            
            <div className="p-6">
              {/* Mesaj */}
              {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}
              
              {/* Profil Bilgileri */}
              {activeTab === 'profile' && (
                <div className="bg-white border border-amber-100 shadow-sm rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-amber-800 mb-4">Profil Bilgileri</h2>
                  
                  {message.text && (
                    <div className={`p-4 mb-6 rounded-md ${
                      message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {message.text}
                    </div>
                  )}
                  
                  {isEditing ? (
                    <form onSubmit={handleProfileSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-amber-700 text-sm font-medium mb-1">
                            Ad
                          </label>
                          <input 
                            type="text" 
                            id="firstName" 
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="lastName" className="block text-amber-700 text-sm font-medium mb-1">
                            Soyad
                          </label>
                          <input 
                            type="text" 
                            id="lastName" 
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-amber-700 text-sm font-medium mb-1">
                            E-posta
                          </label>
                          <input 
                            type="email" 
                            id="email" 
                            name="email"
                            value={formData.email}
                            readOnly
                            className="w-full rounded-md border-amber-300 shadow-sm bg-amber-50 text-amber-600 cursor-not-allowed"
                          />
                          <p className="mt-1 text-xs text-amber-600">
                            E-posta adresi değiştirilemez.
                          </p>
                        </div>
                        
                        <div>
                          <label htmlFor="title" className="block text-amber-700 text-sm font-medium mb-1">
                            Unvan
                          </label>
                          <select
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                          >
                            <option value="">Seçiniz</option>
                            {titleOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="university" className="block text-amber-700 text-sm font-medium mb-1">
                            Üniversite
                          </label>
                          <input 
                            type="text" 
                            id="university" 
                            name="university"
                            value={formData.university}
                            onChange={handleChange}
                            className="w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="faculty" className="block text-amber-700 text-sm font-medium mb-1">
                            Fakülte
                          </label>
                          <input 
                            type="text" 
                            id="faculty" 
                            name="faculty"
                            value={formData.faculty}
                            onChange={handleChange}
                            className="w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="department" className="block text-amber-700 text-sm font-medium mb-1">
                            Bölüm
                          </label>
                          <input 
                            type="text" 
                            id="department" 
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="institution" className="block text-amber-700 text-sm font-medium mb-1">
                            Kurum
                          </label>
                          <input 
                            type="text" 
                            id="institution" 
                            name="institution"
                            value={formData.institution}
                            onChange={handleChange}
                            className="w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="phone" className="block text-amber-700 text-sm font-medium mb-1">
                            Telefon
                          </label>
                          <input 
                            type="tel" 
                            id="phone" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
                          disabled={isSubmitting}
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 flex items-center"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Kaydediliyor...
                            </>
                          ) : (
                            'Bilgileri Kaydet'
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-amber-900">Ad Soyad</h3>
                          <p className="mt-1 text-sm text-amber-700">{formData.firstName} {formData.lastName}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-amber-900">E-posta</h3>
                          <p className="mt-1 text-sm text-amber-700">{formData.email}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-amber-900">Unvan</h3>
                          <p className="mt-1 text-sm text-amber-700">{formData.title || 'Belirtilmemiş'}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-amber-900">Üniversite</h3>
                          <p className="mt-1 text-sm text-amber-700">{formData.university || 'Belirtilmemiş'}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-amber-900">Fakülte</h3>
                          <p className="mt-1 text-sm text-amber-700">{formData.faculty || 'Belirtilmemiş'}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-amber-900">Bölüm</h3>
                          <p className="mt-1 text-sm text-amber-700">{formData.department || 'Belirtilmemiş'}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-amber-900">Kurum</h3>
                          <p className="mt-1 text-sm text-amber-700">{formData.institution || 'Belirtilmemiş'}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-amber-900">Telefon</h3>
                          <p className="mt-1 text-sm text-amber-700">{formData.phone || 'Belirtilmemiş'}</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-md border border-amber-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Bilgileri Düzenle
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Güvenlik */}
              {activeTab === 'security' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-amber-800">Güvenlik Ayarları</h2>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-amber-800 mb-4">Şifre Değiştir</h3>
                    
                    {activeTab === 'security' && (
                      <div className="bg-white border border-amber-100 shadow-sm rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-amber-800 mb-4">Şifre Değiştirme</h2>
                        
                        {message.text && (
                          <div className={`p-4 mb-6 rounded-md ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {message.text}
                          </div>
                        )}
                        
                        {isChangingPassword ? (
                          <form onSubmit={handlePasswordSubmit}>
                            <div className="space-y-4">
                              <div>
                                <label htmlFor="currentPassword" className="block text-amber-700 text-sm font-medium mb-1">
                                  Mevcut Şifre
                                </label>
                                <input 
                                  type="password" 
                                  id="currentPassword" 
                                  name="currentPassword"
                                  value={formData.currentPassword}
                                  onChange={handleChange}
                                  className="w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="newPassword" className="block text-amber-700 text-sm font-medium mb-1">
                                  Yeni Şifre
                                </label>
                                <input 
                                  type="password" 
                                  id="newPassword" 
                                  name="newPassword"
                                  value={formData.newPassword}
                                  onChange={handleChange}
                                  className="w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                                  required
                                  minLength={6}
                                />
                                <p className="mt-1 text-xs text-amber-600">
                                  En az 6 karakter olmalıdır.
                                </p>
                              </div>
                              
                              <div>
                                <label htmlFor="confirmPassword" className="block text-amber-700 text-sm font-medium mb-1">
                                  Yeni Şifre (Tekrar)
                                </label>
                                <input 
                                  type="password" 
                                  id="confirmPassword" 
                                  name="confirmPassword"
                                  value={formData.confirmPassword}
                                  onChange={handleChange}
                                  className="w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                                  required
                                  minLength={6}
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-3 pt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsChangingPassword(false);
                                    setFormData({
                                      ...formData,
                                      currentPassword: '',
                                      newPassword: '',
                                      confirmPassword: ''
                                    });
                                  }}
                                  className="bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
                                  disabled={isSubmitting}
                                >
                                  İptal
                                </button>
                                <button
                                  type="submit"
                                  className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 flex items-center"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Değiştiriliyor...
                                    </>
                                  ) : (
                                    'Şifreyi Değiştir'
                                  )}
                                </button>
                              </div>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8">
                            <p className="text-amber-600 mb-4">Şifrenizi değiştirmek için aşağıdaki butona tıklayınız.</p>
                            <button
                              onClick={() => setIsChangingPassword(true)}
                              className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
                            >
                              Şifre Değiştir
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-amber-100 pt-6">
                    <h3 className="text-lg font-medium text-amber-800 mb-4">İki Faktörlü Kimlik Doğrulama</h3>
                    <p className="text-amber-700 mb-4">
                      İki faktörlü kimlik doğrulama, hesabınıza ekstra bir güvenlik katmanı ekler.
                    </p>
                    <div className="flex items-center">
                      <button className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg transition duration-200 border border-amber-200 font-medium">
                        Etkinleştir
                      </button>
                      <span className="ml-4 text-amber-600 text-sm">
                        (Geliştirme aşamasında)
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Bildirimler */}
              {activeTab === 'notifications' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-amber-800">Bildirim Ayarları</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-amber-100">
                      <div>
                        <h3 className="font-medium text-amber-800">E-posta Bildirimleri</h3>
                        <p className="text-amber-600 text-sm">Sempozyum ile ilgili güncellemeler ve duyurular</p>
                      </div>
                      <div className="relative inline-block w-12 h-6">
                        <input type="checkbox" id="email-notifications" className="opacity-0 w-0 h-0" defaultChecked />
                        <label htmlFor="email-notifications" className="block overflow-hidden h-6 rounded-full bg-amber-200 cursor-pointer">
                          <span className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform translate-x-0"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pb-4 border-b border-amber-100">
                      <div>
                        <h3 className="font-medium text-amber-800">Bildiri Değerlendirmeleri</h3>
                        <p className="text-amber-600 text-sm">Yeni bildiri değerlendirmeleri hakkında bildirimler</p>
                      </div>
                      <div className="relative inline-block w-12 h-6">
                        <input type="checkbox" id="review-notifications" className="opacity-0 w-0 h-0" defaultChecked />
                        <label htmlFor="review-notifications" className="block overflow-hidden h-6 rounded-full bg-amber-200 cursor-pointer">
                          <span className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform translate-x-0"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pb-4 border-b border-amber-100">
                      <div>
                        <h3 className="font-medium text-amber-800">Sistem Bildirimleri</h3>
                        <p className="text-amber-600 text-sm">Sistem güncellemeleri ve bakım bildirimleri</p>
                      </div>
                      <div className="relative inline-block w-12 h-6">
                        <input type="checkbox" id="system-notifications" className="opacity-0 w-0 h-0" defaultChecked />
                        <label htmlFor="system-notifications" className="block overflow-hidden h-6 rounded-full bg-amber-200 cursor-pointer">
                          <span className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform translate-x-0"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-amber-800">Pazarlama Bildirimleri</h3>
                        <p className="text-amber-600 text-sm">Gelecek etkinlikler ve özel teklifler</p>
                      </div>
                      <div className="relative inline-block w-12 h-6">
                        <input type="checkbox" id="marketing-notifications" className="opacity-0 w-0 h-0" />
                        <label htmlFor="marketing-notifications" className="block overflow-hidden h-6 rounded-full bg-amber-200 cursor-pointer">
                          <span className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform translate-x-0"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 text-center">
                    <p className="text-amber-600 text-sm">
                      Not: Bildirim ayarları şu anda geliştirme aşamasındadır ve tam olarak çalışmayabilir.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 