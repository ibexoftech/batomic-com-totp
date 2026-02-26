#!/usr/bin/env bash
set -euo pipefail

# Install launchd plist for auto-start on boot

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_NAME="com.batomic.totp"
PLIST_SRC="$PROJECT_DIR/$PLIST_NAME.plist"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

if [ ! -f "$PLIST_SRC" ]; then
  echo "Error: $PLIST_SRC not found"
  exit 1
fi

# Update the plist with the correct project directory
sed "s|__PROJECT_DIR__|$PROJECT_DIR|g" "$PLIST_SRC" > "$PLIST_DST"

echo "Installed plist to $PLIST_DST"
echo ""

# Unload if already loaded
launchctl unload "$PLIST_DST" 2>/dev/null || true

# Load the service
launchctl load "$PLIST_DST"

echo "Service loaded. Check status with:"
echo "  launchctl list | grep batomic"
echo ""
echo "Logs:"
echo "  tail -f $PROJECT_DIR/data/stdout.log"
echo "  tail -f $PROJECT_DIR/data/stderr.log"
