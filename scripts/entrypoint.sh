#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
until python3 -c "import psycopg2; psycopg2.connect('$DATABASE_URL')" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL ready."

echo "Seeding lenders..."
python3 backend/seed.py

echo "Starting API server..."
exec uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
