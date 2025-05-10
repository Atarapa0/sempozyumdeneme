// Bu dosya servis yapısına geçiş için eski API istemcisini içermektedir.
// DEPRECATED: Yeni kod src/lib/services altındaki servisleri kullanmalıdır.

import axios from 'axios';
// import * as db from './database'; // Veritabanı entegrasyonu tamamlandığında silinecek

// API istemcisi için axios instance
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek interceptor'ı - token ekleme
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Api istemcisini dışa aktar
export { apiClient };

// NOT: Aşağıdaki yönlendirmeler döngüsel bağımlılığa neden oluyordu,
// bu nedenle kaldırıldı. Lütfen doğrudan servisleri kullanın:
// import { authService, sempozyumService, ... } from '@/lib/services';

// Auth servisi - Yeni servis yapısından alınıyor (Tamamlandı)
import { authService } from './services';
export const authApi = authService;

// Duyurular için API - Henüz veritabanına bağlanmadı
export const announcementsApi = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/announcements');
      return response.data;
    } catch (error) {
      console.error('Duyuru alma hatası:', error);
      throw new Error('Duyurular alınamadı');
    }
  },
  
  add: async (data: { title: string; content: string }) => {
    try {
      const response = await apiClient.post('/announcements', data);
      return response.data;
    } catch (error) {
      console.error('Duyuru ekleme hatası:', error);
      throw new Error('Duyuru eklenemedi');
    }
  }
};

// Sempozyum API - Henüz veritabanına bağlanmadı
export const sempozyumApi = {
  getActive: async () => {
    try {
      const response = await apiClient.get('/sempozyum/active');
      return response.data;
    } catch (error) {
      console.error('Sempozyum bilgisi alma hatası:', error);
      throw new Error('Aktif sempozyum bilgileri alınamadı');
    }
  },
  
  getById: async (id: number) => {
    try {
      const response = await apiClient.get(`/sempozyum/${id}`);
      return response.data;
    } catch (error) {
      console.error('Sempozyum bilgisi alma hatası:', error);
      throw new Error('Sempozyum bilgileri alınamadı');
    }
  }
};

// Bildiri API - Henüz veritabanına bağlanmadı
export const bildiriApi = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/bildiriler');
      return response.data;
    } catch (error) {
      console.error('Bildiri alma hatası:', error);
      throw new Error('Bildiriler alınamadı');
    }
  },
  
  getById: async (id: number) => {
    try {
      const response = await apiClient.get(`/bildiriler/${id}`);
      return response.data;
    } catch (error) {
      console.error('Bildiri alma hatası:', error);
      throw new Error('Bildiri alınamadı');
    }
  },
  
  add: async (data: any) => {
    try {
      const response = await apiClient.post('/bildiriler', data);
      return response.data;
    } catch (error) {
      console.error('Bildiri ekleme hatası:', error);
      throw new Error('Bildiri eklenemedi');
    }
  },
  
  update: async (id: number, data: any) => {
    try {
      const response = await apiClient.put(`/bildiriler/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Bildiri güncelleme hatası:', error);
      throw new Error('Bildiri güncellenemedi');
    }
  },
  
  delete: async (id: number) => {
    try {
      const response = await apiClient.delete(`/bildiriler/${id}`);
      return response.data;
    } catch (error) {
      console.error('Bildiri silme hatası:', error);
      throw new Error('Bildiri silinemedi');
    }
  }
};

// Kullanıcı API - Henüz veritabanına bağlanmadı
export const userApi = {
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Profil bilgisi alma hatası:', error);
      throw new Error('Profil bilgileri alınamadı');
    }
  },
  
  updateProfile: async (data: any) => {
    try {
      const response = await apiClient.put('/users/profile', data);
      return response.data;
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      throw new Error('Profil güncellenemedi');
    }
  }
};

// Genel Bilgiler API - Henüz veritabanına bağlanmadı
export const genelBilgilerApi = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/genel-bilgiler');
      return response.data;
    } catch (error) {
      console.error('Genel bilgiler alma hatası:', error);
      throw new Error('Genel bilgiler alınamadı');
    }
  },
  
  getById: async (id: number) => {
    try {
      const response = await apiClient.get(`/genel-bilgiler/${id}`);
      return response.data;
    } catch (error) {
      console.error('Genel bilgiler alma hatası:', error);
      throw new Error('Genel bilgiler alınamadı');
    }
  }
};

// Önemli Tarihler API - Henüz veritabanına bağlanmadı
export const onemliTarihlerApi = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/onemli-tarihler');
      return response.data;
    } catch (error) {
      console.error('Önemli tarihler alma hatası:', error);
      throw new Error('Önemli tarihler alınamadı');
    }
  },
  
  getById: async (id: number) => {
    try {
      const response = await apiClient.get(`/onemli-tarihler/${id}`);
      return response.data;
    } catch (error) {
      console.error('Önemli tarihler alma hatası:', error);
      throw new Error('Önemli tarihler alınamadı');
    }
  }
};

// Sponsor API - Henüz veritabanına bağlanmadı
export const sponsorApi = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/sponsor');
      return response.data;
    } catch (error) {
      console.error('Sponsor alma hatası:', error);
      throw new Error('Sponsorlar alınamadı');
    }
  },
  
  getById: async (id: number) => {
    try {
      const response = await apiClient.get(`/sponsor/${id}`);
      return response.data;
    } catch (error) {
      console.error('Sponsor alma hatası:', error);
      throw new Error('Sponsor alınamadı');
    }
  }
}; 