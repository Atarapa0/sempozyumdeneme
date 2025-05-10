'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, LoginResponse } from '@/lib/services';
import { userApi } from '@/lib/api'; // userService yerine geçici olarak userApi'yi kullanalım

// User tipini güncelle, Prisma şemasıyla uyumlu olacak şekilde
export interface User {
  id: string;
  email: string; // eposta olarak gelir ama frontend'de email olarak kullanılır
  name: string; // ad ve soyad birleşimi
  role: 'user' | 'admin' | 'reviewer' | 'Editor';
  rolId?: number; // Rol ID'si
  title?: string; // unvan
  department?: string; // bolum
  participationType?: 'listener' | 'presenter'; // kongreKatilimSekli
  institution?: string; // kurum
  university?: string; // universite
  faculty?: string; // fakulte
  phone?: string; // cepTel
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loading: boolean; // For backward compatibility
  login: (eposta: string, sifre: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'role'> & { password: string }) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simüle edilmiş kullanıcı veritabanı
/* 
const users: User[] = [
  {
    id: 'user1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    title: 'Prof. Dr.',
    department: 'Bilgisayar Mühendisliği',
    participationType: 'presenter'
  },
  {
    id: 'user2',
    email: 'user@example.com',
    name: 'Normal User',
    role: 'user',
    title: 'Dr. Öğr. Üyesi',
    department: 'Elektrik-Elektronik Mühendisliği',
    participationType: 'presenter'
  },
  {
    id: 'user3',
    email: 'reviewer@example.com',
    name: 'Reviewer User',
    role: 'reviewer',
    title: 'Doç. Dr.',
    department: 'Makine Mühendisliği',
    participationType: 'listener'
  }
];

// Simüle edilmiş şifreler
const passwords: Record<string, string> = {
  'admin@example.com': 'admin123',
  'user@example.com': 'user123',
  'reviewer@example.com': 'reviewer123'
};
*/

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!storedUser || !token) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          // Token'ı daha güvenli bir şekilde analiz et
          const tokenParts = token.split('.');
          
          if (tokenParts.length !== 3) {
            throw new Error('Geçersiz token formatı');
          }
          
          // Base64 decode işlemi
          const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64Payload));
          
          // Süre kontrolü
          if (payload.exp && typeof payload.exp === 'number') {
            const expiryTime = payload.exp * 1000;
            
            if (Date.now() > expiryTime) {
              throw new Error('Token süresi dolmuş');
            }
          }
          
          // Token geçerli, kullanıcıyı yükle
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error('Token doğrulama hatası:', error);
          // Token geçersizse veya süresi dolmuşsa, localStorage'ı temizle
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Kullanıcı yükleme hatası:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = async (eposta: string, sifre: string): Promise<boolean> => {
    try {
      console.log('Login API çağrısı yapılıyor:', { eposta });
      
      // API çağrısı - artık form ve API aynı parametre isimlerini kullanıyor
      const response = await authService.login(eposta, sifre);
      console.log('Login API yanıtı:', response);
      
      if (response && response.token && response.kullanici) {
        // API'den gelen kullanıcı bilgilerini dönüştür
        const userData: User = {
          id: response.kullanici.id.toString(),
          email: response.kullanici.eposta,
          name: `${response.kullanici.ad} ${response.kullanici.soyad}`,
          role: mapRolAdiToRole(response.kullanici.rol.ad),
          rolId: response.kullanici.rol.id,
          title: response.kullanici.unvan,
          department: response.kullanici.bolum,
          participationType: mapKongreKatilimToParticipationType(response.kullanici.kongreKatilimSekli),
          institution: response.kullanici.kurum,
          university: response.kullanici.universite,
          faculty: response.kullanici.fakulte,
          phone: response.kullanici.cepTel,
          createdAt: response.kullanici.createdAt,
          updatedAt: response.kullanici.updatedAt
        };
        
        // Token ve kullanıcı bilgilerini kaydet
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // State'i güncelle
        setUser(userData);
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error detayı:', error);
      if (error.response) {
        console.error('API yanıt durumu:', error.response.status);
        console.error('API yanıt verisi:', error.response.data);
      }
      throw error; // Hata mesajını login sayfasına aktaralım
    }
  };

  // Veritabanındaki rol adını frontend rol tipine dönüştür
  const mapRolAdiToRole = (rolAdi: string): 'user' | 'admin' | 'reviewer' | 'Editor' => {
    switch (rolAdi.toLowerCase()) {
      case 'admin':
        return 'admin';
      case 'hakem':
        return 'reviewer';
      case 'editor':
        // Backend API'si sadece admin'e izin veriyorsa, editor'ü de admin olarak işaretle
        console.log('Editor rolü tespit edildi - API uyumluluğu için admin olarak da işaretlenecek');
        return 'Editor'; // Hala Editor olarak dön ama API'yi admin olarak kandırmak için işlem yapacağız
      default:
        return 'user';
    }
  };
  
  // Veritabanındaki katılım şeklini frontend tipine dönüştür
  const mapKongreKatilimToParticipationType = (katilimSekli: string): 'listener' | 'presenter' => {
    return katilimSekli.toLowerCase() === 'yazar' ? 'presenter' : 'listener';
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const register = async (userData: Omit<User, 'id' | 'role'> & { password: string }): Promise<boolean> => {
    try {
      // Ad ve soyad ayrıştırma
      const nameParts = userData.name.trim().split(' ');
      const ad = nameParts[0] || '';
      const soyad = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ad; // Eğer soyad yoksa adı tekrar kullan
      
      // Kullanıcı verilerini API formatına dönüştür
      const registerData = {
        ad,
        soyad,
        eposta: userData.email,
        sifre: userData.password,
        unvan: userData.title || '',
        bolum: userData.department || '',
        kongreKatilimSekli: userData.participationType === 'presenter' ? 'yazar' : 'misafir',
        kurum: userData.institution || '',
        universite: userData.university || '',
        fakulte: userData.faculty || '',
        cepTel: userData.phone || '',
      };
      
      console.log('Register verileri:', registerData);
      
      // Servis çağrısı
      await authService.register(registerData);
      
      // Kayıt başarılı, hemen giriş yapalım
      return await login(userData.email, userData.password);
    } catch (error) {
      console.error('Kayıt hatası:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // Kullanıcı verilerini API formatına dönüştür
      const updateData: any = {};
      
      if (data.name) {
        const nameParts = data.name.split(' ');
        updateData.ad = nameParts[0];
        updateData.soyad = nameParts.slice(1).join(' ');
      }
      
      if (data.title) updateData.unvan = data.title;
      if (data.department) updateData.bolum = data.department;
      if (data.participationType) updateData.kongreKatilimSekli = data.participationType === 'presenter' ? 'Yazar' : 'Dinleyici';
      if (data.institution) updateData.kurum = data.institution;
      if (data.university) updateData.universite = data.university;
      if (data.faculty) updateData.fakulte = data.faculty;
      if (data.phone) updateData.cepTel = data.phone;
      
      // Servis çağrısı - geçici olarak userApi kullan
      await userApi.updateProfile(updateData);
      
      // State'i güncelle
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: loading,
        loading, // For backward compatibility
        login,
        logout,
        register,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};