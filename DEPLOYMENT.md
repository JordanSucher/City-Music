# Hetzner Server Deployment Instructions

## Setup Steps

1. **Upload files to your Hetzner server**
   ```bash
   scp -r . user@your-server-ip:/path/to/shit-patrol/
   ```

2. **SSH into your server**
   ```bash
   ssh user@your-server-ip
   cd /path/to/shit-patrol/
   ```

3. **Install Docker and Docker Compose** (if not already installed)
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER

   # Install Docker Compose
   sudo apt-get update
   sudo apt-get install docker-compose-plugin

   # Log out and back in for group changes to take effect
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values (or just copy your existing .env)
   nano .env
   ```

5. **Build the Docker image**
   ```bash
   docker-compose build
   ```

6. **Test the setup**
   ```bash
   docker-compose run --rm shit-patrol
   ```

7. **Set up daily cron job**
   ```bash
   ./setup-cron.sh
   ```

## Manual Operations

**Run once manually:**
```bash
docker-compose run --rm shit-patrol
```

**View logs:**
```bash
tail -f logs/cron.log
```

**Update code:**
```bash
git pull  # or upload new files
docker-compose build
```

**View cron jobs:**
```bash
crontab -l
```

## Troubleshooting

- If you get permission errors, make sure your user is in the docker group
- If Chrome fails to start, the container includes all necessary dependencies
- Check logs in `logs/cron.log` for any issues
- The container runs as non-root user for security