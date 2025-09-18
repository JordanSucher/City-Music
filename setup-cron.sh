#!/bin/bash

# Setup script for Hetzner server cron job

echo "Setting up daily cron job for Shit Patrol..."

# Get the current directory
CURRENT_DIR=$(pwd)

echo "Current directory: $CURRENT_DIR"

# Create the cron job entry
CRON_JOB="0 2 * * * cd $CURRENT_DIR && docker compose run --rm shit-patrol >> $CURRENT_DIR/logs/cron.log 2>&1"

# Create logs directory if it doesn't exist
mkdir -p logs

# Add the cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "Cron job added successfully!"
echo "The script will run daily at 2:00 AM"
echo "Logs will be saved to: $CURRENT_DIR/logs/cron.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove this cron job later: crontab -e"
echo ""
echo "First test run (optional):"
echo "docker compose run --rm shit-patrol"
