#!/bin/bash

# Deploy Script - Able Pro UI Update
# Usage: ./deploy.sh

echo "🚀 Starting deployment to VPS..."

# VPS Details
VPS_IP="145.79.8.90"
VPS_USER="root"
PROJECT_PATH="/opt/apps/manajemen-data-pegawai"

echo "📡 Connecting to VPS: $VPS_IP"

ssh $VPS_USER@$VPS_IP << 'ENDSSH'
    echo "📂 Navigating to project directory..."
    cd /opt/apps/manajemen-data-pegawai

    echo "📥 Pulling latest changes..."
    git pull origin master

    echo "🛑 Stopping containers..."
    docker-compose down

    echo "🔨 Building and starting containers..."
    docker-compose up -d --build

    echo "⏳ Waiting for containers to start..."
    sleep 10

    echo "📊 Container status:"
    docker-compose ps

    echo "✅ Deployment complete!"
    echo "🌐 Access the app at: http://145.79.8.90"
ENDSSH

echo "✨ Done!"
