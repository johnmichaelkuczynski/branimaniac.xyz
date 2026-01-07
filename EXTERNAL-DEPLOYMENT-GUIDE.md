# External Deployment Guide

## The Problem You Had

The philosophical figures (Abraham, Aristotle, Aquinas, etc.) weren't showing up in your deployed app because they need to be **seeded into the database** after deployment.

## The Solution

Run this command on your external host **AFTER** pushing your database schema:

```bash
npm run seed
```

## Step-by-Step for External Deployment

### 1. Get Your Database URL

Get the PostgreSQL connection string from your hosting provider:

**Render.com:**
```
Dashboard → PostgreSQL → External Database URL
Example: postgresql://user:XXX@dpg-XXX.oregon-postgres.render.com/dbname
```

**Railway.app:**
```
PostgreSQL plugin → Variables → DATABASE_URL
Example: postgresql://postgres:XXX@containers-us-west-XXX.railway.app:5432/railway
```

**Supabase:**
```
Project Settings → Database → Connection string (choose "URI" mode)
Example: postgresql://postgres.[ref]:XXX@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Neon.tech:**
```
Dashboard → Connection Details
Example: postgresql://user:XXX@ep-XXX.us-east-2.aws.neon.tech/neondb
```

### 2. Set Environment Variables on Your Host

Set these in your hosting platform's dashboard:

```bash
DATABASE_URL=postgresql://your-actual-connection-string
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=your_region
SESSION_SECRET=random_string
```

### 3. Deploy & Setup Database

**Option A: Using the setup script (easiest)**
```bash
# Make sure DATABASE_URL is set, then run:
./setup-database.sh
npm run build
npm start
```

**Option B: Manual steps**
```bash
npm install                    # Install dependencies
npm run db:push               # Create database tables
npm run seed                  # ⚠️ CRITICAL - Seeds philosophical figures
npm run build                 # Build the app
npm start                     # Start server
```

### 4. For Continuous Deployment Platforms

**Build Command:**
```bash
npm install && npm run db:push && npm run seed && npm run build
```

**Start Command:**
```bash
npm start
```

## Common Platforms Configuration

### Render
1. New → Web Service
2. Connect your repo
3. Environment → Add environment variables
4. Build Command: `npm install && npm run db:push && npm run seed && npm run build`
5. Start Command: `npm start`

### Railway
1. New Project → Deploy from GitHub
2. Variables → Add all environment variables
3. Settings → Build Command: `npm install && npm run db:push && npm run seed && npm run build`
4. Settings → Start Command: `npm start`

### Fly.io
1. `fly launch`
2. `fly secrets set DATABASE_URL=...` (set all secrets)
3. Update `fly.toml` with build and start commands
4. `fly deploy`

## Verification

After deployment, you should see:
- Left sidebar shows 18 philosophical figures
- Main chat works with J.-M. Kuczynski
- Persona settings persist
- Clicking figures opens their conversation dialogs

## Troubleshooting

**No figures showing up?**
- You forgot to run `npm run seed`
- SSH into your server and run: `npm run seed`

**Database connection errors?**
- Check DATABASE_URL is correctly set
- Verify database exists and is accessible
- Try connecting with `psql $DATABASE_URL`

**Still not working?**
- Check build logs for errors
- Verify all environment variables are set
- Make sure Node.js version is 18+ 
