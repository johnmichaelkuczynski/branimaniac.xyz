# Ask J.-M. Kuczynski

A philosophical Q&A application powered by J.-M. Kuczynski's papers and Claude AI.

## Features

- **Living Philosophical Intelligence**: Claude uses Kuczynski's 16 papers as constitutional foundation
- **Adaptive Responses**: Adjusts to user's intelligence level, emotional tone, and formality
- **Talk with Philosophers**: Conversations with Abraham, Aristotle, Aquinas, Hegel, and 14 other figures
- **Persona Settings**: Customize voice type, intelligence level, emotional tone, formality
- **Real-time Streaming**: Word-by-word AI responses
- **Text-to-Speech**: Azure-powered narration

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Setup database
npm run db:push
npm run seed

# Start development server
npm run dev
```

Visit `http://localhost:5000`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Critical:** You MUST run `npm run seed` after database setup to populate the philosophical figures.

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Required for AI responses
- `OPENAI_API_KEY` - Optional alternative AI provider
- `AZURE_SPEECH_KEY` - Required for text-to-speech
- `AZURE_SPEECH_REGION` - Azure region for speech service
- `SESSION_SECRET` - Random string for session encryption

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Anthropic Claude Sonnet 4.5
- **TTS**: Azure Speech Service
