# 🌐 Bright Data Residential Proxy Setup Guide

## 1. Create Bright Data Account

1. Go to [brightdata.com](https://brightdata.com)
2. Sign up for an account
3. Navigate to **Proxy & Scraping Infrastructure** → **Residential proxies**
4. Create a new zone/endpoint

## 2. Get Your Credentials

From your Bright Data dashboard, you'll need:

- **Host**: Usually looks like `brd-customer-hl_xxxxx-zone-residential`
- **Port**: Typically `22225` for residential
- **Username**: Same as host with session identifier
- **Password**: Your account password

## 3. Set Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Bright Data Residential Proxy Config
BRIGHTDATA_HOST=brd-customer-hl_xxxxx-zone-residential
BRIGHTDATA_PORT=22225
BRIGHTDATA_USER=brd-customer-hl_xxxxx-zone-residential
BRIGHTDATA_PASS=your_password_here
```

## 4. Test the Integration

Run the Docker container with proxy integration:

```bash
docker compose -f docker-compose.server.yml up --build
```

## 5. Expected Output

**Success indicators:**
```
🏠 Launching Bright Data Residential Proxy System...
🌐 Proxy: brd-customer-hl_xxxxx-zone-residential:22225
🧪 Testing proxy connection...
🌐 Proxy IP confirmed: 123.45.67.89
🎯 Navigating to target via residential proxy...
🎉 RESIDENTIAL PROXY SUCCESS! Cloudflare bypassed!
📊 API response: Got 150 shows
```

**What the proxy provides:**
- ✅ Real residential IP addresses (not datacenter)
- ✅ Geographic distribution across US locations
- ✅ High success rate against Cloudflare challenges
- ✅ Session rotation for different requests
- ✅ Lower detection rates vs datacenter proxies

## 6. Troubleshooting

**If you see connection errors:**
- Verify credentials are correct in .env file
- Check Bright Data dashboard for account status
- Ensure sufficient proxy traffic allowance

**If still getting Cloudflare blocks:**
- Try different session identifiers in username
- Check IP location matches timezone settings
- Consider upgrading to premium residential package

The residential proxy integration should significantly improve bypass success rates from ~40% to 70-85% on server environments.