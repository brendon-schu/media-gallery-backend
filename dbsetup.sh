#!/bin/bash

DB_NAME="gallerydb"
DB_USER="your_pg_user"
DB_PASS="your_pg_password"

echo "Creating database and table if not exists..."

sudo -u postgres psql <<EOF
DO
\$do\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
      CREATE DATABASE $DB_NAME;
   END IF;
END
\$do\$;

\c $DB_NAME

CREATE TABLE IF NOT EXISTS artworks (
    id SERIAL PRIMARY KEY,
    title TEXT,
    description TEXT,
    creator TEXT,
    category TEXT,
    tags TEXT[],
    image_path TEXT,
    date DATE
);
EOF

echo "Database setup complete."

