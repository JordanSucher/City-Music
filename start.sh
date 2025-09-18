#!/bin/bash

# Start Xvfb
Xvfb :99 -screen 0 1024x768x24 -ac +extension GLX +render -noreset &
export DISPLAY=:99

# Wait for Xvfb to start
sleep 2

# Run the application
node manual.js