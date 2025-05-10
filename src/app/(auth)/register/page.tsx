'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, User } from '@/lib/context/AuthContext';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    adSoyad: '',
    unvan: '',
    universite: '',
    katilimSekli: '',
    kurum: '',
    fakulte: '',
    bolum: '',
    yazismaAdresi: '',
    kurumTelefonu: '',
    cepTelefonu: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Mesaj gösterme fonksiyonu
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    // 5 saniye sonra mesajı temizle
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      const requiredFields = [
        'adSoyad', 
        'unvan', 
        'katilimSekli', 
        'cepTelefonu', 
        'email', 
        'password'
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        showMessage('error', `Lütfen zorunlu alanları doldurunuz! Eksik alanlar: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showMessage('error', 'Geçerli bir e-posta adresi giriniz!');
        setLoading(false);
        return;
      }

      // Password validation
      if (formData.password.length < 6) {
        showMessage('error', 'Şifre en az 6 karakter olmalıdır!');
        setLoading(false);
        return;
      }

      // Ad ve soyad kontrolü
      if (!formData.adSoyad.trim()) {
        showMessage('error', 'Ad Soyad alanını doldurunuz!');
        setLoading(false);
        return;
      }
      
      // API için veri hazırlama
      const userData = {
        name: formData.adSoyad.trim(),
        email: formData.email,
        password: formData.password,
        title: formData.unvan,
        department: formData.bolum || '',
        university: formData.universite || '',
        participationType: formData.katilimSekli === 'yazar' ? 'presenter' : 'listener',
        institution: formData.kurum || '',
        faculty: formData.fakulte || '',
        phone: formData.cepTelefonu
      } as Omit<User, 'id' | 'role'> & { password: string };
      
      console.log("Kayıt verileri hazırlandı:", userData);
      
      // AuthContext üzerinden register işlemi
      const success = await register(userData);
      
      if (success) {
        showMessage('success', 'Kayıt başarılı! Yönlendiriliyorsunuz...');
        
        // Başarılı kayıt sonrası ana sayfaya yönlendir
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        showMessage('error', 'Kayıt işlemi başarısız oldu.');
      }
      
      /* Eski simülasyon kodu yorum satırına alındı
      // Şimdilik simüle edilmiş kayıt işlemi
      console.log("Kayıt verileri:", formData);
      
      // Başarılı kayıt simülasyonu
      showMessage('success', 'Kayıt başarılı! Giriş yapabilirsiniz.');
      
      // Kullanıcıyı otomatik olarak giriş yap
      setTimeout(() => {
        // Demo kullanıcı oluştur
        const demoUser = {
          id: '1',
          email: formData.email,
          name: formData.adSoyad,
          isAdmin: false,
          phone: formData.cepTelefonu,
          country: '',
          city: '',
          title: formData.unvan,
          department: formData.bolum,
          institution: formData.kurum || formData.universite,
          lastName: formData.adSoyad.split(' ').pop() || '',
          firstName: formData.adSoyad.split(' ')[0] || ''
        };
        
        // Kullanıcı bilgilerini localStorage'a kaydet
        localStorage.setItem('user', JSON.stringify(demoUser));
        
        // Ana sayfaya yönlendir
        router.push('/');
      }, 2000);
      */
    } catch (error: any) {
      console.error('Registration error:', error);
      showMessage('error', error.message || 'Kayıt sırasında bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Kayıt Ol
        </h2>
        <p className="mb-6 text-center text-gray-600">
          MÜBES 2025 için yeni bir hesap oluşturun
        </p>

        {message.text && (
          <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adSoyad" className="block text-sm font-medium text-gray-700">
              Ad Soyad *
            </label>
            <input
              type="text"
              id="adSoyad"
              name="adSoyad"
              value={formData.adSoyad}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="unvan" className="block text-sm font-medium text-gray-700">
              Unvan *
            </label>
            <select
              id="unvan"
              name="unvan"
              value={formData.unvan}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
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

          <div>
            <label htmlFor="universite" className="block text-sm font-medium text-gray-700">
              Üniversite
            </label>
            <input
              type="text"
              id="universite"
              name="universite"
              value={formData.universite}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="katilimSekli" className="block text-sm font-medium text-gray-700">
              Kongreye Katılım Şekli *
            </label>
            <select
              id="katilimSekli"
              name="katilimSekli"
              value={formData.katilimSekli}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            >
              <option value="">Seçiniz</option>
              <option value="yazar">Yazar</option>
              <option value="misafir">Misafir</option>
            </select>
          </div>

          <div>
            <label htmlFor="kurum" className="block text-sm font-medium text-gray-700">
              Kurum
            </label>
            <input
              type="text"
              id="kurum"
              name="kurum"
              value={formData.kurum}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="fakulte" className="block text-sm font-medium text-gray-700">
              Fakülte
            </label>
            <input
              type="text"
              id="fakulte"
              name="fakulte"
              value={formData.fakulte}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="bolum" className="block text-sm font-medium text-gray-700">
              Bölüm *
            </label>
            <input
              type="text"
              id="bolum"
              name="bolum"
              value={formData.bolum}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="yazismaAdresi" className="block text-sm font-medium text-gray-700">
              Yazışma Adresi
            </label>
            <textarea
              id="yazismaAdresi"
              name="yazismaAdresi"
              value={formData.yazismaAdresi}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="kurumTelefonu" className="block text-sm font-medium text-gray-700">
              Kurum Telefonu
            </label>
            <input
              type="tel"
              id="kurumTelefonu"
              name="kurumTelefonu"
              value={formData.kurumTelefonu}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="cepTelefonu" className="block text-sm font-medium text-gray-700">
              Cep Telefonu *
            </label>
            <input
              type="tel"
              id="cepTelefonu"
              name="cepTelefonu"
              value={formData.cepTelefonu}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-posta *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Şifre *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">En az 6 karakter olmalıdır</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
          >
            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Zaten bir hesabınız var mı?</span>{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
} 