FROM ghcr.io/puppeteer/puppeteer:22.6.5

# Install xvfb for virtual display
USER root
RUN apt-get update && apt-get install -y \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm install

# Copy application code
COPY . .

# Make start script executable
RUN chmod +x /app/start.sh

# Generate Prisma client
RUN npx prisma generate

# Set ownership for puppeteer user
RUN chown -R pptruser:pptruser /app

# Switch to puppeteer user
USER pptruser

# Set environment variables for Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Expose port (optional, adjust as needed)
EXPOSE 3000

# Default command - run startup script
CMD ["/app/start.sh"]
