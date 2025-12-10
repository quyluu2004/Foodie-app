import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('🔍 Testing videoStorage import...\n');

// Import videoStorage (giống như trong recipe.routes.js)
try {
  const { videoStorage } = await import('../src/config/cloudinary.js');
  
  console.log('📋 videoStorage check:');
  console.log(`   videoStorage: ${videoStorage ? '✅ NOT NULL' : '❌ NULL'}`);
  console.log(`   Type: ${typeof videoStorage}`);
  console.log(`   Constructor: ${videoStorage?.constructor?.name || 'N/A'}`);
  console.log('');
  
  if (videoStorage) {
    console.log('✅✅✅ videoStorage is properly configured! ✅✅✅');
  } else {
    console.error('❌❌❌ videoStorage is NULL! ❌❌❌');
    console.error('');
    console.error('Current process.env:');
    console.error(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME || 'UNDEFINED'}`);
    console.error(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY || 'UNDEFINED'}`);
    console.error(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? 'SET (hidden)' : 'UNDEFINED'}`);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ ERROR importing cloudinary.js:', error.message);
  console.error(error.stack);
  process.exit(1);
}

