#!/bin/bash
MODE=$1
PROJECT=$2
HOST="aldebaran"
REMOTE_BASE="~/.images_for_ai_slide"

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
