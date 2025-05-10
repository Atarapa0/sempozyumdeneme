'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/services';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('E-posta adresi gereklidir.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await authService.requestPasswordReset(email.trim());
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err?.error || 'Şifre sıfırlama isteği sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800">Şifremi Unuttum</h1>
            <p className="mt-2 text-gray-600">Şifrenizi sıfırlamak için e-posta adresinizi girin</p>
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
                  <h3 className="font-bold text-lg mb-2">E-posta Gönderildi!</h3>
                  <p>Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin ve bağlantıyı takip ederek şifrenizi sıfırlayın.</p>
                  <div className="mt-4">
                    <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                      Giriş sayfasına dön
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                      E-posta Adresi
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="adiniz@example.com"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? 'İşleniyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
                    </button>
                  </div>
                </form>
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