#!/bin/bash

# Start Xvfb
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
export DISPLAY=:99

# Wait for Xvfb to start
sleep 3

# Install any missing system dependencies for server environment
# These are sometimes needed for puppeteer-real-browser on servers
if command -v apt-get >/dev/null 2>&1; then
    apt-get update && apt-get install -y procps || echo "Could not install procps, continuing..."
fi

echo "Starting server-optimized application..."
echo "Display: $DISPLAY"
echo "Node version: $(node --version)"
echo "Chrome/Chromium path: $PUPPETEER_EXECUTABLE_PATH"

# Run the server-optimized application with timeout (15 minutes max for slower server)
timeout 900 node manual.server.js

# Get exit code
exit_code=$?

# Kill Xvfb and any remaining processes
pkill -f Xvfb || echo "Xvfb already stopped"
pkill -f chrome || echo "No chrome processes to kill"
pkill -f chromium || echo "No chromium processes to kill"

echo "Application finished with exit code: $exit_code"

# Exit with the node process exit code
exit $exit_code