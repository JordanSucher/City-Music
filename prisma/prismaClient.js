require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL);
console.log('TURSO_AUTH_TOKEN exists:', !!process.env.TURSO_AUTH_TOKEN);

try {
    // Create the libsql client first
    const libsqlClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Pass the client to the adapter
    const adapter = new PrismaLibSQL(libsqlClient);

    const prisma = new PrismaClient({ adapter })

    module.exports = prisma;
} catch (error) {
    console.error('Error in prismaClient setup:', error);
    throw error;
}
