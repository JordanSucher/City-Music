const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql')
const { createClient } = require('@libsql/client/web');

// Create an instance of PrismaClient
const libsql = createClient({
    url: `${process.env.TURSO_DATABASE_URL}`,
    authToken: `${process.env.TURSO_AUTH_TOKEN}`,
  })

const adapter = new PrismaLibSQL(libsql)

let prisma;

if (!prisma) {
    prisma = new PrismaClient({ adapter })
}

module.exports = prisma;
