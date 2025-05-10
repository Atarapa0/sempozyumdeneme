'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'src/lib/context/AuthContext';
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

const ProfilePage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Profil bilgileri için state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    title: '',
    department: '',
    institution: '',
    university: '',
    faculty: '',
    phone: '',
    participationType: '',
  });

  // Şifre değiştirme için state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Mesajlar için state
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Yükleme durumları
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Kullanıcı bilgilerini ve güncel profil verilerini yükle
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/profile');
      return;
    }

    // Kullanıcı bilgilerini state'e yükle
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        title: user.title || '',
        department: user.department || '',
        institution: user.institution || '',
        university: user.university || '',
        faculty: user.faculty || '',
        phone: user.phone || '',
        participationType: user.participationType || '',
      });

      // API'den güncel profil bilgilerini çek
      fetchUserProfile();
    }
  }, [user, isLoading, router]);

  // API'den profil bilgilerini çekme
  const fetchUserProfile = async () => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      console.log('Profil bilgileri çekiliyor...');
      const userData = await userService.getProfile();
      
      console.log('Profil verileri:', userData);
      
      // API'den gelen verileri state'e aktar
      setProfileData({
        name: `${userData.ad} ${userData.soyad}`,
        email: userData.eposta,
        title: userData.unvan || '',
        department: userData.bolum || '',
        institution: userData.kurum || '',
        university: userData.universite || '',
        faculty: userData.fakulte || '',
        phone: userData.cepTel || '',
        participationType: userData.kongreKatilimSekli === 'Yazar' ? 'presenter' : 'listener',
      });
    } catch (error: any) {
      console.error('Profil bilgileri çekilemedi:', error);
      
      // Oturum hatası durumunda login sayfasına yönlendir
      if (error.message && error.message.includes('Oturum')) {
        router.push('/login?redirect=/profile');
        return;
      }
      
      // Hata durumunda mevcut kullanıcı bilgilerini kullanmaya devam et
      console.log('Context kullanıcı verileri kullanılıyor:', user);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Profil bilgilerini güncelleme
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Şifre bilgilerini güncelleme
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Profil formunu gönderme
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSubmitting(true);
    setProfileMessage({ type: '', text: '' });

    try {
      // API'nin beklediği formata dönüştürme
      const nameParts = profileData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      const updateData = {
        ad: firstName,
        soyad: lastName,
        unvan: profileData.title,
        bolum: profileData.department,
        kurum: profileData.institution,
        universite: profileData.university,
        fakulte: profileData.faculty,
        cepTel: profileData.phone,
        kongreKatilimSekli: profileData.participationType === 'presenter' ? 'Yazar' : 'Dinleyici',
      };

      console.log('Profil güncellemesi - gönderilen veri:', updateData);
      
      // API çağrısını yap
      const result = await userService.updateProfile(updateData);
      console.log('Profil güncellemesi - başarılı cevap:', result);
      
      // Kullanıcı bilgilerini localStorage'da güncelle
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          const updatedUserData = {
            ...userData,
            name: profileData.name,
            title: profileData.title,
            department: profileData.department,
            university: profileData.university,
            institution: profileData.institution,
            faculty: profileData.faculty,
            phone: profileData.phone,
          };
          localStorage.setItem('user', JSON.stringify(updatedUserData));
        }
      } catch (error) {
        console.error('localStorage güncelleme hatası:', error);
      }
      
      setProfileMessage({ type: 'success', text: 'Profil bilgileriniz başarıyla güncellendi.' });
    } catch (error: any) {
      console.error('Profil güncelleme hatası:', error);
      setProfileMessage({
        type: 'error',
        text: error.message || 'Profil güncellenirken bir hata oluştu.'
      });
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  // Şifre formunu gönderme
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordSubmitting(true);
    setPasswordMessage({ type: '', text: '' });

    // Şifre doğrulama kontrolü
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Yeni şifreler birbiriyle eşleşmiyor.' });
      setIsPasswordSubmitting(false);
      return;
    }

    // Şifre uzunluk kontrolü
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır.' });
      setIsPasswordSubmitting(false);
      return;
    }

    try {
      const passwordChangeData = {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      };
      
      console.log('Şifre değiştirme - istek gönderiliyor');
      const result = await userService.changePassword(passwordChangeData);
      console.log('Şifre değiştirme - başarılı cevap:', result);

      // Başarılı olduğunda form alanlarını temizle
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setPasswordMessage({ type: 'success', text: 'Şifreniz başarıyla güncellendi.' });
    } catch (error: any) {
      console.error('Şifre değiştirme hatası:', error);
      setPasswordMessage({
        type: 'error',
        text: error.message || 'Şifre güncellenirken bir hata oluştu. Eski şifrenizi kontrol edin.'
      });
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Router zaten login sayfasına yönlendirdi
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profil Bilgileri</h1>
          <p className="mt-2 text-sm text-gray-600">
            Kişisel bilgilerinizi ve hesap ayarlarınızı buradan güncelleyebilirsiniz.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Kişisel Bilgiler</h2>
            
            {profileMessage.text && (
              <div className={`mb-4 p-4 rounded-md ${
                profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {profileMessage.text}
              </div>
            )}
            
            <form onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={profileData.email}
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">E-posta adresi değiştirilemez.</p>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Unvan
                  </label>
                  <select
                    id="title"
                    name="title"
                    value={profileData.title}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefon
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                    Kurum
                  </label>
                  <input
                    type="text"
                    name="institution"
                    id="institution"
                    value={profileData.institution}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="university" className="block text-sm font-medium text-gray-700">
                    Üniversite
                  </label>
                  <input
                    type="text"
                    name="university"
                    id="university"
                    value={profileData.university}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Bölüm
                  </label>
                  <input
                    type="text"
                    name="department"
                    id="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="faculty" className="block text-sm font-medium text-gray-700">
                    Fakülte
                  </label>
                  <input
                    type="text"
                    name="faculty"
                    id="faculty"
                    value={profileData.faculty}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="participationType" className="block text-sm font-medium text-gray-700">
                    Katılım Türü
                  </label>
                  <select
                    id="participationType"
                    name="participationType"
                    value={profileData.participationType}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Seçiniz</option>
                    <option value="listener">Dinleyici</option>
                    <option value="presenter">Bildiri Sunumu</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                  disabled={isProfileSubmitting}
                >
                  {isProfileSubmitting ? (
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
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Şifre Değiştirme</h2>
            
            {passwordMessage.text && (
              <div className={`mb-4 p-4 rounded-md ${
                passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {passwordMessage.text}
              </div>
            )}
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">
                    Mevcut Şifre
                  </label>
                  <div className="mt-1">
                    <input
                      id="oldPassword"
                      name="oldPassword"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Yeni Şifre
                  </label>
                  <div className="mt-1">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Şifre en az 6 karakter uzunluğunda olmalıdır.
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Yeni Şifre (Tekrar)
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                    disabled={isPasswordSubmitting}
                  >
                    {isPasswordSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Şifre Değiştiriliyor...
                      </>
                    ) : (
                      'Şifreyi Değiştir'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 