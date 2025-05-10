import { Prisma } from '@prisma/client';

// Kullanici Select tipi genişletmesi
declare global {
  namespace PrismaJson {
    type HakemYetenekleri = {
      konular?: string[];
      [key: string]: any;
    };
  }
}

// Prisma namespace'ini genişlet
declare namespace Prisma {
  // Kullanici modelinin Select tipini genişlet
  export interface KullaniciSelect {
    hakem_yetenekleri?: boolean;
  }
  
  // Kullanici modelinin createInput ve updateInput tiplerini genişlet
  export interface KullaniciCreateInput {
    hakem_yetenekleri?: any;
  }
  
  export interface KullaniciUpdateInput {
    hakem_yetenekleri?: any;
  }
  
  export interface KullaniciUncheckedUpdateInput {
    hakem_yetenekleri?: any;
  }
}

export {}; 