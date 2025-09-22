// Only load .env if environment variables aren't already set (Docker containers usually have them set)
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    require('dotenv').config();
}

const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');

console.log('=== Database Environment Debug ===');
console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL);
console.log('TURSO_AUTH_TOKEN exists:', !!process.env.TURSO_AUTH_TOKEN);
console.log('TURSO_AUTH_TOKEN length:', process.env.TURSO_AUTH_TOKEN ? process.env.TURSO_AUTH_TOKEN.length : 'undefined');
console.log('All env vars with TURSO:', Object.keys(process.env).filter(key => key.includes('TURSO')));
console.log('================================');

// Validate that required environment variables are set
if (!process.env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL is required but not set');
}
if (!process.env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_AUTH_TOKEN is required but not set');
}

try {
    console.log('Creating Turso adapter with direct configuration');

    // Create the adapter with direct configuration (newer Turso setup)
    const adapter = new PrismaLibSQL({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    console.log('PrismaLibSQL adapter created successfully');

    const prisma = new PrismaClient({ adapter })
    console.log('PrismaClient created successfully');

    module.exports = prisma;
} catch (error) {
    console.error('Error in prismaClient setup:', error);
    console.error('Stack trace:', error.stack);
    throw error;
}
