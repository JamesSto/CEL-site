#!/bin/bash

PROJECT_DIR="/home/jimmy/personal-sites/CEL-site"
VENV_DIR="$PROJECT_DIR/backend/venv"
BACKEND_DIR="$PROJECT_DIR/backend"
SOCK_FILE="/tmp/cel.sock"
LOG_FILE="$PROJECT_DIR/gunicorn.log"

# Activate virtualenv
source "$VENV_DIR/bin/activate"

# Navigate to app directory
cd "$BACKEND_DIR"

# Run Gunicorn with logging to stdout and file
gunicorn app:app \
  --workers 3 \
  --access-logfile - \
  --access-logformat '%({X-Forwarded-For}i)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"' \
  --log-level debug \
  --bind unix:"$SOCK_FILE" 2>&1 | tee -a "$LOG_FILE"
