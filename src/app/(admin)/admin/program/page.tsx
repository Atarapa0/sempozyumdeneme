'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  ProgramItem 
} from '@/lib/database';
import {
  getProgramEtkinlikleri,
  programEtkinligiEkle,
  programEtkinligiGuncelle,
  programEtkinligiSil
} from '@/lib/services';
import { sempozyumService, Sempozyum } from '@/lib/services/sempozyum.service';

export default function ProgramEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [programItems, setProgramItems] = useState<ProgramItem[]>([]);
  const [editingItem, setEditingItem] = useState<ProgramItem | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [aktifSempozyum, setAktifSempozyum] = useState<Sempozyum | null>(null);
  
  // Yeni program öğesi için form state'i
  const [newItem, setNewItem] = useState<Omit<ProgramItem, 'id' | 'createdAt' | 'updatedAt'>>({
    day: '1',
    startTime: '09:00',
    endTime: '10:00',
    title: '',
    location: '',
    type: 'session',
    symposiumId: '' // Aktif sempozyum ID'si daha sonra atanacak
  });
  
  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    fetchData();
  }, [user, router]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Aktif sempozyumu al
      const sempozyum = await sempozyumService.getAktifSempozyum();
      setAktifSempozyum(sempozyum);
      
      // Formun başlangıç değerini aktif sempozyum ID'si ile ayarla
      if (sempozyum) {
        setNewItem(prev => ({
          ...prev,
          symposiumId: sempozyum.id.toString()
        }));
      }
      
      // Program verilerini al
      const programData = await getProgramEtkinlikleri();
      setProgramItems(programData);
      
      setLoading(false);
    } catch (error) {
      console.error("Veriler yüklenirken hata oluştu:", error);
      setMessage({ type: 'error', text: 'Veriler yüklenirken bir hata oluştu.' });
      setLoading(false);
    }
  };
  
  // Form input değişikliklerini işle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        [name]: value
      });
    } else {
      setNewItem({
        ...newItem,
        [name]: value
      });
    }
  };
  
  // Yeni program öğesi ekle
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aktifSempozyum) {
      setMessage({ type: 'error', text: 'Aktif sempozyum bulunamadı. Lütfen önce bir sempozyum oluşturun veya aktifleştirin.' });
      return;
    }
    
    if (!newItem.title || !newItem.location) {
      setMessage({ type: 'error', text: 'Lütfen başlık ve konum alanlarını doldurun.' });
      return;
    }
    
    try {
      setLoading(true);
      
      // API servisi kullanarak program öğesini ekle
      const addedItem = await programEtkinligiEkle(newItem);
      
      setProgramItems([...programItems, addedItem]);
      
      // Formu temizle
      setNewItem({
        day: '1',
        startTime: '09:00',
        endTime: '10:00',
        title: '',
        location: '',
        type: 'session',
        symposiumId: aktifSempozyum.id.toString()
      });
      
      setMessage({ type: 'success', text: 'Program öğesi başarıyla eklendi.' });
    } catch (error) {
      console.error("Program öğesi eklenirken hata oluştu:", error);
      setMessage({ type: 'error', text: 'Program öğesi eklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };
  
  // Düzenleme işlemi için öğeyi seç
  const handleEditClick = (item: ProgramItem) => {
    setEditingItem(item);
  };
  
  // Düzenleme işlemini iptal et
  const handleCancelEdit = () => {
    setEditingItem(null);
  };
  
  // Program öğesini güncelle
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItem) return;
    
    if (!editingItem.title || !editingItem.location) {
      setMessage({ type: 'error', text: 'Lütfen başlık ve konum alanlarını doldurun.' });
      return;
    }
    
    try {
      setLoading(true);
      
      // API servisi kullanılarak program öğesini güncelle
      const updatedItem = await programEtkinligiGuncelle(editingItem.id, editingItem);
      
      setProgramItems(programItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ));
      
      setEditingItem(null);
      
      setMessage({ type: 'success', text: 'Program öğesi başarıyla güncellendi.' });
    } catch (error) {
      console.error("Program öğesi güncellenirken hata oluştu:", error);
      setMessage({ type: 'error', text: 'Program öğesi güncellenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };
  
  // Program öğesini sil
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Bu program öğesini silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      // API servisi kullanılarak program öğesini sil
      await programEtkinligiSil(id);
      setProgramItems(programItems.filter(item => item.id !== id));
      setMessage({ type: 'success', text: 'Program öğesi başarıyla silindi.' });
    } catch (error) {
      console.error("Program öğesi silinirken hata oluştu:", error);
      setMessage({ type: 'error', text: 'Program öğesi silinirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };
  
  // Program öğelerini günlere göre grupla
  const groupedItems = programItems.reduce((groups, item) => {
    const day = item.day;
    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(item);
    return groups;
  }, {} as Record<string, ProgramItem[]>);
  
  // Günleri sırala
  const sortedDays = Object.keys(groupedItems).sort();
  
  if (!user) {
    return null;
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (!aktifSempozyum) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Program Yönetimi</h1>
          <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
            Admin Panele Dön
          </Link>
        </div>
        
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">
                Aktif sempozyum bulunamadı. Program eklemek için önce bir sempozyum oluşturmanız veya aktifleştirmeniz gerekmektedir.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-4">
          <Link href="/admin/symposium" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
            Sempozyum Yönetimine Git
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Program Yönetimi</h1>
        <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
          Admin Panele Dön
        </Link>
      </div>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Sol Taraf - Program Öğesi Ekleme/Düzenleme Formu */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">
              {editingItem ? 'Program Öğesi Düzenle' : 'Program Öğesi Ekle'}
            </h2>
            
            <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gün</label>
                <select
                  name="day"
                  value={editingItem ? editingItem.day : newItem.day}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="1">1. Gün</option>
                  <option value="2">2. Gün</option>
                  <option value="3">3. Gün</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Saati</label>
                  <input
                    type="time"
                    name="startTime"
                    value={editingItem ? editingItem.startTime : newItem.startTime}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Saati</label>
                  <input
                    type="time"
                    name="endTime"
                    value={editingItem ? editingItem.endTime : newItem.endTime}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input
                  type="text"
                  name="title"
                  value={editingItem ? editingItem.title : newItem.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  placeholder="Örn: Açılış Konuşması, Oturum 1, Kahve Molası..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                <select
                  name="type"
                  value={editingItem ? editingItem.type : newItem.type}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="opening">Açılış</option>
                  <option value="keynote">Davetli Konuşmacı</option>
                  <option value="session">Oturum</option>
                  <option value="break">Ara (Kahve/Yemek)</option>
                  <option value="social">Sosyal Etkinlik</option>
                  <option value="closing">Kapanış</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                <input
                  type="text"
                  name="location"
                  value={editingItem ? editingItem.location : newItem.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  placeholder="Örn: A Salonu, Fuaye Alanı..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konuşmacı (opsiyonel)</label>
                <input
                  type="text"
                  name="speaker"
                  value={editingItem ? editingItem.speaker || '' : newItem.speaker || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (opsiyonel)</label>
                <textarea
                  name="description"
                  value={editingItem ? editingItem.description || '' : newItem.description || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oturum Başkanı (opsiyonel)</label>
                <input
                  type="text"
                  name="sessionChair"
                  value={editingItem ? editingItem.sessionChair || '' : newItem.sessionChair || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className={`${editingItem ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded`}
                  disabled={loading}
                >
                  {loading ? 'İşleniyor...' : editingItem ? 'Güncelle' : 'Ekle'}
                </button>
                
                {editingItem && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                  >
                    İptal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Sağ Taraf - Program Listesi */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Program</h2>
            
            {programItems.length > 0 ? (
              <div className="space-y-6">
                {sortedDays.map(day => (
                  <div key={day} className="border-b pb-4 mb-4 last:border-b-0">
                    <h3 className="text-lg font-medium mb-3">
                      {day === '1' ? '1. Gün' : day === '2' ? '2. Gün' : day === '3' ? '3. Gün' : `${day}. Gün`}
                    </h3>
                    
                    <div className="space-y-3">
                      {groupedItems[day]
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map(item => (
                          <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-md">
                            <div>
                              <div className="font-medium">{item.title}</div>
                              <div className="text-sm text-gray-600">
                                {item.startTime} - {item.endTime} | {item.location}
                              </div>
                              {item.speaker && (
                                <div className="text-sm text-gray-600">
                                  Konuşmacı: {item.speaker}
                                </div>
                              )}
                              {item.sessionChair && (
                                <div className="text-sm text-gray-600">
                                  Oturum Başkanı: {item.sessionChair}
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditClick(item)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Henüz program öğesi eklenmemiş.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 