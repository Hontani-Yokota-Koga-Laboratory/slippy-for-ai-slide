#!/bin/bash
MODE=$1
PROJECT=$2

CONFIG_FILE="$(dirname "$0")/../.sync_config"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: .sync_config not found. Copy .sync_config.sample and edit it:"
  echo "  cp .sync_config.sample .sync_config"
  exit 1
fi
# shellcheck source=../.sync_config
source "$CONFIG_FILE"

if [ -z "$PROJECT" ]; then
  echo "Usage: npm run $MODE-img <project>"
  exit 1
fi

LOCAL_DIR="projects/$PROJECT/images/"
REMOTE_DIR="$HOST:$REMOTE_BASE/$PROJECT/"

# Ensure local directory exists
mkdir -p "$LOCAL_DIR"

# Ensure remote directory exists (via ssh)
ssh "$HOST" "mkdir -p $REMOTE_BASE/$PROJECT"

if [ "$MODE" == "push" ]; then
  echo "Pushing images for project '$PROJECT' to $HOST..."
  rsync -av "$LOCAL_DIR" "$REMOTE_DIR"
elif [ "$MODE" == "pull" ]; then
  echo "Pulling images for project '$PROJECT' from $HOST..."
  rsync -av "$REMOTE_DIR" "$LOCAL_DIR"
else
  echo "Unknown mode: $MODE"
  exit 1
fi
