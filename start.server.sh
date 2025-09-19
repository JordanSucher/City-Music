#!/bin/bash

# Export display (puppeteer-real-browser will handle Xvfb)
export DISPLAY=:99

# Ensure no existing Xvfb processes conflict
pkill -f Xvfb || echo "No existing Xvfb processes to kill"

# Give the environment a moment to settle
sleep 2

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