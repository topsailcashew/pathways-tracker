// Simple test to check if the server can start
import dotenv from 'dotenv';
dotenv.config();

console.log('Environment loaded');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);

import('./app')
    .then(() => {
        console.log('✅ App module loaded successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error loading app:', error);
        process.exit(1);
    });
