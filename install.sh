#!/bin/bash
echo "Welcome to the Media Gallery Setup!"

# Step 1: Ask for project URL
read -p "Enter your project URL (e.g., https://yourdomain.com/api): " PROJECT_URL
read -p "Enter upload folder path (e.g., /var/www/uploads): " UPLOADS_PATH

# Step 2: Create .env file
cat <<EOF > .env
API_BASE_URL=$PROJECT_URL
UPLOADS_PATH=$UPLOADS_PATH
DATABASE_URL=postgres://your_pg_user:your_pg_password@localhost:5432/gallerydb
EOF

echo "✅ .env file created!"

# Step 3: Create database & tables
echo "Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE DATABASE gallerydb;
CREATE USER gallery_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE gallerydb TO gallery_user;
\c gallerydb
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

echo "✅ Database setup complete!"

# Step 4: Install dependencies
echo "Installing backend dependencies..."
npm install

# Step 5: Start the server
echo "Starting backend with PM2..."
sudo pm2 start app.js --name gallery-backend
sudo pm2 save
sudo pm2 startup

echo "✅ Setup complete! Visit your app at $PROJECT_URL"

