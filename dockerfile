FROM node:18-bullseye-slim

# Install Chrome, dependencies and xvfb
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    xvfb \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    --no-install-recommends \
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

# Create non-root user with proper permissions
RUN groupadd -r appuser && useradd -r -g appuser -G audio,video appuser \
    && mkdir -p /home/appuser/Downloads \
               /tmp/chrome-user-data \
               /tmp/chrome-data \
               /tmp/.chromium \
               /tmp/chrome-crashpad \
    && chown -R appuser:appuser /home/appuser \
    && chown -R appuser:appuser /app \
    && chown -R appuser:appuser /tmp/chrome-user-data \
    && chown -R appuser:appuser /tmp/chrome-data \
    && chown -R appuser:appuser /tmp/.chromium \
    && chown -R appuser:appuser /tmp/chrome-crashpad \
    && chmod 755 /tmp/chrome-user-data /tmp/chrome-data /tmp/.chromium /tmp/chrome-crashpad

# Switch to non-root user
USER appuser

# Set environment variables for Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV XDG_CONFIG_HOME=/tmp/.chromium
ENV XDG_CACHE_HOME=/tmp/.chromium
ENV CHROME_BIN=/usr/bin/google-chrome-stable

# Expose port (optional, adjust as needed)
EXPOSE 3000

# Default command - run startup script
CMD ["/app/start.sh"]
