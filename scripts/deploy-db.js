// @ts-check
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Supabase projesine veritabanı şemasını deploy etmek için script
 */
async function main() {
  try {
    console.log('🔄 Veritabanı şeması derleniyor...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('⬆️ Supabase veritabanına şema yükleniyor...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('✅ Veritabanı başarıyla yüklendi!');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

main(); 