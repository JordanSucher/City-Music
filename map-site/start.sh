#!/bin/bash

# Generate Prisma client if schema exists
if [ -f ./prisma/schema.prisma ]; then
    echo "Generating Prisma client..."
    npx prisma generate
fi

# Start the application
echo "Starting map site server..."
node server.js