import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('🔍 Testing Cloudinary Configuration...\n');

// Check environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('📋 Environment Variables:');
console.log(`   CLOUDINARY_CLOUD_NAME: ${cloudName ? '✅ ' + cloudName : '❌ NOT SET'}`);
console.log(`   CLOUDINARY_API_KEY: ${apiKey ? '✅ ' + apiKey : '❌ NOT SET'}`);
console.log(`   CLOUDINARY_API_SECRET: ${apiSecret ? '✅ SET (hidden)' : '❌ NOT SET'}`);
console.log('');

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ ERROR: Missing Cloudinary configuration!');
  console.error('   Please check your .env file.');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

console.log('🔧 Cloudinary configured with:');
console.log(`   Cloud Name: ${cloudName}`);
console.log(`   API Key: ${apiKey}`);
console.log('');

// Test Cloudinary connection
console.log('🧪 Testing Cloudinary connection...');
try {
  // Test API call - ping Cloudinary
  const result = await cloudinary.api.ping();
  console.log('✅ Cloudinary connection successful!');
  console.log(`   Status: ${result.status}`);
  console.log('');
  
  // Test listing resources
  console.log('🧪 Testing resource access...');
  const resources = await cloudinary.api.resources({
    type: 'upload',
    resource_type: 'video',
    max_results: 1
  });
  
  console.log('✅ Resource access successful!');
  console.log(`   Total videos: ${resources.total_count || 0}`);
  console.log('');
  
  console.log('✅✅✅ ALL TESTS PASSED! Cloudinary is properly configured. ✅✅✅');
  
} catch (error) {
  console.error('❌ ERROR: Cloudinary connection failed!');
  console.error(`   Error: ${error.message}`);
  console.error('');
  
  if (error.http_code === 401) {
    console.error('   ⚠️  Authentication failed!');
    console.error('   Please check:');
    console.error('     1. CLOUDINARY_API_KEY is correct');
    console.error('     2. CLOUDINARY_API_SECRET is correct');
    console.error('     3. API Key and Secret belong to the same Cloudinary account');
  } else if (error.http_code === 404) {
    console.error('   ⚠️  Cloud not found!');
    console.error('   Please check CLOUDINARY_CLOUD_NAME is correct');
  } else {
    console.error('   ⚠️  Unexpected error:', error);
  }
  
  process.exit(1);
}

