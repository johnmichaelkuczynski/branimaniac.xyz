# Deploying to External Host

Your app is ready to deploy to any hosting platform that supports Node.js applications.

## Required Environment Variables

Set these on your hosting platform:

```bash
# PostgreSQL database connection string
# Get this from your hosting provider (Render, Railway, Supabase, Neon, etc.)
DATABASE_URL=postgresql://username:password@host:port/database_name

# AI API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

# Azure Speech Service (for text-to-speech)
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region

# Session secret (generate random string)
SESSION_SECRET=your_random_session_secret
```

## Database Setup (CRITICAL - DO NOT SKIP)

After creating your PostgreSQL database:

```bash
# 1. Install dependencies
npm install

# 2. Push database schema (creates all tables)
npm run db:push

# 3. Seed philosophical figures (REQUIRED - populates left sidebar)
npm run seed
```

**Without running `npm run seed`, the philosophical figures (Abraham, Aristotle, Aquinas, etc.) will NOT appear in your app.**

## Build & Deploy

```bash
# 1. Install dependencies
npm install

# 2. Setup database (push schema + seed figures)
npm run db:push
npm run seed

# 3. Build the app
npm run build

# 4. Start production server
npm start
```

## Common Hosting Platforms

**Render / Railway / Fly.io:**
- Add environment variables in dashboard
- Set build command: `npm install && npm run db:push && npm run seed && npm run build`
- Set start command: `npm start`

**Vercel / Netlify:**
- May require serverless adapter
- Set environment variables in project settings

**VPS (Ubuntu/Debian):**
- Install Node.js 20+
- Clone repo and set environment variables
- Use PM2 or systemd for process management
