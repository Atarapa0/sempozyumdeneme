'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { authService } from '@/lib/services';

// URL parametrelerini alan bileşen
function LoginForm() {
  const [formData, setFormData] = useState({
    eposta: '',
    sifre: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { login, user } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setDebugInfo(null);

    try {
      // Eposta ve sifre doğrulaması
      if (!formData.eposta || !formData.sifre) {
        setError('E-posta ve şifre alanları zorunludur.');
        return;
      }
      
      // Şifre formatını korumak için trim işlemini engelleyebiliriz
      const trimmedEmail = formData.eposta.trim();
      const exactPassword = formData.sifre; // şifrenin tam olarak girildiği gibi kullanılması
      
      const success = await login(trimmedEmail, exactPassword);
      if (success) {
        router.push(redirect);
      } else {
        setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.error || 'Giriş yapılırken bir hata oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Otomatik form doldurma yardımcısı
  const fillAdminCredentials = () => {
    setFormData({
      eposta: 'admin@example.com',
      sifre: 'sempozyum2025'
    });
  };

  // Debug işlevleri - geliştirme sırasında API durumunu test etmek için
  const checkApiStatus = async () => {
    try {
      setDebugInfo('API durumu kontrol ediliyor...');
      
      // Basit bir API durumu kontrolü yap
      const response = await fetch('/api/sempozyum');
      const status = response.status;
      const text = await response.text();
      
      setDebugInfo(`API Yanıtı: ${status} - ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    } catch (error: any) {
      setDebugInfo(`API Hatası: ${error.message}`);
    }
  };

  // Login endpoint'ini doğrudan test et
  const testLoginEndpoint = async () => {
    try {
      setDebugInfo('Login API endpoint testi yapılıyor...');
      
      // Auth servis üzerinden direk login test et
      try {
        const loginResponse = await authService.login('admin@example.com', 'sempozyum2025');
        setDebugInfo(`Login Servis Yanıtı: Başarılı\n\n${JSON.stringify(loginResponse, null, 2)}`);
      } catch (error: any) {
        setDebugInfo(`Login Servis Hatası: ${error.status || ''} - ${error.error || error.message}\n\n${JSON.stringify(error, null, 2)}`);
      }
    } catch (error: any) {
      setDebugInfo(`Login API Hatası: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800">Giriş Yap</h1>
            <p className="mt-2 text-gray-600">MÜBES 2025 hesabınıza giriş yapın</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              {error && (
                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              
              {debugInfo && (
                <div className="mb-6 bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200 text-sm">
                  <div className="font-bold mb-1">Debug Bilgisi:</div>
                  <pre className="whitespace-pre-wrap">{debugInfo}</pre>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="eposta" className="block text-gray-700 font-medium mb-2">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    id="eposta"
                    name="eposta"
                    value={formData.eposta}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="sifre" className="block text-gray-700 font-medium">
                      Şifre
                    </label>
                    <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                      Şifremi Unuttum
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="sifre"
                      name="sifre"
                      value={formData.sifre}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Gizle" : "Göster"}
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      name="remember"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-gray-700">
                      Beni hatırla
                    </label>
                  </div>
                </div>
                
                <div className="mb-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                  </button>
                </div>
              </form>
              
              <div className="text-center">
                <p className="text-gray-600">
                  Hesabınız yok mu?{' '}
                  <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                    Kayıt Ol
                  </Link>
                </p>
              </div>
              
              {/* Geliştirici Debug Bölümü */}
              <div className="mt-4 text-center flex justify-center space-x-4">
                <button 
                  onClick={checkApiStatus}
                  className="text-xs text-gray-500 hover:text-blue-600 underline"
                >
                  API Durumunu Kontrol Et
                </button>
                <button 
                  onClick={testLoginEndpoint}
                  className="text-xs text-gray-500 hover:text-blue-600 underline"
                >
                  Login API Test Et
                </button>
                <button 
                  onClick={fillAdminCredentials}
                  className="text-xs text-gray-500 hover:text-blue-600 underline"
                >
                  Admin Bilgilerini Doldur
                </button>
              </div>
              
              {/* Demo Hesap Bilgileri */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Veritabanındaki Hesap Bilgileri</h3>
                <div className="bg-blue-50 rounded-lg p-4 mb-3">
                  <h4 className="font-bold text-blue-800 mb-2">Admin Hesabı</h4>
                  <p className="text-gray-700"><span className="font-medium">E-posta:</span> admin@example.com</p>
                  <p className="text-gray-700"><span className="font-medium">Şifre:</span> sempozyum2025</p>
                  <p className="text-gray-700 text-xs mt-2"><i>Not: Bu şifre için veritabanındaki hash değeri: $2b$10$ARlACGp2034vKUTP959EKe0OpDBb/3f8U5.PNAjzaBbE3.t.ZRl46</i></p>
                </div>
                <p className="text-sm text-gray-500 mt-3 text-center">
                  Veritabanı şifresi güncellendikten sonra bu bilgilerle giriş yapabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}