#!/bin/bash

# Kill any existing Chrome processes
pkill -f chrome || echo "No existing Chrome processes to kill"
pkill -f Chrome || echo "No existing Chrome processes to kill"

# Clean up chrome directories
rm -rf /tmp/.X99-lock /tmp/chrome-user-data/* /tmp/chrome-data/* 2>/dev/null || echo "Chrome directories cleaned"

# Start Xvfb with proper configuration
Xvfb :99 -screen 0 1366x768x24 -ac +extension GLX +render -noreset -dpi 96 &
export DISPLAY=:99

# Wait for Xvfb to start properly
sleep 5

# Verify Xvfb is running
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "ERROR: Xvfb failed to start"
    exit 1
fi

echo "Xvfb started successfully on display $DISPLAY"

# Test Chrome startup with debugging
echo "Testing Chrome startup..."
timeout 10 google-chrome-stable --version || {
    echo "ERROR: Chrome failed to start"
    exit 1
}

# Install any missing system dependencies for server environment
# These are sometimes needed for puppeteer-real-browser on servers
if command -v apt-get >/dev/null 2>&1; then
    apt-get update && apt-get install -y procps || echo "Could not install procps, continuing..."
fi

echo "Starting server-optimized application..."
echo "Display: $DISPLAY"
echo "Node version: $(node --version)"
echo "Chrome/Chromium path: $PUPPETEER_EXECUTABLE_PATH"

# Debug Chrome connection first
echo "Running Chrome debug test..."
node debug-chrome.js

echo "Starting main application..."
# Run the server-optimized application with timeout (15 minutes max for slower server)
timeout 900 node manual.server.js

# Get exit code
exit_code=$?

# Cleanup
pkill -f Xvfb || echo "Xvfb already stopped"
pkill -f chrome || echo "No chrome processes to kill"
pkill -f Chrome || echo "No Chrome processes to kill"

echo "Application finished with exit code: $exit_code"

# Exit with the node process exit code
exit $exit_code