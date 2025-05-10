'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import React from 'react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Admin kontrolü
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [user, router]);

  // Örnek istatistikler
  const stats = {
    papers: {
      total: 45,
      pending: 12,
      reviewing: 8,
      accepted: 18,
      rejected: 5,
      revision: 2
    },
    users: {
      total: 120,
      new: 15,
      active: 85
    },
    reviews: {
      completed: 35,
      pending: 10
    }
  };

  // Örnek son aktiviteler
  const recentActivities = [
    { id: 1, action: 'Yeni bildiri gönderildi', user: 'Ahmet Yılmaz', date: '2025-02-15T14:30:00' },
    { id: 2, action: 'Bildiri değerlendirildi', user: 'Prof. Dr. Mehmet Demir', date: '2025-02-14T10:15:00' },
    { id: 3, action: 'Yeni kullanıcı kaydoldu', user: 'Zeynep Aydın', date: '2025-02-13T16:45:00' },
    { id: 4, action: 'Bildiri kabul edildi', user: 'Admin', date: '2025-02-12T11:30:00' },
    { id: 5, action: 'Revizyon talebi gönderildi', user: 'Prof. Dr. Ayşe Kaya', date: '2025-02-11T09:20:00' }
  ];

  // Örnek son bildiriler
  const recentPapers = [
    { 
      id: 1, 
      title: 'Derin Öğrenme Tabanlı Görüntü İşleme Teknikleri ile Endüstriyel Kalite Kontrol',
      authors: 'Ahmet Yılmaz, Mehmet Demir, Ayşe Kaya',
      status: 'pending',
      date: '2025-02-15T14:30:00'
    },
    { 
      id: 2, 
      title: 'Güneş Enerjisi Sistemlerinin Optimizasyonu ve Verimlilik Analizi',
      authors: 'Zeynep Aydın, Ali Yıldız',
      status: 'reviewing',
      date: '2025-02-10T09:15:00'
    },
    { 
      id: 3, 
      title: 'Nesnelerin İnterneti Tabanlı Akıllı Üretim Sistemleri',
      authors: 'Hasan Şahin, Mustafa Öztürk',
      status: 'accepted',
      date: '2025-02-08T11:45:00'
    }
  ];

  // Tarih formatı
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Durum renkleri
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revision':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Durum metinleri
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'İncelemede';
      case 'reviewing':
        return 'Değerlendiriliyor';
      case 'accepted':
        return 'Kabul Edildi';
      case 'rejected':
        return 'Reddedildi';
      case 'revision':
        return 'Revizyon İstendi';
      default:
        return 'Bilinmiyor';
    }
  };

  if (!user) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-amber-100 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800 mx-auto mb-4"></div>
          <p className="text-amber-800">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-amber-100 min-h-screen p-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-amber-800">Admin Panel</h1>
            <p className="text-amber-600 text-sm">Amasya Sempozyum</p>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'overview' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Genel Bakış
            </button>
            
            <Link
              href="/admin/papers"
              className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'papers' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Bildiriler
            </Link>
            
            <button
              onClick={() => setActiveSection('users')}
              className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'users' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Kullanıcılar
            </button>
            
            <button
              onClick={() => setActiveSection('reviews')}
              className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'reviews' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Değerlendirmeler
            </button>
            
            <button
              onClick={() => setActiveSection('program')}
              className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'program' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Program Yönetimi
            </button>
            
            <button
              onClick={() => setActiveSection('settings')}
              className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'settings' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ayarlar
            </button>
            
            <div className="pt-4 mt-4 border-t border-amber-100">
              <Link
                href="/admin/profile"
                className="w-full flex items-center px-4 py-2 rounded-lg transition-colors text-amber-700 hover:bg-amber-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profil
              </Link>
              
              <button
                onClick={() => {
                  // Çıkış işlemi
                  router.push('/login');
                }}
                className="w-full flex items-center px-4 py-2 rounded-lg transition-colors text-amber-700 hover:bg-amber-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış Yap
              </button>
            </div>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeSection === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-amber-800 mb-6">Genel Bakış</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-amber-600 text-sm font-medium">Toplam Bildiri</p>
                      <p className="text-3xl font-bold text-amber-800 mt-1">{stats.papers.total}</p>
                    </div>
                    <div className="bg-amber-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-500 font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      %12
                    </span>
                    <span className="text-amber-600 ml-2">geçen haftadan</span>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-amber-600 text-sm font-medium">Toplam Kullanıcı</p>
                      <p className="text-3xl font-bold text-amber-800 mt-1">{stats.users.total}</p>
                    </div>
                    <div className="bg-amber-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-500 font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      %8
                    </span>
                    <span className="text-amber-600 ml-2">geçen aydan</span>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-amber-600 text-sm font-medium">Tamamlanan Değerlendirme</p>
                      <p className="text-3xl font-bold text-amber-800 mt-1">{stats.reviews.completed}</p>
                    </div>
                    <div className="bg-amber-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-amber-600">
                      {stats.reviews.pending} değerlendirme bekliyor
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                  <h3 className="text-lg font-bold text-amber-800 mb-4">Son Aktiviteler</h3>
                  <div className="space-y-4">
                    {recentActivities.map(activity => (
                      <div key={activity.id} className="flex items-start">
                        <div className="bg-amber-100 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-amber-800 font-medium">{activity.action}</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-amber-600">{activity.user}</span>
                            <span className="text-amber-500">{formatDate(activity.date)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <button className="text-amber-600 hover:text-amber-800 text-sm font-medium">
                      Tüm Aktiviteleri Görüntüle
                    </button>
                  </div>
                </div>
                
                {/* Recent Papers */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                  <h3 className="text-lg font-bold text-amber-800 mb-4">Son Bildiriler</h3>
                  <div className="space-y-4">
                    {recentPapers.map(paper => (
                      <div key={paper.id} className="p-3 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-amber-800">{paper.title}</h4>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(paper.status)}`}>
                            {getStatusText(paper.status)}
                          </span>
                        </div>
                        <p className="text-amber-600 text-sm mb-1">{paper.authors}</p>
                        <p className="text-amber-500 text-xs">{formatDate(paper.date)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Link href="/admin/papers" className="text-amber-600 hover:text-amber-800 text-sm font-medium">
                      Tüm Bildirileri Görüntüle
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeSection === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-amber-800 mb-6">Kullanıcı Yönetimi</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                <p className="text-amber-700">Bu bölüm geliştirme aşamasındadır.</p>
              </div>
            </div>
          )}
          
          {activeSection === 'reviews' && (
            <div>
              <h2 className="text-2xl font-bold text-amber-800 mb-6">Değerlendirme Yönetimi</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                <p className="text-amber-700">Bu bölüm geliştirme aşamasındadır.</p>
              </div>
            </div>
          )}
          
          {activeSection === 'program' && (
            <div>
              <h2 className="text-2xl font-bold text-amber-800 mb-6">Program Yönetimi</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                <p className="text-amber-700">Bu bölüm geliştirme aşamasındadır.</p>
              </div>
            </div>
          )}
          
          {activeSection === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-amber-800 mb-6">Sistem Ayarları</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-amber-100">
                <p className="text-amber-700">Bu bölüm geliştirme aşamasındadır.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 