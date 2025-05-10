'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  getAktifGenelBilgiler,
  getAktifAnaKonular, 
  getBildiriKonulari,
  getKomiteUyeleri,
  bildiriService,
  userService
} from '@/lib/services';
import { getToken } from '@/lib/utils/token';

// Database'den tip tanımlamalarını alıyoruz
import { 
  SymposiumInfo,
  Paper,
  MainTopic,
  PaperTopic
} from '@/lib/database';

// Simüle edilmiş log verileri
const initialLogs = [
  { id: 1, timestamp: '2023-06-15 14:32:45', action: 'Kullanıcı Girişi', user: 'admin@example.com', details: 'Admin paneline giriş yapıldı' },
  { id: 2, timestamp: '2023-06-15 13:21:10', action: 'Bildiri Gönderimi', user: 'user@example.com', details: 'Yeni bildiri gönderildi: "Yapay Zeka ve Etik"' },
  { id: 3, timestamp: '2023-06-15 12:05:33', action: 'Hakem Atama', user: 'admin@example.com', details: 'Bildiri #12 için hakem atandı: reviewer@example.com' },
  { id: 4, timestamp: '2023-06-15 11:47:22', action: 'Kullanıcı Kaydı', user: 'newuser@example.com', details: 'Yeni kullanıcı kaydı tamamlandı' },
  { id: 5, timestamp: '2023-06-15 10:30:15', action: 'Bildiri Değerlendirme', user: 'reviewer@example.com', details: 'Bildiri #8 değerlendirildi: Kabul' },
  { id: 6, timestamp: '2023-06-15 09:15:40', action: 'Program Güncelleme', user: 'admin@example.com', details: 'Sempozyum programı güncellendi' },
  { id: 7, timestamp: '2023-06-14 16:22:18', action: 'Bildiri Durumu', user: 'admin@example.com', details: 'Bildiri #5 durumu güncellendi: Kabul' },
  { id: 8, timestamp: '2023-06-14 15:10:05', action: 'Hakem Kaydı', user: 'admin@example.com', details: 'Yeni hakem eklendi: newreviewer@example.com' },
  { id: 9, timestamp: '2023-06-14 14:05:30', action: 'Kullanıcı Girişi', user: 'user@example.com', details: 'Kullanıcı girişi yapıldı' },
  { id: 10, timestamp: '2023-06-14 13:45:12', action: 'Bildiri Gönderimi', user: 'anotheruser@example.com', details: 'Yeni bildiri gönderildi: "Makine Öğrenmesi Uygulamaları"' },
  { id: 11, timestamp: '2023-06-14 11:30:25', action: 'Sistem', user: 'system', details: 'Otomatik yedekleme tamamlandı' },
  { id: 12, timestamp: '2023-06-14 10:15:40', action: 'Kullanıcı Kaydı', user: 'anotheruser@example.com', details: 'Yeni kullanıcı kaydı tamamlandı' },
  { id: 13, timestamp: '2023-06-13 17:20:33', action: 'Bildiri Değerlendirme', user: 'reviewer@example.com', details: 'Bildiri #3 değerlendirildi: Revizyon' },
  { id: 14, timestamp: '2023-06-13 16:10:22', action: 'Program Güncelleme', user: 'admin@example.com', details: 'Açılış konuşması saati güncellendi' },
  { id: 15, timestamp: '2023-06-13 15:05:18', action: 'Hakem Atama', user: 'admin@example.com', details: 'Bildiri #9 için hakem atandı: reviewer2@example.com' },
];


const AdminDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [symposium, setSymposium] = useState<SymposiumInfo | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // İstatistikler için tek bir state kullanıyoruz
  const [stats, setStats] = useState({
    totalUsers: 125,
    totalPapers: 78,
    pendingPapers: 12,
    acceptedPapers: 45,
    rejectedPapers: 21,
    totalReviewers: 18,
    totalMainTopics: 0,
    totalPaperTopics: 0,
    totalKomiteUyeleri: 0,
    unreadMessages: 0
  });
  
 
  // Admin olmayan kullanıcıları ana sayfaya yönlendir
  useEffect(() => {
    if (!loading && (!user || user.email !== 'admin@example.com')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Verileri yükle
  useEffect(() => {
    const fetchData = async () => {
      if (user && user.email === 'admin@example.com') {
        try {
          setLoading(true);
          
          // Verileri API'den çek
          const [symposiumData, mainTopics, paperTopics, komiteData] = await Promise.all([
            getAktifGenelBilgiler(),
            getAktifAnaKonular(),
            getBildiriKonulari(),
            getKomiteUyeleri()
          ]);
          
          // Sempozyum verilerini kaydet
          setSymposium(symposiumData);
          
          // Bildiri bilgilerini API'den çek
          const bildiriResponse = await bildiriService.getAll();
          const papers = bildiriResponse || [];
          
          // Kullanıcı bilgilerini API'den çek
          let allUsers: any[] = [];
          try {
            allUsers = await userService.getAllUsers();
          } catch (error) {
            console.error("Kullanıcı verileri alınamadı:", error);
          }
          
          // Hakemler için verileri çek
          let reviewers = [];
          try {
            reviewers = await userService.getReviewers();
          } catch (error) {
            console.error("Hakem verileri alınamadı:", error);
          }
          
          // İletişim mesajları - Gerçek API bağlantısı
          let unreadMessagesCount = 0;
          try {
            const token = getToken();
            if (token) {
              const messageResponse = await fetch('/api/iletisim?limit=1&offset=0', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (messageResponse.ok) {
                const messageData = await messageResponse.json();
                unreadMessagesCount = messageData.total || 0;
              }
            }
          } catch (error) {
            console.error("İletişim mesajları alınamadı:", error);
          }
          
          // İstatistikleri güncelle
          setStats({
            totalUsers: allUsers.filter(user => user.rol?.id === 2 || user.rol?.id === 4).length || 0,
            totalPapers: papers?.length || 0,
            pendingPapers: papers?.filter(p => p.durum === 'beklemede' || p.durum === 'incelemede')?.length || 0,
            acceptedPapers: papers?.filter(p => p.durum === 'kabul_edildi')?.length || 0,
            rejectedPapers: papers?.filter(p => p.durum === 'reddedildi')?.length || 0,
            totalReviewers: reviewers?.length || 0,
            totalMainTopics: mainTopics?.length || 0,
            totalPaperTopics: paperTopics?.length || 0,
            totalKomiteUyeleri: komiteData?.length || 0,
            unreadMessages: unreadMessagesCount
          });
          
        } catch (error) {
          console.error("Veri yüklenirken hata oluştu:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Admin olmayan kullanıcılar için içerik gösterme
  if (!user || user.email !== 'admin@example.com') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Paneli</h1>
          <p className="mt-2 text-sm text-gray-600">
            Hoş geldiniz, Admin. Sempozyum yönetim paneline erişebilirsiniz.
          </p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Toplam Kullanıcı</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalUsers}</dd>
              </dl>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Toplam Bildiri</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalPapers}</dd>
              </dl>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Bekleyen Bildiriler</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingPapers}</dd>
              </dl>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Kabul Edilen Bildiriler</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.acceptedPapers}</dd>
              </dl>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Reddedilen Bildiriler</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.rejectedPapers}</dd>
              </dl>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Toplam Komite Üyesi</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalKomiteUyeleri}</dd>
              </dl>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Yeni Mesajlar</dt>
                <dd className="mt-1 text-3xl font-semibold text-blue-600">{stats.unreadMessages}</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Hızlı Erişim Linkleri */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/papers" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Bildiri ve Hakem Atama</h3>
            <p className="text-gray-600">Bildiri başvurularını görüntüle ve hakem ataması yap.</p>
          </Link>
          
          <Link href="/admin/symposium" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Sempozyum Aç/Kapat</h3>
            <p className="text-gray-600">Sempozyumu aç veya kapat.</p>
          </Link>
          
          <Link href="/admin/program" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Program Yönetimi</h3>
            <p className="text-gray-600">Sempozyum programını oluştur ve düzenle.</p>
          </Link>
          
          <Link href="/admin/reviewers" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Hakem Yönetimi</h3>
            <p className="text-gray-600">Hakemleri görüntüle, ekle ve bildiri değerlendirme ataması yap.</p>
          </Link>
          
          <Link href="/admin/editors" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Editör Yönetimi</h3>
            <p className="text-gray-600">Editörleri görüntüle ve yeni editör ekle.</p>
          </Link>
          
          <Link href="/admin/journals" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Dergiler</h3>
            <p className="text-gray-600">Dergileri yönet ve düzenle.</p>
          </Link>
          
          <Link href="/admin/komiteler" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Komiteler</h3>
            <p className="text-gray-600">Bilim, yürütme ve düzenleme komitelerini yönet.</p>
          </Link>
          
          <Link href="/admin/archive" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Arşiv</h3>
            <p className="text-gray-600">Geçmiş sempozyum kayıtlarına ve bildirilere erişim sağla.</p>
          </Link>

          <Link href="/admin/homepage" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">Site Ayarları</h3>
            <p className="text-gray-600">Sempozyum bilgilerini ve site içeriğini düzenle.</p>
          </Link>

          <Link href="/admin/contact-messages" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold mb-2">İletişim Mesajları</h3>
            <p className="text-gray-600">Kullanıcılardan gelen iletişim mesajlarını görüntüle ve yanıtla.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;