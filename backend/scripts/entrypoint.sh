#!/bin/sh
echo "Waiting for database..."
# Use netcat (nc) to wait for port 5432
while ! nc -z database 5432; do
  sleep 1
done
echo "Database is ready!"

echo "Running Migrations & Seeding..."
node scripts/init-db.js

echo "Starting Server..."
npm start