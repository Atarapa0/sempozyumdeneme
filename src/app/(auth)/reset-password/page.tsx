'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services';

function ResetPasswordForm() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Geçersiz veya eksik şifre sıfırlama bağlantısı. Lütfen şifre sıfırlama işlemini tekrar başlatın.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password || !formData.confirmPassword) {
      setError('Tüm alanlar zorunludur.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      if (!token) {
        throw new Error('Token bulunamadı');
      }
      
      await authService.resetPassword(token, formData.password);
      setSuccess(true);
      
      // Kullanıcıyı 3 saniye sonra giriş sayfasına yönlendir
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err?.error || 'Şifre sıfırlama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800">Şifre Sıfırlama</h1>
            <p className="mt-2 text-gray-600">Yeni şifrenizi belirleyin</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              {error && (
                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              
              {success ? (
                <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
                  <h3 className="font-bold text-lg mb-2">Şifre Sıfırlandı!</h3>
                  <p>Şifreniz başarıyla değiştirildi. Yeni şifreniz ile giriş yapabilirsiniz.</p>
                  <p className="mt-2 text-sm">Otomatik olarak giriş sayfasına yönlendirileceksiniz...</p>
                  <div className="mt-4">
                    <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                      Giriş sayfasına dön
                    </Link>
                  </div>
                </div>
              ) : (
                token ? (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                        Yeni Şifre
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          minLength={6}
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
                      <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                        Yeni Şifre (Tekrar)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          minLength={6}
                        />
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
                        {isSubmitting ? 'İşleniyor...' : 'Şifreyi Sıfırla'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Geçersiz veya eksik şifre sıfırlama bağlantısı.
                    </p>
                    <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium">
                      Şifre sıfırlama işlemini yeniden başlat
                    </Link>
                  </div>
                )
              )}
              
              <div className="text-center mt-4">
                <Link href="/login" className="text-blue-600 hover:text-blue-800">
                  Giriş sayfasına dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
} 