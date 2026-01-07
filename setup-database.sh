#!/bin/bash

# Database Setup Script for External Deployment
# Run this after setting DATABASE_URL environment variable

echo "🔧 Setting up database for Ask J.-M. Kuczynski..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    echo ""
    echo "Please set your PostgreSQL connection string first:"
    echo "export DATABASE_URL='postgresql://username:password@host:port/database'"
    echo ""
    exit 1
fi

echo "✓ DATABASE_URL is set"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Push database schema
echo "🗄️  Creating database tables..."
npm run db:push
echo ""

# Seed philosophical figures
echo "👥 Seeding philosophical figures..."
npm run seed
echo ""

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. npm run build    # Build the app"
echo "  2. npm start        # Start production server"
echo ""
