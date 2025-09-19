#!/bin/bash

# Start Xvfb
Xvfb :99 -screen 0 1024x768x24 -ac +extension GLX +render -noreset &
export DISPLAY=:99

# Wait for Xvfb to start
sleep 2

# Run the application with timeout (10 minutes max)
timeout 600 node manual.js

# Get exit code
exit_code=$?

# Kill Xvfb
pkill Xvfb

# Exit with the node process exit code
exit $exit_code