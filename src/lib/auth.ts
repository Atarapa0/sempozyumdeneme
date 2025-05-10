import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import { Rol, Kullanici } from '@prisma/client';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { Session } from "next-auth";

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.HASH_SALT_ROUNDS || '10');
  return bcrypt.hash(password, saltRounds);
}

// Verify a password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate a JWT token
export function generateToken(user: any): string {
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role?.toLowerCase(),
      rolId: user.rolId,
      eposta: user.eposta,
      ad: user.ad,
      soyad: user.soyad
    },
    process.env.NEXTAUTH_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  
  // Token'ı localStorage'a kaydet
  localStorage.setItem('token', token);
  
  return token;
}

// Verify a JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
  } catch (error) {
    return null;
  }
}

// Get user by email
export async function getUserByEmail(email: string) {
  return prisma.kullanici.findUnique({
    where: { eposta: email }
  });
}

// Create a new user
export async function createUser(userData: {
  email: string;
  password: string;
  name: string;
  surname: string;
  title?: string;
  institution?: string;
  roleId?: number;
}) {
  const hashedPassword = await hashPassword(userData.password);
  
  return prisma.kullanici.create({
    data: {
      eposta: userData.email,
      sifre: hashedPassword,
      ad: userData.name,
      soyad: userData.surname,
      unvan: userData.title || '',
      universite: userData.institution || '',
      rolId: userData.roleId || 1, // Varsayılan rol ID'si
      cepTel: '', // Zorunlu alan
      kurum: userData.institution || '',
      kongreKatilimSekli: 'yazar' // Zorunlu alan
    }
  });
}

// NextAuth için özel tip tanımlamaları
declare module "next-auth" {
  interface User {
    id: number;
    email: string;
    name: string;
    roleId: number;
  }
  
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    roleId: number;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email ve şifre gerekli');
        }

        const user = await prisma.kullanici.findUnique({
          where: {
            eposta: credentials.email
          }
        });

        if (!user) {
          throw new Error('Kullanıcı bulunamadı');
        }

        const isPasswordValid = await compare(credentials.password, user.sifre);

        if (!isPasswordValid) {
          throw new Error('Geçersiz şifre');
        }

        return {
          id: user.id,
          email: user.eposta,
          name: `${user.ad} ${user.soyad}`,
          roleId: user.rolId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        token.roleId = typeof user.roleId === 'string' ? parseInt(user.roleId, 10) : user.roleId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = typeof token.id === 'string' ? parseInt(token.id, 10) : token.id;
        session.user.roleId = typeof token.roleId === 'string' ? parseInt(token.roleId, 10) : token.roleId;
      }
      return session;
    }
  }
};

export async function getSession(): Promise<Session | null> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ localStorage\'da token bulunamadı');
      return null;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.warn('⚠️ localStorage\'da kullanıcı bilgisi bulunamadı');
      return null;
    }

    const user = JSON.parse(userStr);
    
    // Token ve kullanıcı bilgilerini senkronize et
    const decodedToken = jwt.decode(token) as any;
    if (!decodedToken) {
      console.warn('⚠️ Token geçersiz');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }

    // Token'daki rol bilgilerini kontrol et
    console.log('Token içindeki rol bilgileri:', {
      role: decodedToken.role,
      rolId: decodedToken.rolId,
      userId: decodedToken.id
    });

    // LocalStorage'daki kullanıcı bilgilerini kontrol et
    console.log('LocalStorage\'daki kullanıcı bilgileri:', {
      role: user.role,
      rolId: user.rolId,
      id: user.id
    });

    // Token ve localStorage bilgilerini senkronize et
    if (decodedToken.id !== user.id) {
      console.warn('Token ve localStorage kullanıcı bilgileri eşleşmiyor, yetkilendirme düzeltiliyor');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }

    // Rol bilgilerini güncelle
    if (!user.rolId || user.rolId === 5) {
      // Rol ID'ye göre doğru rolü belirle
      switch (user.role?.toLowerCase()) {
        case 'admin':
          user.rolId = 1;
          break;
        case 'editor':
          user.rolId = 2;
          break;
        case 'hakem':
          user.rolId = 3;
          break;
        case 'yazar':
          user.rolId = 4;
          break;
        default:
          user.rolId = 4; // Varsayılan olarak yazar rolü
      }
      
      // Rol adını düzelt
      user.role = user.role?.toLowerCase();
      
      // Güncellenmiş kullanıcı bilgisini kaydet
      localStorage.setItem('user', JSON.stringify(user));
    }

    // Token'ın süresi dolmuş mu kontrol et
    if (decodedToken.exp * 1000 < Date.now()) {
      console.warn('⚠️ Token süresi dolmuş');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }

    // Kullanıcı yetkilerini kontrol et
    const isEditorOrAdmin = user.role === 'editor' || user.role === 'admin';
    console.log('Kullanıcı editör/admin yetkilerine sahip:', isEditorOrAdmin);

    return {
      user,
      expires: new Date(decodedToken.exp * 1000).toISOString()
    };
  } catch (error) {
    console.error('Session alınırken hata:', error);
    return null;
  }
}
