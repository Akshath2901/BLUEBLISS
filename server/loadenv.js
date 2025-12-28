import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
console.log('✅ .env loaded');
console.log('API Key exists:', !!process.env.HUGGING_FACE_API_KEY);