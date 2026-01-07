#!/bin/bash
# Ingest all .txt files from data/ingest/ directory
# Files are ALWAYS deleted after processing (success or failure)

LOGDIR="data/logs"
mkdir -p "$LOGDIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOGFILE="$LOGDIR/ingest_$TIMESTAMP.log"

echo "Starting ingestion at $(date)"
echo "Log file: $LOGFILE"
echo ""

npx tsx server/scripts/ingest.ts ./data/ingest/ 2>&1 | tee "$LOGFILE"

echo ""
echo "Ingestion finished at $(date)"
echo "Full log saved to: $LOGFILE"
