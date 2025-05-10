'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { getToken } from '@/lib/utils/token';

// Interface for contact message data
interface Message {
  id: string;
  adSoyad: string;
  eposta: string;
  konu: string;
  mesaj: string;
  createdAt: string;
}

const ContactMessagesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0
  });

  // Redirect non-admin users to home page
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Fetch messages from API
  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === 'admin') {
        try {
          setLoading(true);
          const token = getToken();
          
          if (!token) {
            console.error("Token bulunamadı");
            setLoading(false);
            return;
          }
          
          const response = await fetch(`/api/iletisim?limit=${pagination.limit}&offset=${pagination.offset}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("API Yanıtı:", data);
          setMessages(data.messages || []);
          setPagination({
            ...pagination,
            total: data.total || 0
          });
          setLoading(false);
        } catch (error) {
          console.error("Mesajlar yüklenirken hata oluştu:", error);
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [user, pagination.limit, pagination.offset]);

  // Message selection handler
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
  };

  // Delete message
  const handleDelete = async (messageId: string) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    
    try {
      const token = getToken();
      
      if (!token) {
        console.error("Token bulunamadı");
        return;
      }
      
      const response = await fetch(`/api/iletisim/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Update local state
      const updatedMessages = messages.filter(msg => msg.id !== messageId);
      setMessages(updatedMessages);
      
      if (selectedMessage && selectedMessage.id === messageId) {
        setSelectedMessage(null);
      }
      
      alert('Mesaj başarıyla silindi!');
    } catch (error) {
      console.error("Mesaj silinirken hata oluştu:", error);
      alert('Mesaj silinirken bir hata oluştu.');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render anything for non-admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">İletişim Mesajları</h1>
            <p className="mt-2 text-sm text-gray-600">
              Kullanıcılardan gelen iletişim mesajlarını görüntüle.
            </p>
          </div>
          <Link href="/admin/dashboard" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Admin Paneline Dön
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="p-4 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Gelen Mesajlar</h3>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Message List */}
            <div className="md:w-1/3 border-r border-gray-200">
              <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <li 
                      key={message.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedMessage?.id === message.id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleSelectMessage(message)}
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{message.adSoyad}</p>
                          <p className="text-xs text-gray-500">{formatDate(message.createdAt)}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-700 truncate">{message.konu}</p>
                        </div>
                        <div className="mt-1">
                          <p className="text-xs text-gray-500 truncate">{message.mesaj.substring(0, 60)}...</p>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button 
                            className="text-red-600 hover:text-red-800 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(message.id);
                            }}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-8 text-center text-gray-500">
                    <p>Mesaj bulunamadı.</p>
                  </li>
                )}
              </ul>
            </div>

            {/* Message Detail */}
            <div className="md:w-2/3 p-4">
              {selectedMessage ? (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">{selectedMessage.konu}</h3>
                    <div className="flex justify-between text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-semibold">Gönderen:</span> {selectedMessage.adSoyad} ({selectedMessage.eposta})
                      </div>
                      <div>
                        <span className="font-semibold">Tarih:</span> {formatDate(selectedMessage.createdAt)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-gray-800">{selectedMessage.mesaj}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <p className="mt-2 text-gray-500">Bir mesaj seçin</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-700 disabled:opacity-50"
                onClick={() => setPagination({...pagination, offset: Math.max(0, pagination.offset - pagination.limit)})}
                disabled={pagination.offset === 0}
              >
                Önceki
              </button>
              <button
                className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-700 disabled:opacity-50"
                onClick={() => setPagination({...pagination, offset: pagination.offset + pagination.limit})}
                disabled={pagination.offset + pagination.limit >= pagination.total}
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactMessagesPage; 