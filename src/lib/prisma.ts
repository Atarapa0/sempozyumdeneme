import { PrismaClient } from '@prisma/client';

// PrismaClient'ı global olarak saklamak için tip tanımı
declare global {
  var prisma: PrismaClient | undefined;
}

// Geliştirme ortamında gereksiz bağlantıları önlemek için global nesneyi kullanıyoruz
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
