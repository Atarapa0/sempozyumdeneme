// @ts-check
const { execSync } = require('child_process');
const path = require('path');

/**
 * Prisma client için generate script
 */
async function main() {
  try {
    console.log('🔄 Prisma şeması derleniyor...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client başarıyla oluşturuldu!');
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

main(); 