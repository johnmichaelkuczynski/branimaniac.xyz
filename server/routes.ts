import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import session from "express-session";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { buildSystemPrompt } from "./prompt-builder";
import { findRelevantVerse } from "./bible-verses";
import { findRelevantChunks, searchPhilosophicalChunks, searchTextChunks, normalizeAuthorName, type StructuredChunk } from "./vector-search";
import {
  insertPersonaSettingsSchema,
  insertGoalSchema,
  positions,
  quotes,
  argumentsTable,
  insertArgumentSchema,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { verifyZhiAuth } from "./internal-auth";
import multer from "multer";
import * as pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import { authorAssetsCache } from "./author-assets-cache";
import { unifiedSearch, formatCitations } from "./unified-search";
import { auditedCorpusSearch, generateAuditReport, type TraceEvent, type AuditResult } from "./audit-search";

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// NOTE: Papers are now stored in vector database
// RAG system retrieves only relevant chunks (see vector-search.ts)

// Helper function to verify quotes against source papers
function verifyQuotes(text: string, sourcePapers: string): { verified: number; total: number; fabricated: string[] } {
  // Extract ALL quotes (removed minimum length requirement per architect feedback)
  const quoteMatches = text.match(/"([^"]+)"/g) || [];
  const quotes = quoteMatches.map(q => q.slice(1, -1)); // Remove quote marks
  
  const fabricatedQuotes: string[] = [];
  let verifiedCount = 0;
  
  // Comprehensive normalization function
  function normalize(str: string): string {
    return str
      .replace(/\s+/g, ' ')              // Normalize whitespace
      .replace(/[—–−]/g, '-')            // Em-dash, en-dash, minus → hyphen
      .replace(/\s*-\s*/g, ' - ')        // Normalize spaces around hyphens
      .replace(/[""]/g, '"')             // Smart quotes → standard quotes
      .replace(/['']/g, "'")             // Smart apostrophes → standard
      .replace(/[…]/g, '...')            // Ellipsis → three dots
      .replace(/[•·]/g, '*')             // Bullets → asterisk
      .replace(/\.{2,}/g, '')            // Remove ellipses (per architect: breaks matching)
      .replace(/\s+/g, ' ')              // Normalize whitespace again (after hyphen fix)
      .trim()
      .toLowerCase();
  }
  
  const normalizedPapers = normalize(sourcePapers);
  
  for (const quote of quotes) {
    // Skip very short quotes (< 10 chars) - likely not substantive philosophical quotes
    if (quote.trim().length < 10) continue;
    
    const normalizedQuote = normalize(quote);
    
    // Check for exact match
    if (normalizedPapers.includes(normalizedQuote)) {
      verifiedCount++;
      continue;
    }
    
    // Check for 70% match (in case of minor variations)
    const words = normalizedQuote.split(' ');
    if (words.length >= 3) { // Lowered from 5 to 3 for shorter quotes
      const chunkSize = Math.max(3, Math.floor(words.length * 0.7)); // Lowered from 5 to 3
      let found = false;
      
      for (let i = 0; i <= words.length - chunkSize; i++) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (normalizedPapers.includes(chunk)) {
          found = true;
          verifiedCount++;
          break;
        }
      }
      
      if (!found) {
        fabricatedQuotes.push(quote.substring(0, 100));
      }
    } else {
      // Very short quotes (< 3 words) - must match exactly
      fabricatedQuotes.push(quote.substring(0, 100));
    }
  }
  
  return {
    verified: verifiedCount,
    total: quotes.length,
    fabricated: fabricatedQuotes,
  };
}

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

// Model configuration for fallback ordering
const MODEL_CONFIG: Record<string, { provider: string; model: string }> = {
  zhi1: { provider: "openai", model: "gpt-4o" },
  zhi2: { provider: "anthropic", model: "claude-sonnet-4-5-20250929" },
  zhi3: { provider: "deepseek", model: "deepseek-chat" },
  zhi4: { provider: "perplexity", model: "llama-3.1-sonar-large-128k-online" },
  zhi5: { provider: "xai", model: "grok-3" },
};

// Fallback order: if one fails, try next in sequence
const FALLBACK_ORDER = ["zhi5", "zhi1", "zhi2", "zhi3", "zhi4"];

// Get fallback models starting from a given model
function getFallbackModels(startModel: string): string[] {
  const startIndex = FALLBACK_ORDER.indexOf(startModel);
  if (startIndex === -1) return FALLBACK_ORDER;
  
  // Return models starting from startModel, then wrap around
  const fallbacks = [
    ...FALLBACK_ORDER.slice(startIndex),
    ...FALLBACK_ORDER.slice(0, startIndex)
  ];
  return fallbacks;
}

// Check if a provider's API key is available
function isProviderAvailable(provider: string): boolean {
  switch (provider) {
    case "openai": return !!process.env.OPENAI_API_KEY;
    case "anthropic": return !!process.env.ANTHROPIC_API_KEY;
    case "deepseek": return !!process.env.DEEPSEEK_API_KEY;
    case "perplexity": return !!process.env.PERPLEXITY_API_KEY;
    case "xai": return !!process.env.XAI_API_KEY;
    default: return false;
  }
}

// Get OpenAI-compatible client for a provider
function getOpenAIClient(provider: string): OpenAI | null {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY ? new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: "https://api.deepseek.com/v1",
      }) : null;
    case "perplexity":
      return process.env.PERPLEXITY_API_KEY ? new OpenAI({
        apiKey: process.env.PERPLEXITY_API_KEY,
        baseURL: "https://api.perplexity.ai",
      }) : null;
    case "xai":
      return process.env.XAI_API_KEY ? new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: "https://api.x.ai/v1",
      }) : null;
    default:
      return null;
  }
}

// Helper: Thinker name lookup - ONLY the 54 approved thinkers
const THINKER_NAMES: Record<string, string> = {
  "adam smith": "Adam Smith",
  "smith": "Adam Smith",
  "aesop": "Aesop",
  "alexis de tocqueville": "Alexis de Tocqueville",
  "tocqueville": "Alexis de Tocqueville",
  "alfred adler": "Alfred Adler",
  "adler": "Alfred Adler",
  "james allen": "James Allen",
  "allen": "James Allen",
  "andrea dworkin": "Andrea Dworkin",
  "dworkin": "Andrea Dworkin",
  "aristotle": "Aristotle",
  "arthur schopenhauer": "Arthur Schopenhauer",
  "schopenhauer": "Arthur Schopenhauer",
  "baruch spinoza": "Baruch Spinoza",
  "spinoza": "Baruch Spinoza",
  "bertrand russell": "Bertrand Russell",
  "russell": "Bertrand Russell",
  "carl jung": "Carl Jung",
  "jung": "Carl Jung",
  "charles darwin": "Charles Darwin",
  "darwin": "Charles Darwin",
  "charles sanders peirce": "Charles Sanders Peirce",
  "peirce": "Charles Sanders Peirce",
  "confucius": "Confucius",
  "david hume": "David Hume",
  "hume": "David Hume",
  "edward gibbon": "Edward Gibbon",
  "gibbon": "Edward Gibbon",
  "emma goldman": "Emma Goldman",
  "goldman": "Emma Goldman",
  "francis bacon": "Francis Bacon",
  "bacon": "Francis Bacon",
  "francois de la rochefoucauld": "François de La Rochefoucauld",
  "rochefoucauld": "François de La Rochefoucauld",
  "friedrich engels": "Friedrich Engels",
  "engels": "Friedrich Engels",
  "friedrich nietzsche": "Friedrich Nietzsche",
  "nietzsche": "Friedrich Nietzsche",
  "g.w.f. hegel": "G.W.F. Hegel",
  "hegel": "G.W.F. Hegel",
  "galileo": "Galileo",
  "galileo galilei": "Galileo",
  "george berkeley": "George Berkeley",
  "berkeley": "George Berkeley",
  "gottfried wilhelm leibniz": "Gottfried Wilhelm Leibniz",
  "leibniz": "Gottfried Wilhelm Leibniz",
  "gustave le bon": "Gustave Le Bon",
  "lebon": "Gustave Le Bon",
  "henri bergson": "Henri Bergson",
  "bergson": "Henri Bergson",
  "henri poincare": "Henri Poincaré",
  "poincare": "Henri Poincaré",
  "herbert spencer": "Herbert Spencer",
  "spencer": "Herbert Spencer",
  "immanuel kant": "Immanuel Kant",
  "kant": "Immanuel Kant",
  "isaac newton": "Isaac Newton",
  "newton": "Isaac Newton",
  "j.-m. kuczynski": "J.-M. Kuczynski",
  "kuczynski": "J.-M. Kuczynski",
  "jean-jacques rousseau": "Jean-Jacques Rousseau",
  "rousseau": "Jean-Jacques Rousseau",
  "jean-paul sartre": "Jean-Paul Sartre",
  "sartre": "Jean-Paul Sartre",
  "john dewey": "John Dewey",
  "dewey": "John Dewey",
  "john locke": "John Locke",
  "locke": "John Locke",
  "john stuart mill": "John Stuart Mill",
  "mill": "John Stuart Mill",
  "karl popper": "Karl Popper",
  "popper": "Karl Popper",
  "ludwig von mises": "Ludwig von Mises",
  "mises": "Ludwig von Mises",
  "martin luther": "Martin Luther",
  "luther": "Martin Luther",
  "moses maimonides": "Moses Maimonides",
  "maimonides": "Moses Maimonides",
  "niccolo machiavelli": "Niccolò Machiavelli",
  "machiavelli": "Niccolò Machiavelli",
  "orison swett marden": "Orison Swett Marden",
  "marden": "Orison Swett Marden",
  "plato": "Plato",
  "rene descartes": "René Descartes",
  "descartes": "René Descartes",
  "sigmund freud": "Sigmund Freud",
  "freud": "Sigmund Freud",
  "thomas hobbes": "Thomas Hobbes",
  "hobbes": "Thomas Hobbes",
  "thorstein veblen": "Thorstein Veblen",
  "veblen": "Thorstein Veblen",
  "vladimir lenin": "Vladimir Lenin",
  "lenin": "Vladimir Lenin",
  "voltaire": "Voltaire",
  "wilhelm reich": "Wilhelm Reich",
  "reich": "Wilhelm Reich",
  "wilhelm stekel": "Wilhelm Stekel",
  "stekel": "Wilhelm Stekel",
  "william james": "William James",
  "james": "William James",
  "william whewell": "William Whewell",
  "whewell": "William Whewell",
  "hermann weyl": "Hermann Weyl",
  "weyl": "Hermann Weyl",
  "martin gardner": "Martin Gardner",
  "gardner": "Martin Gardner",
};

function getThinkerInfo(thinkerId: string): { id: string; name: string } | null {
  const name = THINKER_NAMES[thinkerId.toLowerCase()];
  if (name) {
    return { id: thinkerId, name };
  }
  return null;
}

// Helper to get or create session ID - AUTO-LOGIN AS JMK
// This ensures JMK is always logged in for both development and production
async function getSessionId(req: any): Promise<string> {
  // Always auto-login as JMK
  const DEFAULT_USERNAME = "jmk";
  
  if (!req.session.userId || !req.session.username) {
    // Get or create JMK user
    const jmkUser = await storage.createOrGetUserByUsername(DEFAULT_USERNAME);
    req.session.userId = jmkUser.id;
    req.session.username = DEFAULT_USERNAME;
  }
  return req.session.userId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate SESSION_SECRET is set
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required for secure session management");
  }

  // Setup sessions (but not auth)
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProduction = process.env.NODE_ENV === 'production';
  
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: isProduction, // Require HTTPS in production
      maxAge: sessionTtl,
      sameSite: 'lax', // CSRF protection
    },
  }));

  // ============ USERNAME-BASED LOGIN (NO PASSWORD) ============
  
  // Login with username - creates user if not exists
  // NOTE: This is a simple username-only login (no password) as requested by the user.
  // It's suitable for casual use but not for sensitive data.
  app.post("/api/login", async (req: any, res) => {
    try {
      const { username } = req.body;
      
      if (!username || typeof username !== "string" || username.trim().length < 2) {
        return res.status(400).json({ error: "Username must be at least 2 characters" });
      }
      
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (cleanUsername.length < 2) {
        return res.status(400).json({ error: "Username can only contain letters, numbers, underscores, and dashes" });
      }
      
      // Get the current guest user ID before login
      const guestUserId = req.session.userId;
      
      // Get or create the authenticated user
      const user = await storage.createOrGetUserByUsername(cleanUsername);
      
      // Migrate guest data to authenticated user (preserves current conversation)
      if (guestUserId && guestUserId !== user.id && guestUserId.startsWith('guest_')) {
        await storage.migrateUserData(guestUserId, user.id);
      }
      
      // Update session with authenticated user
      req.session.userId = user.id;
      req.session.username = cleanUsername;
      
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          username: cleanUsername,
          firstName: user.firstName 
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Get current user - AUTO-LOGIN AS JMK
  app.get("/api/user", async (req: any, res) => {
    try {
      // Auto-login as JMK if no session
      const DEFAULT_USERNAME = "jmk";
      
      if (!req.session.userId || !req.session.username) {
        // Auto-create/get JMK user and set session
        const jmkUser = await storage.createOrGetUserByUsername(DEFAULT_USERNAME);
        req.session.userId = jmkUser.id;
        req.session.username = DEFAULT_USERNAME;
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        // Fallback: create JMK user if somehow missing
        const jmkUser = await storage.createOrGetUserByUsername(DEFAULT_USERNAME);
        req.session.userId = jmkUser.id;
        req.session.username = DEFAULT_USERNAME;
        
        return res.json({ 
          user: { 
            id: jmkUser.id, 
            username: DEFAULT_USERNAME,
            firstName: jmkUser.firstName 
          } 
        });
      }
      
      res.json({ 
        user: { 
          id: user.id, 
          username: req.session.username,
          firstName: user.firstName 
        } 
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Logout - DISABLED: JMK is always logged in
  // This endpoint no longer destroys the session; it keeps JMK logged in
  app.post("/api/logout", async (req: any, res) => {
    try {
      // Don't actually logout - keep JMK logged in
      const DEFAULT_USERNAME = "jmk";
      const jmkUser = await storage.createOrGetUserByUsername(DEFAULT_USERNAME);
      req.session.userId = jmkUser.id;
      req.session.username = DEFAULT_USERNAME;
      
      res.json({ success: true, message: "JMK session maintained" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  // Get all figures (thinkers) - ONLY returns the 54 approved thinkers
  app.get("/api/figures", async (_req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT LOWER(thinker) as thinker FROM (
          SELECT thinker FROM positions
          UNION SELECT thinker FROM quotes
          UNION SELECT thinker FROM arguments
          UNION SELECT thinker FROM chunks
        ) AS all_thinkers
        ORDER BY thinker
      `);
      
      const figures = (result.rows as any[])
        .filter((row) => {
          const thinkerId = row.thinker?.toLowerCase();
          return THINKER_NAMES[thinkerId] !== undefined;
        })
        .map((row) => {
          const thinkerId = row.thinker;
          const displayName = THINKER_NAMES[thinkerId.toLowerCase()];
          return {
            id: thinkerId,
            name: displayName,
            title: "Philosopher",
            icon: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=128`,
          };
        });
      
      res.json(figures);
    } catch (error) {
      console.error("Error fetching figures:", error);
      res.status(500).json({ error: "Failed to fetch figures" });
    }
  });

  // Figure-specific chat endpoint - streams chat with a specific philosopher
  app.post("/api/figures/:figureId/chat", async (req: any, res) => {
    req.body.figureId = req.params.figureId;
    req.url = "/api/chat/stream";
    app._router.handle(req, res, () => {});
  });

  // Get messages for a specific figure (maps to /api/messages with figureId filter)
  app.get("/api/figures/:figureId/messages", async (req: any, res) => {
    try {
      const conversationId = req.session.conversationId;
      if (!conversationId) {
        return res.json([]);
      }
      const messages = await storage.getMessages(conversationId);
      const figureMessages = messages.filter((m: any) => 
        m.figureId === req.params.figureId || m.role === 'user'
      );
      res.json(figureMessages);
    } catch (error) {
      console.error("Error fetching figure messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Delete messages for a specific figure
  app.delete("/api/figures/:figureId/messages", async (req: any, res) => {
    try {
      const conversationId = req.session.conversationId;
      if (conversationId) {
        await storage.deleteAllMessages(conversationId);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting figure messages:", error);
      res.status(500).json({ error: "Failed to delete messages" });
    }
  });

  // Get chat history for logged-in user
  app.get("/api/chat-history", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.username) {
        return res.json({ conversations: [] });
      }
      
      const allConversations = await storage.getAllConversations(req.session.userId);
      
      // Get message counts and first message preview for each conversation
      const conversationsWithDetails = await Promise.all(
        allConversations.map(async (conv) => {
          const messages = await storage.getMessages(conv.id);
          const userMessages = messages.filter(m => m.role === 'user');
          const firstUserMessage = userMessages[0];
          
          return {
            id: conv.id,
            title: conv.title || (firstUserMessage?.content?.substring(0, 50) + '...') || 'Untitled',
            messageCount: messages.length,
            preview: firstUserMessage?.content?.substring(0, 100) || '',
            createdAt: conv.createdAt,
          };
        })
      );
      
      res.json({ conversations: conversationsWithDetails.filter(c => c.messageCount > 0) });
    } catch (error) {
      console.error("Get chat history error:", error);
      res.status(500).json({ error: "Failed to get chat history" });
    }
  });

  // Load a specific chat
  app.get("/api/chat/:id", async (req: any, res) => {
    try {
      const conversationId = req.params.id;
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      // Verify ownership if logged in
      if (req.session.userId && conversation.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const messages = await storage.getMessages(conversationId);
      
      res.json({ 
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
        },
        messages 
      });
    } catch (error) {
      console.error("Get chat error:", error);
      res.status(500).json({ error: "Failed to get chat" });
    }
  });

  // Download chat as text file
  app.get("/api/chat/:id/download", async (req: any, res) => {
    try {
      const conversationId = req.params.id;
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      // Verify ownership if logged in
      if (req.session.userId && conversation.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const messages = await storage.getMessages(conversationId);
      
      // Format as readable text
      let content = `# ${conversation.title || 'Philosophical Conversation'}\n`;
      content += `# Date: ${new Date(conversation.createdAt).toLocaleString()}\n`;
      content += `${'='.repeat(60)}\n\n`;
      
      for (const msg of messages) {
        const role = msg.role === 'user' ? 'YOU' : 'PHILOSOPHER';
        content += `[${role}]\n${msg.content}\n\n${'─'.repeat(40)}\n\n`;
      }
      
      const filename = `chat-${conversationId.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.txt`;
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      console.error("Download chat error:", error);
      res.status(500).json({ error: "Failed to download chat" });
    }
  });

  // Start new chat session
  app.post("/api/chat/new", async (req: any, res) => {
    try {
      const sessionId = await getSessionId(req);
      const conversation = await storage.createConversation(sessionId, {
        title: "New Conversation",
      });
      res.json({ conversation });
    } catch (error) {
      console.error("Create new chat error:", error);
      res.status(500).json({ error: "Failed to create new chat" });
    }
  });

  // ============ END LOGIN/CHAT HISTORY ROUTES ============

  // Get persona settings
  app.get("/api/persona-settings", async (req: any, res) => {
    try {
      const sessionId = await getSessionId(req);
      let settings = await storage.getPersonaSettings(sessionId);
      
      if (!settings) {
        settings = await storage.upsertPersonaSettings(sessionId, {
          responseLength: 750,
          writePaper: false,
          quoteFrequency: 0,
          selectedModel: "zhi5",
          enhancedMode: true,
          dialogueMode: true,
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error getting persona settings:", error);
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  // Update persona settings
  app.post("/api/persona-settings", async (req: any, res) => {
    try {
      const sessionId = await getSessionId(req);
      console.log(`[PERSONA SETTINGS] Raw request body:`, JSON.stringify(req.body));
      const validatedSettings = insertPersonaSettingsSchema.parse(req.body);
      console.log(`[PERSONA SETTINGS] Validated settings:`, JSON.stringify(validatedSettings));
      const updated = await storage.upsertPersonaSettings(
        sessionId,
        validatedSettings
      );
      console.log(`[PERSONA SETTINGS] Saved settings:`, JSON.stringify(updated));
      res.json(updated);
    } catch (error) {
      console.error("Error updating persona settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Get messages
  app.get("/api/messages", async (req: any, res) => {
    try {
      const sessionId = await getSessionId(req);
      let conversation = await storage.getCurrentConversation(sessionId);
      
      if (!conversation) {
        conversation = await storage.createConversation(sessionId, {
          title: "Spiritual Guidance",
        });
      }
      
      const messages = await storage.getMessages(conversation.id);
      res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Delete a message
  app.delete("/api/messages/:id", async (req: any, res) => {
    try {
      const sessionId = await getSessionId(req);
      const messageId = req.params.id;
      
      if (!messageId || typeof messageId !== "string") {
        return res.status(400).json({ error: "Invalid message ID" });
      }
      
      // Get current user's conversation
      const conversation = await storage.getCurrentConversation(sessionId);
      if (!conversation) {
        return res.status(404).json({ error: "No conversation found" });
      }
      
      // Verify the message belongs to this conversation (ownership check)
      const messages = await storage.getMessages(conversation.id);
      const messageToDelete = messages.find(m => m.id === messageId);
      
      if (!messageToDelete) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      // Only delete if ownership is verified
      await storage.deleteMessage(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Streaming chat endpoint
  app.post("/api/chat/stream", async (req: any, res) => {
    try {
      const sessionId = await getSessionId(req);
      const { message, documentText, figureId: bodyFigureId } = req.body;

      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      // CRITICAL: Extract figureId - defaults to kuczynski if not provided
      const figureId = (bodyFigureId || "kuczynski").toLowerCase();
      
      // Map figureId to display name
      const thinkerDisplayNames: Record<string, string> = {
        "kuczynski": "J.-M. Kuczynski",
        "freud": "Sigmund Freud",
        "nietzsche": "Friedrich Nietzsche",
        "marx": "Karl Marx",
        "berkeley": "George Berkeley",
        "aristotle": "Aristotle",
        "plato": "Plato",
        "kant": "Immanuel Kant",
        "hegel": "G.W.F. Hegel",
        "descartes": "René Descartes",
        "spinoza": "Baruch Spinoza",
        "hume": "David Hume",
        "locke": "John Locke",
        "darwin": "Charles Darwin",
        "newton": "Isaac Newton",
        "rousseau": "Jean-Jacques Rousseau",
        "voltaire": "Voltaire",
        "tocqueville": "Alexis de Tocqueville",
        "veblen": "Thorstein Veblen",
        "dewey": "John Dewey",
        "engels": "Friedrich Engels",
        "confucius": "Confucius",
        "machiavelli": "Niccolò Machiavelli",
      };
      const thinkerName = thinkerDisplayNames[figureId] || figureId;
      
      console.log(`[CHAT] Starting chat with figureId: ${figureId}, thinkerName: ${thinkerName}`);

      // Get conversation
      let conversation = await storage.getCurrentConversation(sessionId);
      if (!conversation) {
        conversation = await storage.createConversation(sessionId, {
          title: `Conversation with ${thinkerName}`,
        });
      }

      // Get ALL previous messages BEFORE saving new one (to build conversation history)
      const previousMessages = await storage.getMessages(conversation.id);

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message,
      });

      // Get persona settings (create with defaults if missing)
      let personaSettings = await storage.getPersonaSettings(sessionId);
      if (!personaSettings) {
        personaSettings = await storage.upsertPersonaSettings(sessionId, {
          responseLength: 750,
          writePaper: false,
          quoteFrequency: 0,
          selectedModel: "zhi5",
          enhancedMode: true,
          dialogueMode: true,
        });
      }
      
      // Helper to convert ugly database filenames to readable titles
      const formatTitle = (dbName: string): string => {
        return dbName
          .replace(/^CORPUS_ANALYSIS_/, '')
          .replace(/_/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/\s+\d{10,}$/g, '')
          .replace(/\s+\d+$/g, '')
          .trim();
      };

      // ============ UNIVERSAL RAG RETRIEVAL FOR ANY PHILOSOPHER ============
      // Query all three sources using the figureId (lowercase) to match database format
      
      const queryWords = message.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      // 1. Search CHUNKS table (main text corpus - 10K+ entries per thinker)
      const textChunks = await searchTextChunks(figureId, message, 8);
      
      // 2. Search POSITIONS table (verified philosophical positions)
      // Use wildcards ('%figureId%') for broader matching across different name formats
      let positionResults: Array<{ position_text: string; topic: string | null }> = [];
      if (queryWords.length > 0) {
        const positionsQuery = await db
          .select({ position_text: positions.positionText, topic: positions.topic })
          .from(positions)
          .where(
            sql`thinker ILIKE ${'%' + figureId + '%'} AND (
              position_text ILIKE ${'%' + queryWords[0] + '%'}
              ${queryWords[1] ? sql` OR position_text ILIKE ${'%' + queryWords[1] + '%'}` : sql``}
              ${queryWords[2] ? sql` OR position_text ILIKE ${'%' + queryWords[2] + '%'}` : sql``}
            )`
          )
          .limit(8);
        positionResults = positionsQuery;
      }
      
      // 3. Search QUOTES table (verified quotes with citations)
      // Use wildcards ('%figureId%') for broader matching across different name formats
      let quoteResults: Array<{ quote_text: string; source_text_id: string | null }> = [];
      if (queryWords.length > 0) {
        const quotesQuery = await db
          .select({ quote_text: quotes.quoteText, source_text_id: quotes.sourceTextId })
          .from(quotes)
          .where(
            sql`thinker ILIKE ${'%' + figureId + '%'} AND (
              quote_text ILIKE ${'%' + queryWords[0] + '%'}
              ${queryWords[1] ? sql` OR quote_text ILIKE ${'%' + queryWords[1] + '%'}` : sql``}
            )`
          )
          .limit(8);
        quoteResults = quotesQuery;
      }
      
      // DEBUG LOG: Show retrieval counts for verification
      console.log(`[RAG] thinker: ${figureId} | chunks: ${textChunks.length} | quotes: ${quoteResults.length} | positions: ${positionResults.length}`);
      
      // ============ BUILD AUTHORITATIVE CONTEXT BLOCK ============
      // Combine quotes, positions, and chunks into a single unified context
      const totalRetrieved = textChunks.length + quoteResults.length + positionResults.length;
      
      // THIN RETRIEVAL CHECK: If fewer than 3 useful items, honest fallback
      if (totalRetrieved < 3) {
        console.log(`[RAG] THIN RETRIEVAL: Only ${totalRetrieved} items found - will use honest fallback`);
      }
      
      let contextBlock = "";
      const hasTextContent = textChunks.length > 0;
      const hasQuotes = quoteResults.length > 0;
      const hasPositions = positionResults.length > 0;
      
      if (hasQuotes || hasPositions || hasTextContent) {
        contextBlock = `\n\n=== DATABASE CONTEXT: ${thinkerName.toUpperCase()}'S ACTUAL WRITINGS ===\n\n`;
        
        // PRIORITY 1: Add verified quotes FIRST (most quotable, high signal)
        if (hasQuotes) {
          contextBlock += `--- VERIFIED QUOTES ---\n`;
          for (const q of quoteResults) {
            const sourceInfo = q.source_text_id ? ` (${q.source_text_id})` : '';
            contextBlock += `"${q.quote_text}"${sourceInfo}\n\n`;
          }
        }
        
        // PRIORITY 2: Add verified positions (curated philosophical stances)
        if (hasPositions) {
          contextBlock += `--- CORE POSITIONS ---\n`;
          for (const pos of positionResults) {
            const topicInfo = pos.topic ? `[${pos.topic}] ` : '';
            contextBlock += `${topicInfo}${pos.position_text}\n\n`;
          }
        }
        
        // PRIORITY 3: Add text chunks (raw source material)
        if (hasTextContent) {
          contextBlock += `--- SOURCE TEXT PASSAGES ---\n`;
          for (const chunk of textChunks) {
            const sourceFile = chunk.sourceFile?.replace(/\.txt$/, '').replace(/_/g, ' ') || 'Unknown';
            contextBlock += `From "${sourceFile}":\n${chunk.chunkText}\n\n`;
          }
        }
        
        contextBlock += `=== END DATABASE CONTEXT ===\n\n`;
      }
      
      // Build response instructions - ENFORCE word count and quote minimums
      let responseInstructions = "";
      const isDialogueMode = personaSettings?.dialogueMode === true;
      
      // These need to be accessible for finalInstructions later
      let targetWords = 750;
      let targetQuotes = 0;
      
      // DIALOGUE MODE: Short, conversational responses (100-200 words max)
      if (isDialogueMode) {
        targetWords = 150; // Cap for dialogue mode
        console.log(`[DIALOGUE MODE] Active - short conversational responses enabled`);
        responseInstructions += `
⚠️ DIALOGUE MODE ACTIVE - SHORT RESPONSES ONLY ⚠️

MANDATORY: Keep responses between 50-150 words maximum.
This is a CONVERSATION, not a lecture. Be concise and direct.

RULES:
- Maximum 150 words per response
- 2-4 short paragraphs at most
- No long monologues
- Ask follow-up questions to continue the dialogue
- Be conversational and engaging
- NO quotes unless specifically asked
- Get to the point immediately

STYLE: Crisp, direct, conversational. Like talking to a smart friend.
`;
      } else {
        // STANDARD MODE: Full essay-length responses
        // DEFAULTS: 750 words, 0 quotes (user preference)
        targetWords = (personaSettings?.responseLength && personaSettings.responseLength > 0) ? personaSettings.responseLength : 750;
        targetQuotes = (personaSettings?.quoteFrequency && personaSettings.quoteFrequency > 0) ? personaSettings.quoteFrequency : 0;
        
        // PROMPT OVERRIDE: Detect when user's request explicitly requires more than settings allow
        const messageLower = message.toLowerCase();
        
        // Detect explicit quote/example requests
        const quoteMatch = messageLower.match(/(?:give|list|provide|show|include|cite|quote|need|want|at\s+least)\s*(?:me\s*)?(\d+)\s*(?:quotes?|quotations?|examples?|passages?|excerpts?|citations?)/i) 
          || messageLower.match(/(\d+)\s*(?:quotes?|quotations?|examples?|passages?|excerpts?|citations?)/i);
        if (quoteMatch) {
          const requestedQuotes = parseInt(quoteMatch[1].replace(/,/g, ''), 10);
          if (requestedQuotes > targetQuotes && requestedQuotes <= 500) {
            targetQuotes = requestedQuotes;
            console.log(`[PROMPT OVERRIDE] User requested ${requestedQuotes} quotes`);
          }
        }
        
        // Detect explicit word count requests
        const wordMatch = messageLower.match(/(?:write|give|provide|compose|generate|in|about|approximately)\s*(?:me\s*)?(?:a\s*)?(\d[\d,]*)\s*(?:words?|word)/i)
          || messageLower.match(/(\d[\d,]*)\s*(?:words?|word)\s*(?:essay|response|answer|paper)/i);
        if (wordMatch) {
          const requestedWords = parseInt(wordMatch[1].replace(/,/g, ''), 10);
          if (requestedWords > targetWords && requestedWords <= 20000) {
            targetWords = requestedWords;
            console.log(`[PROMPT OVERRIDE] User requested ${requestedWords} words`);
          }
        }
        
        // Detect requests for many items that imply long responses
        const listMatch = messageLower.match(/(?:list|give|provide|show|enumerate|name)\s*(?:me\s*)?(\d+)\s*(?:things?|items?|points?|reasons?|arguments?|positions?|theses?|claims?|ideas?)/i);
        if (listMatch) {
          const numItems = parseInt(listMatch[1].replace(/,/g, ''), 10);
          const cappedItems = Math.min(numItems, 200);
          const impliedWords = Math.min(cappedItems * 75, 15000);
          if (impliedWords > targetWords) {
            targetWords = impliedWords;
            console.log(`[PROMPT OVERRIDE] User requested ${numItems} items - adjusting word count to ${targetWords}`);
          }
        }
        
        // Word count instruction
        responseInstructions += `\n⚠️ TARGET LENGTH: Approximately ${targetWords} words.\n`;
        
        // Quote instruction (only if quotes requested)
        if (targetQuotes > 0) {
          responseInstructions += `⚠️ QUOTE REQUIREMENT: Include at least ${targetQuotes} quotes from your writings above.\n`;
        }
        
        responseInstructions += `\nSTYLE: Write in the authentic voice and style of ${thinkerName}. Match their rhetorical patterns and intellectual approach.\n`;
      }
      
      // ============ DYNAMIC SYSTEM PROMPT FOR ANY PHILOSOPHER ============
      // The DB context is the authority - LLM breathes intelligence into it, not overwrites it
      
      // THIN RETRIEVAL: Flag for constrained prompt when retrieval is insufficient
      const isThinRetrieval = totalRetrieved < 3;
      if (isThinRetrieval) {
        console.log(`[THIN RETRIEVAL] Only ${totalRetrieved} items found - will use constrained prompt for ${thinkerName}`);
      }
      
      // Gate quote requirement behind actual quote availability
      const hasEnoughQuotes = quoteResults.length >= 2;
      const quoteRequirement = hasEnoughQuotes 
        ? `Every answer MUST include at least 2 direct quotes from the context above.`
        : `Include direct quotes from the context above where available.`;
      
      // Different prompts for thin retrieval vs normal retrieval
      let systemPrompt: string;
      
      if (isThinRetrieval) {
        // THIN RETRIEVAL: Constrained prompt that produces honest fallback
        systemPrompt = `You are ${thinkerName}.

The database search found insufficient context for this question (only ${totalRetrieved} relevant items found).

You MUST respond with this message:
"I don't have enough of my own text in the database to answer that properly yet."

Do not elaborate beyond this. Do not attempt to answer the question. Simply acknowledge the limitation.`;
      } else {
        // NORMAL RETRIEVAL: Full DB-grounded prompt with 3-layer structure
        const dbGroundingRules = `
CRITICAL DB-GROUNDING RULES:
1. The DATABASE CONTEXT above is the AUTHORITY. Your job is to breathe intelligence into it, not overwrite it.
2. You MUST ground your answer in the provided context.
3. ${quoteRequirement}
4. Do NOT add modern disclaimers, moral framing, or contemporary academic hedging unless explicitly present in the context.
5. Match ${thinkerName}'s tone and rhetorical style. Do NOT sound like a modern AI. Do NOT "balance both sides" unless ${thinkerName} does so.
6. You may elaborate, infer, and connect ideas ONLY if consistent with the retrieved material.
7. If you generalize beyond the context, label it explicitly as: "Inference:"

MANDATORY 3-LAYER RESPONSE STRUCTURE:
1. CORE (DB-grounded): State my view on this topic, referencing passages from the database context above.
2. INTERPRETATION (LLM intelligence): Explain/clarify the view, connect implications, consistent with my writings.
3. APPLICATION: Apply the view directly to the user's question in my authentic voice.
`;

        systemPrompt = `You are ${thinkerName}. When you answer, you ARE this philosopher - thinking as they think, defending what they discovered.

You are NOT a modern academic summarizing views. You ARE this thinker, speaking in first person with their authentic voice, intellectual style, and rhetorical approach.
${contextBlock}
${dbGroundingRules}
${responseInstructions}`;
      }
      
      // DEBUG: Log what settings we're actually using
      console.log(`[CHAT DEBUG] Persona settings: responseLength=${personaSettings?.responseLength}, quoteFrequency=${personaSettings?.quoteFrequency}, model=${personaSettings?.selectedModel}`);
      console.log(`[CHAT DEBUG] System prompt length: ${systemPrompt.length} chars`);

      // Build conversation history for AI context
      const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
      for (const msg of previousMessages) {
        if (msg.role === "user" || msg.role === "assistant") {
          conversationHistory.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
      
      // Add the current user message with document context if provided
      let finalMessage = message;
      if (documentText) {
        finalMessage = `[User has uploaded a document for discussion. Document content follows:]\n\n${documentText}\n\n[End of document]\n\n${message}`;
      }
      
      conversationHistory.push({
        role: "user",
        content: finalMessage,
      });

      // Setup SSE headers - disable ALL buffering
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
      
      // Disable socket timeout and flush headers immediately
      if (res.socket) {
        res.socket.setTimeout(0);
      }
      res.flushHeaders(); // CRITICAL: Send headers immediately to enable streaming

      let accumulatedContent = "";
      let verseKeywords = "";
      let streamedLength = 0;

      // Token limit: much lower for dialogue mode (short responses), high for standard mode
      const maxTokens = isDialogueMode ? 500 : 16000;

      // Get selected model from persona settings (default: zhi5 = Grok)
      const selectedModel = personaSettings?.selectedModel || "zhi5";
      
      // Get fallback order starting from selected model
      const fallbackModels = getFallbackModels(selectedModel);
      let lastError: Error | null = null;
      let successfulModel: string | null = null;

      // Try each model in fallback order until one succeeds
      for (const modelKey of fallbackModels) {
        const currentLLM = MODEL_CONFIG[modelKey];
        if (!currentLLM) continue;
        
        // Skip if provider's API key is not available
        if (!isProviderAvailable(currentLLM.provider)) {
          console.log(`[Fallback] Skipping ${modelKey} - no API key for ${currentLLM.provider}`);
          continue;
        }

        try {
          console.log(`[Fallback] Trying ${modelKey} (${currentLLM.provider}/${currentLLM.model})`);
          
        // Final emphatic instructions - skip for thin retrieval to let constrained prompt work
        const finalInstructions = isThinRetrieval ? '' : (isDialogueMode ? `

DIALOGUE MODE - CONVERSATIONAL RESPONSE

CRITICAL: MAXIMUM 150 WORDS. This is a conversation, not a lecture.

STYLE:
- Short, punchy responses (50-150 words max)
- Direct and conversational
- Get to the point immediately
- Ask a follow-up question to continue the dialogue
- NO academic bloat, NO long explanations

Be engaging. Be brief. Be ${thinkerName} - but in conversation mode.

FORMATTING: Plain text only (no markdown).

Now respond briefly as ${thinkerName}:
` : `

FINAL INSTRUCTIONS - AUTHENTIC PHILOSOPHER VOICE

TARGET RESPONSE LENGTH: ${targetWords} WORDS
Develop your points thoroughly with examples and reasoning from the database context.

YOU ARE ${thinkerName.toUpperCase()} - SPEAKING IN YOUR AUTHENTIC VOICE:

The source texts above are your intellectual foundation. Reason FROM this material. You're not reporting views - you're THINKING as this philosopher would think.

REMEMBER THE 3-LAYER STRUCTURE:
1. CORE: Ground your answer in the database context${hasEnoughQuotes ? ' with at least 2 quotes' : ', referencing available passages'}
2. INTERPRETATION: Explain and connect the ideas intelligently
3. APPLICATION: Apply to the user's question in first person

VOICE RULES:
- Speak as ${thinkerName}, not as a modern academic summarizing their views
- Match their rhetorical style, terminology, and intellectual approach
- Do NOT add modern disclaimers or contemporary academic hedging
- Do NOT "balance both sides" unless ${thinkerName} does so in the source texts

FORMATTING:
Plain text only (no markdown: no #, ##, **, *, etc.)

Now respond as ${thinkerName}, grounding your answer in the database context:
`);

          if (currentLLM.provider === "anthropic") {
            // ANTHROPIC CLAUDE
            if (!anthropic) {
              throw new Error("Anthropic API key not configured");
            }
            
            const anthropicMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
            
            if (conversationHistory.length === 1) {
              anthropicMessages.push({
                role: "user",
                content: `${systemPrompt}${finalInstructions}${conversationHistory[0].content}`,
              });
            } else {
              anthropicMessages.push({
                role: conversationHistory[0].role,
                content: conversationHistory[0].role === "user" 
                  ? `${systemPrompt}${finalInstructions}${conversationHistory[0].content}`
                  : conversationHistory[0].content,
              });
              for (let i = 1; i < conversationHistory.length; i++) {
                anthropicMessages.push(conversationHistory[i]);
              }
            }
            
            const stream = await anthropic.messages.stream({
              model: currentLLM.model,
              max_tokens: maxTokens,
              temperature: 0.7,
              messages: anthropicMessages,
            });

            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const content = chunk.delta.text;
                if (content) {
                  accumulatedContent += content;
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  // @ts-ignore
                  if (res.socket) res.socket.uncork();
                  streamedLength += content.length;
                }
              }
            }
          } else {
            // OPENAI / DEEPSEEK / PERPLEXITY / XAI
            // These all use OpenAI-compatible API
            const apiClient = getOpenAIClient(currentLLM.provider);
            if (!apiClient) {
              throw new Error(`${currentLLM.provider} API key not configured`);
            }
            
            const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
              { role: "system", content: `${systemPrompt}${finalInstructions}` }
            ];
            
            for (const msg of conversationHistory) {
              messages.push(msg);
            }
            
            const stream = await apiClient.chat.completions.create({
              model: currentLLM.model,
              messages,
              max_tokens: maxTokens,
              temperature: 0.7,
              stream: true,
            });

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                accumulatedContent += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
                // @ts-ignore
                if (res.socket) res.socket.uncork();
                streamedLength += content.length;
              }
            }
          }
          
          // If we got here, the call succeeded
          successfulModel = modelKey;
          console.log(`[Fallback] Success with ${modelKey}`);
          break; // Exit fallback loop on success
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`[Fallback] ${modelKey} failed:`, lastError.message);
          // Continue to next model in fallback order
          continue;
        }
      }
      
      // If no model succeeded, send error
      if (!successfulModel) {
        console.error(`[Fallback] All models failed. Last error:`, lastError);
        res.write(
          `data: ${JSON.stringify({ error: "All AI providers are currently unavailable. Please try again later." })}\n\n`
        );
        res.end();
        return;
      }

      // Remove verse marker from accumulated content (not used in Kuczynski app but keep for compatibility)
      const finalContent = accumulatedContent.split("---VERSE---")[0].trim();

      // NOTE: Quote verification disabled with RAG system
      // Quotes are now verified against retrieved chunks only

      // Save assistant message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: finalContent,
      });

      // Send completion signal
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in chat stream:", error);
      res.write(
        `data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`
      );
      res.end();
    }
  });

  // ============ AUDITED CHAT STREAM - FULL TRACE MODE ============
  // This endpoint runs the full corpus search with live audit trail
  app.post("/api/chat/stream-audited", async (req: any, res) => {
    try {
      const sessionId = await getSessionId(req);
      const { message, figureId: bodyFigureId } = req.body;

      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      const figureId = (bodyFigureId || "kuczynski").toLowerCase();
      const thinkerDisplayNames: Record<string, string> = {
        "kuczynski": "J.-M. Kuczynski",
        "freud": "Sigmund Freud",
        "nietzsche": "Friedrich Nietzsche",
        "aristotle": "Aristotle",
        "plato": "Plato",
        "kant": "Immanuel Kant",
        "hegel": "G.W.F. Hegel",
        "hume": "David Hume",
        "descartes": "René Descartes",
        "spinoza": "Baruch Spinoza",
        "locke": "John Locke",
        "darwin": "Charles Darwin",
        "newton": "Isaac Newton",
        "rousseau": "Jean-Jacques Rousseau",
        "voltaire": "Voltaire",
      };
      const thinkerName = thinkerDisplayNames[figureId] || figureId;

      console.log(`[AUDITED CHAT] Starting audited search for: "${message.substring(0, 50)}..." with ${thinkerName}`);

      // Get conversation
      let conversation = await storage.getCurrentConversation(sessionId);
      if (!conversation) {
        conversation = await storage.createConversation(sessionId, {
          title: `Audited Chat with ${thinkerName}`,
        });
      }

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message,
      });

      // Setup SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      if (res.socket) res.socket.setTimeout(0);
      res.flushHeaders();

      // Store audit result for later report generation
      let auditResult: AuditResult | null = null;

      // Run audited corpus search with live trace streaming
      auditResult = await auditedCorpusSearch(
        message,
        figureId,
        (event: TraceEvent) => {
          res.write(`data: ${JSON.stringify({ trace: event })}\n\n`);
          if (res.socket) (res.socket as any).uncork?.();
        }
      );

      // Emit audit result summary
      res.write(`data: ${JSON.stringify({ 
        auditSummary: {
          directAnswerCount: auditResult.directAnswers.length,
          aligned: auditResult.aligned,
          conflicting: auditResult.conflicting,
          finalDecision: auditResult.finalDecision
        }
      })}\n\n`);

      // Build context from audit results
      let contextBlock = "";
      if (auditResult.directAnswers.length > 0) {
        contextBlock = `\n\n=== DIRECT ANSWERS FROM ${thinkerName.toUpperCase()}'S CORPUS ===\n\n`;
        for (let i = 0; i < auditResult.directAnswers.length; i++) {
          const answer = auditResult.directAnswers[i];
          contextBlock += `[Answer ${i + 1} from ${answer.source}]:\n"${answer.text}"\n\n`;
        }
        contextBlock += `=== END DIRECT ANSWERS ===\n\n`;
      } else if (auditResult.adjacentMaterial.length > 0) {
        contextBlock = `\n\n=== ADJACENT MATERIAL (No Direct Answers Found) ===\n\n`;
        for (const mat of auditResult.adjacentMaterial) {
          contextBlock += `${mat}\n\n`;
        }
        contextBlock += `=== END ADJACENT MATERIAL ===\n\n`;
      }

      // Build system prompt based on audit result
      let systemPrompt: string;
      
      if (auditResult.finalDecision === 'conflicting') {
        systemPrompt = `You are ${thinkerName}.

The corpus search found THREE CONFLICTING answers to the user's question.

You MUST present all three answers separately. Do NOT synthesize or reconcile them.

Say: "I found three different answers in my writings. Here they are:"

Then present each answer as a separate numbered section.

${contextBlock}

Present these conflicting views honestly. Do not attempt to smooth over the disagreement.`;
      } else if (auditResult.finalDecision === 'no_direct_answer') {
        systemPrompt = `You are ${thinkerName}.

The corpus search did NOT find a direct answer to this question in my writings.

The following is ADJACENT material that may be relevant:
${contextBlock}

You MUST:
1. Acknowledge that you don't have a direct answer to this question in your corpus
2. Use the adjacent material cautiously to give a partial response
3. Clearly label any response as INDIRECT, saying something like: "While I don't address this directly in my writings, the closest I come is..."

Do NOT pretend you have a direct answer when you don't.`;
      } else {
        // Aligned direct answers
        systemPrompt = `You are ${thinkerName}. When you answer, you ARE this philosopher.

The corpus search found ${auditResult.directAnswers.length} ALIGNED direct answers.
${contextBlock}

You MUST:
1. Ground your response in these direct answers from the corpus
2. Speak in first person as ${thinkerName}
3. The direct answers above are the AUTHORITY - you're breathing intelligence into them, not inventing new positions

CRITICAL RULES:
- Quote directly from the passages above
- Do NOT add modern disclaimers or academic hedging
- Match ${thinkerName}'s rhetorical style and intellectual approach
- You may elaborate and connect ideas, but stay consistent with the retrieved material`;
      }

      // Emit generation start event
      res.write(`data: ${JSON.stringify({ trace: { 
        timestamp: Date.now(), 
        type: 'generation_start', 
        message: 'Starting LLM generation with audited context' 
      } })}\n\n`);

      // Get persona settings
      let personaSettings = await storage.getPersonaSettings(sessionId);
      const isDialogueMode = personaSettings?.dialogueMode === true;
      const maxTokens = isDialogueMode ? 500 : 8000;

      // Stream LLM response
      let accumulatedContent = "";
      const selectedModel = personaSettings?.selectedModel || "zhi5";
      const fallbackModels = getFallbackModels(selectedModel);
      
      for (const modelKey of fallbackModels) {
        const currentLLM = MODEL_CONFIG[modelKey];
        if (!currentLLM || !isProviderAvailable(currentLLM.provider)) continue;

        try {
          if (currentLLM.provider === "anthropic" && anthropic) {
            const stream = await anthropic.messages.stream({
              model: currentLLM.model,
              max_tokens: maxTokens,
              temperature: 0.7,
              messages: [{ role: "user", content: `${systemPrompt}\n\nUser question: ${message}` }],
            });

            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const content = chunk.delta.text;
                if (content) {
                  accumulatedContent += content;
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  if (res.socket) (res.socket as any).uncork?.();
                }
              }
            }
          } else {
            const apiClient = getOpenAIClient(currentLLM.provider);
            if (!apiClient) continue;

            const stream = await apiClient.chat.completions.create({
              model: currentLLM.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
              ],
              max_tokens: maxTokens,
              temperature: 0.7,
              stream: true,
            });

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                accumulatedContent += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
                if (res.socket) (res.socket as any).uncork?.();
              }
            }
          }
          break; // Success
        } catch (error) {
          console.error(`[Audited Chat] ${modelKey} failed:`, error);
          continue;
        }
      }

      // Save assistant message
      if (accumulatedContent) {
        await storage.createMessage({
          conversationId: conversation.id,
          role: "assistant",
          content: accumulatedContent,
        });
      }

      // Send audit report data for download
      if (auditResult) {
        const reportData = generateAuditReport(auditResult);
        res.write(`data: ${JSON.stringify({ auditReport: reportData })}\n\n`);
        console.log('[AUDITED CHAT] Sent audit report to client');
      } else {
        console.log('[AUDITED CHAT] Warning: auditResult was null, no report generated');
      }
      
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in audited chat stream:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate audited response" })}\n\n`);
      res.end();
    }
  });

  // Azure TTS endpoint
  app.post("/api/tts", async (req: any, res) => {
    try {
      const { text, voiceGender } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }

      // Validate Azure credentials
      if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
        return res.status(500).json({ error: "Azure Speech Service not configured" });
      }

      // Configure Azure Speech SDK
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY,
        process.env.AZURE_SPEECH_REGION
      );

      // Select voice based on gender preference
      const voiceMap: Record<string, string> = {
        masculine: "en-US-GuyNeural",
        feminine: "en-US-JennyNeural",
        neutral: "en-US-AriaNeural",
      };
      
      speechConfig.speechSynthesisVoiceName = voiceMap[voiceGender] || "en-US-GuyNeural";

      // Create synthesizer to generate audio data in memory
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null as any);

      // Synthesize speech
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // Send audio data as binary
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Content-Length', result.audioData.byteLength);
            res.send(Buffer.from(result.audioData));
          } else {
            console.error("TTS synthesis failed:", result.errorDetails);
            res.status(500).json({ error: "Speech synthesis failed" });
          }
          synthesizer.close();
        },
        (error) => {
          console.error("TTS error:", error);
          res.status(500).json({ error: "Speech synthesis error" });
          synthesizer.close();
        }
      );
    } catch (error) {
      console.error("Error in TTS endpoint:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // NOTE: Figure-related endpoints removed - figure tables no longer in schema
  // The app now uses the unified thinkers/quotes/positions tables instead
  // Removed endpoints:
  // - GET /api/figures
  // - GET /api/figures/:figureId
  // - GET /api/figures/:figureId/messages
  // - DELETE /api/figures/:figureId/messages
  // - POST /api/figures/:figureId/chat

  // Paper Writer - Generate philosophical papers in thinker's voice
  app.post("/api/figures/:figureId/write-paper", async (req: any, res) => {
    try {
      const { figureId } = req.params;
      const { topic, wordLength = 1500 } = req.body;

      if (!topic || typeof topic !== "string") {
        return res.status(400).json({ error: "Topic is required" });
      }

      // Get figure info using existing THINKER_NAMES lookup
      const figure = getThinkerInfo(figureId);
      if (!figure) {
        return res.status(404).json({ error: "Philosopher not found" });
      }

      console.log(`[Paper Writer] Generating ${wordLength} word paper on "${topic}" by ${figure.name}`);

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Retrieve relevant content from the thinker's works via RAG
      const normalizedName = normalizeAuthorName(figure.name);
      let thinkerContent = '';
      
      try {
        const relevantChunks = await searchPhilosophicalChunks(
          topic,
          12,
          "common",
          normalizedName
        );
        
        if (relevantChunks.length > 0) {
          thinkerContent = `\n\n╔══════════════════════════════════════════════════════════════════╗
║  SOURCE MATERIAL FROM ${figure.name.toUpperCase()}'S ACTUAL WORKS  ║
╚══════════════════════════════════════════════════════════════════╝

These passages are from ${figure.name}'s actual writings. Ground your paper in this material.\n\n`;
          relevantChunks.forEach((chunk, index) => {
            thinkerContent += `━━━ SOURCE ${index + 1}: "${chunk.paperTitle}" ━━━\n${chunk.content}\n\n`;
          });
          console.log(`[Paper Writer] Retrieved ${relevantChunks.length} relevant passages`);
        }
      } catch (error) {
        console.error(`[Paper Writer] Error retrieving content:`, error);
      }

      // Also get positions
      let positionsContent = '';
      try {
        const positionsResult = await db.execute(sql`
          SELECT position_text, topic FROM positions 
          WHERE thinker ILIKE ${'%' + normalizedName + '%'}
          ORDER BY RANDOM()
          LIMIT 10
        `);
        const rows = (positionsResult as any).rows || [];
        if (rows.length > 0) {
          positionsContent = `\n\n╔══════════════════════════════════════════════════════════════════╗
║  ${figure.name.toUpperCase()}'S DOCUMENTED POSITIONS  ║
╚══════════════════════════════════════════════════════════════════╝\n\n`;
          rows.forEach((row: any, i: number) => {
            positionsContent += `${i + 1}. ${row.position_text}${row.topic ? ` [${row.topic}]` : ''}\n`;
          });
          console.log(`[Paper Writer] Retrieved ${rows.length} positions`);
        }
      } catch (error) {
        console.error(`[Paper Writer] Error retrieving positions:`, error);
      }

      const systemPrompt = `You are ${figure.name}, philosopher. You are writing a formal philosophical paper on the topic provided.

WRITING STYLE:
- Write in first person as ${figure.name}
- Use your characteristic intellectual style and vocabulary
- Build arguments logically and systematically
- Reference your actual documented positions and works
- Maintain philosophical rigor throughout

PAPER STRUCTURE (approximately ${wordLength} words):
1. Introduction: State the thesis clearly
2. Background: Establish context and key concepts
3. Main Arguments: Develop 2-3 substantial arguments
4. Objections & Responses: Address potential criticisms
5. Conclusion: Synthesize and restate significance

${thinkerContent}
${positionsContent}

Write the paper now. Do NOT include meta-commentary about writing - just write the actual paper content.`;

      // Try LLM providers
      const models = [
        { name: "grok-3", provider: "xai" as const },
        { name: "claude-sonnet-4-20250514", provider: "anthropic" as const },
        { name: "gpt-4o", provider: "openai" as const },
      ];

      let success = false;

      for (const model of models) {
        if (success) break;
        
        try {
          console.log(`[Paper Writer] Trying ${model.provider}/${model.name}`);
          
          if (model.provider === "xai" && process.env.XAI_API_KEY) {
            const xaiClient = new OpenAI({
              apiKey: process.env.XAI_API_KEY,
              baseURL: "https://api.x.ai/v1",
            });
            
            const stream = await xaiClient.chat.completions.create({
              model: model.name,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Write a ${wordLength}-word philosophical paper on: ${topic}` }
              ],
              max_tokens: Math.min(wordLength * 2, 8000),
              temperature: 0.7,
              stream: true,
            });
            
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            }
            success = true;
            console.log(`[Paper Writer] Success with ${model.provider}`);
            
          } else if (model.provider === "anthropic" && anthropic) {
            const stream = await anthropic.messages.stream({
              model: model.name,
              max_tokens: Math.min(wordLength * 2, 8000),
              messages: [{ role: "user", content: `Write a ${wordLength}-word philosophical paper on: ${topic}` }],
              system: systemPrompt,
            });
            
            for await (const event of stream) {
              if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
              }
            }
            success = true;
            console.log(`[Paper Writer] Success with ${model.provider}`);
            
          } else if (model.provider === "openai" && openai) {
            const stream = await openai.chat.completions.create({
              model: model.name,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Write a ${wordLength}-word philosophical paper on: ${topic}` }
              ],
              max_tokens: Math.min(wordLength * 2, 8000),
              temperature: 0.7,
              stream: true,
            });
            
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            }
            success = true;
            console.log(`[Paper Writer] Success with ${model.provider}`);
          }
        } catch (error) {
          console.error(`[Paper Writer] ${model.provider} failed:`, error);
        }
      }

      if (!success) {
        res.write(`data: ${JSON.stringify({ content: "Error: Unable to generate paper. Please try again." })}\n\n`);
      }
      
      res.write("data: [DONE]\n\n");
      res.end();
      
    } catch (error) {
      console.error("[Paper Writer] Error:", error);
      res.status(500).json({ error: "Failed to generate paper" });
    }
  });


  // Model Builder - Generate isomorphic theories
  app.post("/api/model-builder", async (req: any, res) => {
    try {
      const { originalText, customInstructions, mode, previousModel, critique } = req.body;

      if (!originalText || typeof originalText !== "string") {
        return res.status(400).json({ error: "Original text is required" });
      }

      // Validate refinement mode parameters
      if (mode === "refine") {
        if (!previousModel || typeof previousModel !== "string") {
          return res.status(400).json({ error: "Previous model is required for refinement" });
        }
        if (!critique || typeof critique !== "string") {
          return res.status(400).json({ error: "Critique is required for refinement" });
        }
      }

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const MODEL_BUILDER_SYSTEM_PROMPT = `# MODEL BUILDER: PHILOSOPHICAL THEORY VALIDATOR & REINTERPRETATION ENGINE

You are a model-theoretic analysis tool for philosophical theories. Your job is NOT exegesis (what did the philosopher mean?) but MODEL THEORY (what assignment of meanings makes the formal structure true?).

## Three-Tier Response System

### TIER 1: LITERALLY TRUE
If the theory is correct as stated, confirm its validity by:
1. Identifying primitives/constants and their meanings
2. Showing the formal structure
3. Demonstrating truth

Format:
**Theory:** [name]
**Literal Status:** TRUE
**Primitives:** [list with meanings]
**Structure:** [formal relationships]
**Validation:** [why it's true]

### TIER 2: TRUE UNDER REINTERPRETATION
If false literally but true under some model:
1. Identify primitives needing reinterpretation
2. Provide new assignments for those primitives
3. Show how formal structure is preserved
4. Demonstrate reinterpreted claims are true

Format:
**Theory:** [name]
**Literal Status:** FALSE
**Model Type:** [Domain Swap / Category Correction / Deflationary / Level Shift]
**Primitive Reinterpretations:**
- [Original term] → [New meaning]
**Structure Preserved:**
- [Original relationship] → [Same relationship in model]
**Validation:**
- [Original claim] as [New claim] = TRUE because [justification]
**Summary:** [what theory becomes under model]

### TIER 3: CLOSEST VIABLE MODEL
If incoherent even under reinterpretation:
1. Identify nearest coherent theory
2. Explain minimal modifications needed
3. Provide model for modified version

Format:
**Theory:** [name]
**Literal Status:** INCOHERENT
**Nearest Coherent Theory:** [description]
**Required Modifications:** [minimal changes]
**Model for Modified Theory:** [as in Tier 2]

## Pattern Recognition Types

### DOMAIN SWAP (Leibniz, Rawls pattern)
Original primitives refer to Domain A → Reinterpreted primitives refer to Domain B
Formal relations preserved across domains
Example: Leibniz Monadology
- "monad" (windowless substance) → causal-informational structure
- "no windows" (no direct interaction) → no token-level causation

### CATEGORY CORRECTION (James pattern)
Claims about Category A are actually about Category B
Example: James Pragmatism
- "truth is what works" (metaphysical) → "knowledge is empowering" (epistemological)
- Utility marks knowledge, not truth

### DEFLATIONARY REINTERPRETATION (Berkeley, Plato patterns)
Mystical/inflated terms get mundane meanings
Example: Berkeley
- "God perceives to keep existing" → "Objects exist independently"
- Continuous existence explained without deity

### LEVEL SHIFT (Marx pattern)
Social/external structure → psychological/internal structure
Example: Marx
- Economic base → id/ego
- Ideological superstructure → superego
- Material foundation determines normative overlay

## Critical Examples

**Leibniz Monadology:**
- Literal: FALSE (no windowless substances)
- Model: TRUE (information structures with mediated causation)
- Type: Domain Swap
- "monad" → computational/informational unit
- "no windows" → no direct token causation
- "pre-established harmony" → lawful causal mediation

**Rawls Justice:**
- Literal: FALSE (justice isn't fairness)
- Model: TRUE (sustainable hierarchy)
- Type: Domain Swap + Deflationary
- "veil of ignorance" → coalition formation constraint
- "original position" → strategic bargaining
- "fairness" → sustainability under power dynamics

**Plato Recollection:**
- Literal: FALSE (no pre-birth knowledge)
- Model: TRUE (analytic knowledge)
- Type: Category Correction
- "recollection" → analytic reasoning
- "soul saw Forms" → grasp of logical relations
- "learning is remembering" → unpacking concepts

**Spinoza God/Nature:**
- Literal: DEPENDS (pantheism debate)
- Model: TRUE (naturalism)
- Type: Deflationary
- "God" → nature/reality
- "infinite attributes" → properties of reality
- "necessity" → causal determinism

## Your Task

Analyze the provided theory:
1. Parse primitives, structure, key claims
2. Test literal truth
3. If false, identify reinterpretation type
4. Generate model with new primitive assignments
5. Verify structure preservation
6. Validate that reinterpreted claims are true

Be precise, formal, and show your work. This is mathematics with philosophy.`;

      let userPrompt: string;
      
      if (mode === "refine") {
        // Refinement mode: include previous model and critique
        userPrompt = `REFINEMENT REQUEST

ORIGINAL THEORY:
${originalText}

PREVIOUS MODEL ANALYSIS:
${previousModel}

USER CRITIQUE:
${critique}

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}\n\n` : ''}Please revise the model analysis above based on the user's critique. Address the specific issues raised while maintaining the formal model-theoretic approach. Show what changed and why.`;
      } else {
        // Initial generation mode
        userPrompt = customInstructions
          ? `${customInstructions}\n\n---\n\nORIGINAL THEORY:\n${originalText}`
          : `ORIGINAL THEORY:\n${originalText}`;
      }

      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      });

      const stream = await anthropic.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        temperature: 0.7,
        system: MODEL_BUILDER_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          const data = JSON.stringify({ content: chunk.delta.text });
          res.write(`data: ${data}\n\n`);
        }
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in model builder:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate model" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
        res.end();
      }
    }
  });

  // ========================================
  // INTERNAL API: ZHI Knowledge Provider
  // ========================================

  // Request schema for knowledge queries
  // Note: figureId parameter retained for backward compatibility but queries unified 'common' pool
  const knowledgeRequestSchema = z.object({
    query: z.string().min(1).max(1000),
    figureId: z.string().optional().default("common"), // All queries now search unified knowledge base
    author: z.string().optional(), // NEW: Filter by author name (partial match via ILIKE)
    maxResults: z.number().int().min(1).max(20).optional().default(10),
    includeQuotes: z.boolean().optional().default(false),
    minQuoteLength: z.number().int().min(10).max(200).optional().default(50),
    numQuotes: z.number().int().min(1).max(50).optional().default(50), // NEW: Control number of quotes returned
    maxCharacters: z.number().int().min(100).max(50000).optional().default(10000),
  });

  // Helper: Apply spell correction for common OCR/conversion errors
  function applySpellCorrection(text: string): string {
    return text
      // Common OCR errors - double-v mistakes
      .replace(/\bvvith\b/gi, 'with')
      .replace(/\bvvhich\b/gi, 'which')
      .replace(/\bvvhat\b/gi, 'what')
      .replace(/\bvvhen\b/gi, 'when')
      .replace(/\bvvhere\b/gi, 'where')
      .replace(/\bvvhile\b/gi, 'while')
      .replace(/\bvvho\b/gi, 'who')
      .replace(/\bvve\b/gi, 'we')
      // Common OCR errors - letter confusion
      .replace(/\btbe\b/gi, 'the')
      .replace(/\btlie\b/gi, 'the')
      .replace(/\bwitli\b/gi, 'with')
      .replace(/\btbat\b/gi, 'that')
      .replace(/\btliis\b/gi, 'this')
      // Missing apostrophes (common OCR error)
      .replace(/\bdont\b/gi, "don't")
      .replace(/\bcant\b/gi, "can't")
      .replace(/\bwont\b/gi, "won't")
      .replace(/\bdoesnt\b/gi, "doesn't")
      .replace(/\bisnt\b/gi, "isn't")
      .replace(/\barent\b/gi, "aren't")
      .replace(/\bwerent\b/gi, "weren't")
      .replace(/\bwasnt\b/gi, "wasn't")
      .replace(/\bhasnt\b/gi, "hasn't")
      .replace(/\bhavent\b/gi, "haven't")
      .replace(/\bshouldnt\b/gi, "shouldn't")
      .replace(/\bwouldnt\b/gi, "wouldn't")
      .replace(/\bcouldnt\b/gi, "couldn't")
      // Fix spacing around punctuation
      .replace(/\s+([,.!?;:])/g, '$1')
      .replace(/([,.!?;:])\s+/g, '$1 ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Helper: Check if sentence is complete (ends with proper punctuation)
  function isCompleteSentence(text: string): boolean {
    const trimmed = text.trim();
    // Must end with . ! ? or closing quote followed by punctuation
    return /[.!?]["']?$/.test(trimmed) && !trimmed.endsWith('..') && !trimmed.endsWith('p.');
  }

  // Helper: Check if text is a citation fragment
  function isCitationFragment(text: string): boolean {
    const lowerText = text.toLowerCase();
    return (
      // Starts with section/chapter numbers
      /^\d+\.\d+\s+[A-Z]/.test(text) || // "9.0 The raven paradox"
      /^Chapter\s+\d+/i.test(text) ||
      /^Section\s+\d+/i.test(text) ||
      // Starts with citation markers
      /^(see|cf\.|e\.g\.|i\.e\.|viz\.|ibid\.|op\. cit\.|loc\. cit\.)/i.test(text) ||
      // Contains obvious citation patterns
      /\(\d{4}\)/.test(text) || // (1865)
      /\d{4},\s*p\.?\s*\d+/.test(text) || // 1865, p. 23
      /^\s*-\s*[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text) || // - William James
      /^["']?book,\s+the\s+/i.test(text) || // Starts with "book, the"
      // Ends with incomplete citation
      /,\s*p\.?$/i.test(text) || // ends with ", p." or ", p"
      /\(\s*[A-Z][a-z]+,?\s*\d{4}[),\s]*$/.test(text) // ends with (Author, 1865) or similar
    );
  }

  // Helper: Score quote quality and relevance
  function scoreQuote(quote: string, query: string): number {
    let score = 0;
    const quoteLower = quote.toLowerCase();
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    // Bonus for query word matches (relevance)
    for (const word of queryWords) {
      if (quoteLower.includes(word)) {
        score += 10;
      }
    }
    
    // Bonus for philosophical keywords
    const philosophicalKeywords = [
      'truth', 'knowledge', 'reality', 'existence', 'being', 'consciousness',
      'mind', 'reason', 'logic', 'ethics', 'morality', 'virtue', 'justice',
      'freedom', 'liberty', 'necessity', 'cause', 'effect', 'substance',
      'essence', 'nature', 'universe', 'god', 'soul', 'perception', 'experience',
      'understanding', 'wisdom', 'philosophy', 'metaphysics', 'epistemology'
    ];
    
    for (const keyword of philosophicalKeywords) {
      if (quoteLower.includes(keyword)) {
        score += 3;
      }
    }
    
    // Penalty for very short quotes
    if (quote.length < 100) score -= 5;
    
    // Bonus for medium length (100-300 chars is ideal)
    if (quote.length >= 100 && quote.length <= 300) score += 10;
    
    // Penalty for numbers/dates (likely citations)
    const numberCount = (quote.match(/\d+/g) || []).length;
    if (numberCount > 2) score -= 5;
    
    return score;
  }

  // Helper: Extract quotes from text passages with intelligent sentence detection
  function extractQuotes(
    passages: StructuredChunk[],
    query: string = "",
    minLength: number = 50,
    maxQuotes: number = 50
  ): Array<{ quote: string; source: string; chunkIndex: number; score: number; author: string }> {
    const quotes: Array<{ quote: string; source: string; chunkIndex: number; score: number; author: string }> = [];
    
    for (const passage of passages) {
      // Clean and normalize content
      const cleanedContent = passage.content
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .trim();
      
      // Smart sentence splitting that preserves citations
      // Split on . ! ? but NOT on abbreviations like "p.", "Dr.", "Mr.", "i.e.", "e.g."
      const sentences: string[] = [];
      let currentSentence = '';
      let i = 0;
      
      while (i < cleanedContent.length) {
        const char = cleanedContent[i];
        currentSentence += char;
        
        if (char === '.' || char === '!' || char === '?') {
          // Check if this is an abbreviation (followed by lowercase or another period)
          const nextChar = cleanedContent[i + 1];
          const prevWord = currentSentence.trim().split(/\s+/).pop() || '';
          
          const isAbbreviation = (
            /^(Dr|Mr|Mrs|Ms|Prof|Jr|Sr|vs|etc|i\.e|e\.g|cf|viz|ibid|op|loc|p|pp|vol|ch|sec|fig)\.$/i.test(prevWord) ||
            nextChar === '.' ||
            (nextChar && nextChar === nextChar.toLowerCase() && /[a-z]/.test(nextChar))
          );
          
          if (!isAbbreviation && nextChar && /\s/.test(nextChar)) {
            // This is a sentence boundary
            sentences.push(currentSentence.trim());
            currentSentence = '';
            i++; // Skip the space
            continue;
          }
        }
        
        i++;
      }
      
      // Add any remaining content
      if (currentSentence.trim()) {
        sentences.push(currentSentence.trim());
      }
      
      // Process each sentence
      for (let sentence of sentences) {
        // Apply spell correction
        sentence = applySpellCorrection(sentence);
        
        // Check if it's a complete sentence
        if (!isCompleteSentence(sentence)) continue;
        
        // Check length bounds
        if (sentence.length < minLength || sentence.length > 500) continue;
        
        // Check word count
        const wordCount = sentence.split(/\s+/).length;
        if (wordCount < 8) continue; // Require at least 8 words for substantive content
        
        // Check for citation fragments
        if (isCitationFragment(sentence)) continue;
        
        // Check for formatting artifacts
        const hasFormattingArtifacts = 
          sentence.includes('(<< back)') ||
          sentence.includes('(<<back)') ||
          sentence.includes('[<< back]') ||
          sentence.includes('*_') ||
          sentence.includes('_*');
        
        if (hasFormattingArtifacts) continue;
        
        // Check for excessive special characters
        const specialCharCount = (sentence.match(/[<>{}|\\]/g) || []).length;
        if (specialCharCount > 5) continue;
        
        // Score the quote
        const score = scoreQuote(sentence, query);
        
        quotes.push({
          quote: sentence,
          source: passage.paperTitle,
          chunkIndex: passage.chunkIndex,
          score,
          author: passage.author
        });
      }
    }
    
    // Deduplicate
    const uniqueQuotes = Array.from(new Map(quotes.map(q => [q.quote, q])).values());
    
    // Sort by score (best first)
    uniqueQuotes.sort((a, b) => b.score - a.score);
    
    // Return top N quotes
    return uniqueQuotes.slice(0, maxQuotes);
  }

  // ========================================
  // ZHI QUERY API: Structured knowledge queries
  // ========================================
  
  // Request schema for /zhi/query endpoint
  const zhiQuerySchema = z.object({
    query: z.string().min(1).max(1000),
    author: z.string().optional(), // Filter by author/philosopher name
    limit: z.number().int().min(1).max(50).optional().default(10),
    includeQuotes: z.boolean().optional().default(false),
  });

  app.post("/zhi/query", verifyZhiAuth, async (req, res) => {
    try {
      // Validate request body
      const validationResult = zhiQuerySchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request format",
          details: validationResult.error.errors
        });
      }
      
      const { query, author, limit, includeQuotes } = validationResult.data;
      
      // Audit log
      console.log(`[ZHI Query API] query="${query}", author="${author || 'any'}", limit=${limit}`);
      
      // CRITICAL FIX: Normalize author parameter + auto-detect from query text
      let detectedAuthor = author;
      
      // Step 1: Normalize explicit author parameter (handles "john-michael kuczynski" → "Kuczynski")
      if (detectedAuthor) {
        const { normalizeAuthorName } = await import("./vector-search");
        const normalized = normalizeAuthorName(detectedAuthor);
        if (normalized !== detectedAuthor) {
          console.log(`[ZHI Query API] 📝 Normalized author: "${detectedAuthor}" → "${normalized}"`);
          detectedAuthor = normalized;
        }
      }
      
      // Step 2: Auto-detect from query text if still no author
      if (!detectedAuthor && query) {
        const { detectAuthorFromQuery } = await import("./vector-search");
        detectedAuthor = await detectAuthorFromQuery(query);
        if (detectedAuthor) {
          console.log(`[ZHI Query API] 🎯 Auto-detected author from query: "${detectedAuthor}"`);
        }
      }
      
      // CRITICAL FIX: When quotes requested, search ONLY verbatim text chunks
      // Otherwise use normal search that includes position summaries
      let passages;
      let quotes = [];
      
      if (includeQuotes) {
        // Search ONLY verbatim text chunks for actual quotable content
        const { searchVerbatimChunks } = await import("./vector-search");
        passages = await searchVerbatimChunks(query, limit, detectedAuthor);
        console.log(`[ZHI Query API] 📝 Retrieved ${passages.length} VERBATIM text chunks for quotes`);
        
        // Extract quotes from verbatim text
        quotes = extractQuotes(passages, query, 50, 50);
      } else {
        // Normal search: includes both summaries and verbatim text
        passages = await searchPhilosophicalChunks(query, limit, "common", detectedAuthor);
      }
      
      // No post-filtering - semantic search already handles author/work relevance
      const filteredPassages = passages;
      
      // Build structured response with citations
      const results = filteredPassages.map(passage => ({
        excerpt: passage.content,
        citation: {
          author: passage.author, // CRITICAL: Use actual author field, not extracted from title
          work: passage.paperTitle,
          chunkIndex: passage.chunkIndex,
        },
        relevance: 1 - passage.distance, // Convert distance to relevance score (0-1)
        tokens: passage.tokens
      }));
      
      const response = {
        results,
        quotes: quotes.map(q => ({
          text: q.quote,
          citation: {
            author: q.author,
            work: q.source,
            chunkIndex: q.chunkIndex
          },
          relevance: q.score,
          tokens: Math.ceil(q.quote.split(/\s+/).length * 1.3) // Approximate token count
        })),
        meta: {
          resultsReturned: results.length,
          limitApplied: limit,
          queryProcessed: query,
          filters: {
            author: author || null
          },
          timestamp: Date.now()
        }
      };
      
      res.json(response);
      
    } catch (error) {
      console.error("[ZHI Query API] Error:", error);
      res.status(500).json({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Internal knowledge provider endpoint
  app.post("/api/internal/knowledge", verifyZhiAuth, async (req, res) => {
    try {
      // Validate request body
      const validationResult = knowledgeRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request format",
          details: validationResult.error.errors
        });
      }
      
      const { query, figureId, author, maxResults, includeQuotes, minQuoteLength, numQuotes, maxCharacters } = validationResult.data;
      
      // Audit log
      const appId = (req as any).zhiAuth?.appId || "unknown";
      console.log(`[Knowledge Provider] ${appId} querying unified knowledge base: "${query}" (figureId: ${figureId}, author: ${author || 'none'}, results: ${maxResults})`);
      
      // CRITICAL FIX: Map figureId → author for backward compatibility with EZHW
      let detectedAuthor = author;
      
      // Step 1: Map figureId to author name if no explicit author provided
      if (!detectedAuthor && figureId && figureId !== 'common') {
        const { mapFigureIdToAuthor } = await import("./vector-search");
        const mappedAuthor = mapFigureIdToAuthor(figureId);
        if (mappedAuthor) {
          console.log(`[Knowledge Provider] 🔄 Mapped figureId "${figureId}" → author "${mappedAuthor}"`);
          detectedAuthor = mappedAuthor;
        }
      }
      
      // Step 2: Normalize explicit author parameter (handles "john-michael kuczynski" → "Kuczynski")
      if (detectedAuthor) {
        const { normalizeAuthorName } = await import("./vector-search");
        const normalized = normalizeAuthorName(detectedAuthor);
        if (normalized !== detectedAuthor) {
          console.log(`[Knowledge Provider] 📝 Normalized author: "${detectedAuthor}" → "${normalized}"`);
          detectedAuthor = normalized;
        }
      }
      
      // Step 3: Auto-detect from query text if still no author
      if (!detectedAuthor && query) {
        const { detectAuthorFromQuery } = await import("./vector-search");
        detectedAuthor = await detectAuthorFromQuery(query);
        if (detectedAuthor) {
          console.log(`[Knowledge Provider] 🎯 Auto-detected author from query: "${detectedAuthor}"`);
        }
      }
      
      // Perform semantic search with STRICT author filtering
      // When author detected/specified → returns ONLY that author's content
      const passages = await searchPhilosophicalChunks(query, maxResults, figureId, detectedAuthor);
      
      // Truncate passages to respect maxCharacters limit
      let totalChars = 0;
      const truncatedPassages: StructuredChunk[] = [];
      
      for (const passage of passages) {
        if (totalChars + passage.content.length <= maxCharacters) {
          truncatedPassages.push(passage);
          totalChars += passage.content.length;
        } else {
          // Include partial passage if there's room
          const remainingChars = maxCharacters - totalChars;
          if (remainingChars > 100) {
            truncatedPassages.push({
              ...passage,
              content: passage.content.substring(0, remainingChars) + "..."
            });
          }
          break;
        }
      }
      
      // Extract quotes if requested
      const quotes = includeQuotes ? extractQuotes(truncatedPassages, query || "", minQuoteLength, numQuotes || 50) : [];
      
      // Build response
      const response = {
        success: true,
        meta: {
          query,
          figureId,
          resultsReturned: truncatedPassages.length,
          totalCharacters: totalChars,
          quotesExtracted: quotes.length,
          timestamp: Date.now()
        },
        passages: truncatedPassages.map(p => ({
          author: p.author, // REQUIRED: Author attribution for every passage
          paperTitle: p.paperTitle,
          content: p.content,
          chunkIndex: p.chunkIndex,
          semanticDistance: p.distance,
          source: p.source,
          figureId: p.figureId,
          tokens: p.tokens
        })),
        quotes: quotes.map(q => ({
          text: q.quote,
          source: q.source,
          chunkIndex: q.chunkIndex
        }))
      };
      
      res.json(response);
      
    } catch (error) {
      console.error("[Knowledge Provider] Error:", error);
      res.status(500).json({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ========================================
  // QUOTE GENERATOR: Site Authors
  // ========================================
  
  app.post("/api/quotes/generate", async (req, res) => {
    try {
      const { query, author, numQuotes = 10 } = req.body;

      if (!author) {
        return res.status(400).json({
          success: false,
          error: "Author is required"
        });
      }

      const quotesLimit = Math.min(Math.max(parseInt(numQuotes) || 10, 1), 50);
      const searchQuery = query?.trim() || "";

      // Map author names to thinker_id in thinker_quotes database
      const thinkerIdMap: Record<string, string> = {
        "J.-M. Kuczynski": "kuczynski",
        "Kuczynski": "kuczynski",
        "Bertrand Russell": "russell",
        "Russell": "russell",
        "Friedrich Nietzsche": "nietzsche",
        "Nietzsche": "nietzsche",
        "Plato": "plato",
        "Aristotle": "aristotle",
        "Immanuel Kant": "kant",
        "Kant": "kant",
        "David Hume": "hume",
        "Hume": "hume",
        "G.W.F. Hegel": "hegel",
        "Hegel": "hegel",
        "Adam Smith": "smith",
        "Smith": "smith",
        "John Dewey": "dewey",
        "Dewey": "dewey",
        "John Stuart Mill": "mill",
        "Mill": "mill",
        "René Descartes": "descartes",
        "Descartes": "descartes",
        "ALLEN": "allen",
        "James Allen": "allen",
        "Sigmund Freud": "freud",
        "Freud": "freud",
        "Baruch Spinoza": "spinoza",
        "Spinoza": "spinoza",
        "George Berkeley": "berkeley",
        "Berkeley": "berkeley",
        "Thomas Hobbes": "hobbes",
        "Hobbes": "hobbes",
        "John Locke": "locke",
        "Locke": "locke",
        "Jean-Jacques Rousseau": "rousseau",
        "Rousseau": "rousseau",
        "Karl Marx": "marx",
        "Marx": "marx",
        "Arthur Schopenhauer": "schopenhauer",
        "Schopenhauer": "schopenhauer",
        "William James": "williamjames",
        "Gottfried Wilhelm Leibniz": "leibniz",
        "Leibniz": "leibniz",
        "Isaac Newton": "newton",
        "Newton": "newton",
        "Galileo Galilei": "galileo",
        "Galileo": "galileo",
        "Charles Darwin": "darwin",
        "Darwin": "darwin",
        "Voltaire": "voltaire",
        "Edgar Allan Poe": "poe",
        "Poe": "poe",
        "Carl Jung": "jung",
        "Jung": "jung",
        "Francis Bacon": "bacon",
        "Bacon": "bacon",
        "Confucius": "confucius",
        "Emma Goldman": "goldman",
        "Goldman": "goldman",
        "François de La Rochefoucauld": "larochefoucauld",
        "La Rochefoucauld": "larochefoucauld",
        "Alexis de Tocqueville": "tocqueville",
        "Tocqueville": "tocqueville",
        "Friedrich Engels": "engels",
        "Engels": "engels",
        "Vladimir Lenin": "lenin",
        "Lenin": "lenin",
        "Herbert Spencer": "spencer",
        "Spencer": "spencer",
        "Edward Gibbon": "gibbon",
        "Gibbon": "gibbon",
        "Aesop": "aesop",
        "Orison Swett Marden": "marden",
        "Marden": "marden",
        "Moses Maimonides": "maimonides",
        "Maimonides": "maimonides",
        "Wilhelm Reich": "reich",
        "Reich": "reich",
        "Walter Lippmann": "lippmann",
        "Lippmann": "lippmann",
        "Ambrose Bierce": "bierce",
        "Bierce": "bierce",
        "Niccolò Machiavelli": "machiavelli",
        "Machiavelli": "machiavelli",
        "Ludwig von Mises": "mises",
        "Mises": "mises",
        "Friedrich Hayek": "hayek",
        "Hayek": "hayek",
        "Ernst Mach": "mach",
        "Mach": "mach",
        "George Boole": "boole",
        "Boole": "boole",
        "Alfred Adler": "adler",
        "Adler": "adler",
        "Henri Bergson": "bergson",
        "Bergson": "bergson",
      };
      
      // Normalize author name: strip diacritics then remove non-alpha characters
      const thinkerId = thinkerIdMap[author] || author
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics (accents)
        .toLowerCase()
        .replace(/[^a-z]/g, '');

      console.log(`[Quote Generator] Querying quotes for ${author} (id: ${thinkerId}), query: "${searchQuery}", limit: ${quotesLimit}`);

      let quotes: any[] = [];
      
      // If query provided, search by topic/quote content
      if (searchQuery) {
        const searchWords = searchQuery.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        if (searchWords.length > 0) {
          const topicConditions = searchWords.slice(0, 5).map((word: string) => `quote_text ILIKE '%${word}%' OR topic ILIKE '%${word}%'`).join(' OR ');
          const searchResult = await db.execute(
            sql`SELECT quote_text as quote, topic FROM quotes 
                WHERE thinker ILIKE ${'%' + thinkerId + '%'}
                AND (${sql.raw(topicConditions)})
                ORDER BY RANDOM() 
                LIMIT ${quotesLimit}`
          );
          quotes = searchResult.rows || [];
          console.log(`[Quote Generator] Topic search found ${quotes.length} quotes`);
        }
      }
      
      // If no query or no matches, get random quotes
      if (quotes.length === 0) {
        const randomResult = await db.execute(
          sql`SELECT quote_text as quote, topic FROM quotes 
              WHERE thinker ILIKE ${'%' + thinkerId + '%'}
              ORDER BY RANDOM() 
              LIMIT ${quotesLimit}`
        );
        quotes = randomResult.rows || [];
        console.log(`[Quote Generator] Random selection found ${quotes.length} quotes`);
      }

      // LLM FALLBACK: If still no quotes, use RAG + LLM to generate them
      let usedFallback = false;
      if (quotes.length === 0) {
        console.log(`[Quote Generator] No curated quotes found, using LLM fallback for ${author}`);
        usedFallback = true;
        
        try {
          // Get relevant chunks from the thinker's works via RAG
          const normalizedAuthor = normalizeAuthorName(author);
          const ragQuery = searchQuery || author + " philosophy ideas";
          const chunks = await searchPhilosophicalChunks(ragQuery, 8, "common", normalizedAuthor);
          
          if (chunks.length > 0) {
            console.log(`[Quote Generator] Found ${chunks.length} RAG chunks for ${author}`);
            
            // Build context from chunks
            const context = chunks.map((c, i) => 
              `[Source ${i+1}: ${c.paperTitle}]\n${c.content}`
            ).join('\n\n---\n\n');
            
            // Use LLM to extract quotes
            const prompt = `You are extracting memorable quotes from ${author}'s writings.

CONTEXT FROM ${author.toUpperCase()}'S WORKS:
${context}

TASK: Extract ${quotesLimit} distinct, quotable passages from the above text. Each quote should be:
- A complete, standalone thought (1-3 sentences)
- Philosophically significant or memorable
- Directly from the source material (do NOT paraphrase or invent)

Format each quote as:
QUOTE: [exact quote text]
SOURCE: [source title]

Extract ${quotesLimit} quotes now:`;

            const response = await anthropic!.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 2000,
              temperature: 0.3,
              messages: [{ role: "user", content: prompt }]
            });
            
            const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
            
            // Parse quotes from response
            const quoteMatches = responseText.matchAll(/QUOTE:\s*(.+?)(?:\nSOURCE:\s*(.+?))?(?=\n\nQUOTE:|\n*$)/gs);
            for (const match of quoteMatches) {
              if (quotes.length >= quotesLimit) break;
              const quoteText = match[1]?.trim().replace(/^["']|["']$/g, '');
              const source = match[2]?.trim() || chunks[0]?.paperTitle || 'Works';
              if (quoteText && quoteText.length > 20) {
                quotes.push({ quote: quoteText, source, topic: 'Generated' });
              }
            }
            console.log(`[Quote Generator] LLM extracted ${quotes.length} quotes`);
          } else {
            console.log(`[Quote Generator] No RAG chunks found for ${author}, using general knowledge`);
            
            // Fallback to general knowledge
            const prompt = `Generate ${quotesLimit} authentic-sounding quotes that capture ${author}'s philosophical views and writing style.

REQUIREMENTS:
- Each quote should reflect ${author}'s known philosophical positions
- Use their characteristic terminology and style
- 1-3 sentences each
- Do NOT invent views they never held

Format each as:
QUOTE: [quote text]
SOURCE: [likely source work]

Generate ${quotesLimit} quotes:`;

            const response = await anthropic!.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 2000,
              temperature: 0.5,
              messages: [{ role: "user", content: prompt }]
            });
            
            const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
            
            const quoteMatches = responseText.matchAll(/QUOTE:\s*(.+?)(?:\nSOURCE:\s*(.+?))?(?=\n\nQUOTE:|\n*$)/gs);
            for (const match of quoteMatches) {
              if (quotes.length >= quotesLimit) break;
              const quoteText = match[1]?.trim().replace(/^["']|["']$/g, '');
              const source = match[2]?.trim() || 'Works';
              if (quoteText && quoteText.length > 20) {
                quotes.push({ quote: quoteText, source, topic: 'Generated' });
              }
            }
            console.log(`[Quote Generator] LLM generated ${quotes.length} quotes from general knowledge`);
          }
        } catch (llmError) {
          console.error(`[Quote Generator] LLM fallback failed:`, llmError);
        }
      }

      console.log(`[Quote Generator] Returning ${quotes.length} quotes from ${author}${usedFallback ? ' (LLM fallback)' : ''}`);

      res.json({
        success: true,
        quotes: quotes.map((row: any, idx: number) => ({
          text: row.quote,
          source: row.source || row.topic || 'Works',
          chunkIndex: idx,
          author: author
        })),
        meta: {
          query: searchQuery,
          author,
          quotesFound: quotes.length,
          usedFallback
        }
      });

    } catch (error) {
      console.error("[Quote Generator] Error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate quotes"
      });
    }
  });

  // ========================================
  // POSITION GENERATOR - DIRECT DATABASE QUERY
  // ========================================
  
  app.post("/api/positions/generate", async (req, res) => {
    try {
      const { thinker, topic, numPositions = 20 } = req.body;

      if (!thinker) {
        return res.status(400).json({
          success: false,
          error: "Thinker is required"
        });
      }

      const positionsLimit = Math.min(Math.max(parseInt(numPositions) || 20, 5), 50);
      
      // Normalize thinker name - extract last word (typically the surname) for better matching
      const thinkerParts = thinker.trim().split(/[\s.,-]+/).filter((p: string) => p.length > 1);
      const normalizedThinker = thinkerParts[thinkerParts.length - 1] || thinker;
      
      console.log(`[Position Generator] Querying database for ${positionsLimit} positions from ${thinker} (normalized: ${normalizedThinker})${topic ? ` on: "${topic}"` : ' (all topics)'}`);

      // Set up SSE response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Query positions table directly - NO LLM generation
      let positions: any[] = [];
      
      if (topic?.trim()) {
        // Search by topic if provided
        positions = await db.execute(sql`
          SELECT position_text, topic 
          FROM positions 
          WHERE thinker ILIKE ${'%' + normalizedThinker + '%'}
          AND (topic ILIKE ${'%' + topic + '%'} OR position_text ILIKE ${'%' + topic + '%'})
          ORDER BY RANDOM()
          LIMIT ${positionsLimit}
        `);
      } else {
        // Get random positions across all topics
        positions = await db.execute(sql`
          SELECT position_text, topic 
          FROM positions 
          WHERE thinker ILIKE ${'%' + normalizedThinker + '%'}
          ORDER BY RANDOM()
          LIMIT ${positionsLimit}
        `);
      }

      const rows = (positions as any).rows || positions;
      
      if (!rows || rows.length === 0) {
        res.write(`data: ${JSON.stringify({ content: `No position statements found for ${thinker}${topic ? ` on topic "${topic}"` : ''} in the database.` })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      console.log(`[Position Generator] Found ${rows.length} positions for ${thinker}`);

      // Format positions as numbered list and stream them one by one
      for (let idx = 0; idx < rows.length; idx++) {
        const row = rows[idx];
        const topicInfo = row.topic ? ` [${row.topic}]` : '';
        const positionLine = `${idx + 1}. ${row.position_text}${topicInfo}\n\n`;
        res.write(`data: ${JSON.stringify({ content: positionLine })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error) {
      console.error("[Position Generator] Error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate positions"
      });
    }
  });

  // ========================================
  // QUOTE EXTRACTION FROM UPLOADED FILES
  // ========================================

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(txt|pdf|docx|doc)$/i)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only .txt, .pdf, .doc, and .docx files are allowed.'));
      }
    }
  });

  // Extract quotes from uploaded document
  app.post("/api/quotes/extract", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          error: "No file uploaded" 
        });
      }

      const { query = 'all', numQuotes = '10' } = req.body;
      const quotesLimit = Math.min(Math.max(parseInt(numQuotes) || 10, 1), 50);

      let textContent = '';

      // Parse file based on type
      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'txt') {
        textContent = req.file.buffer.toString('utf-8');
      } else if (fileExtension === 'pdf') {
        const pdfData = await pdfParse(req.file.buffer);
        textContent = pdfData.text;
      } else if (fileExtension === 'docx') {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        textContent = result.value;
      } else if (fileExtension === 'doc') {
        // For legacy .doc files, try mammoth (works for some)
        try {
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          textContent = result.value;
        } catch (err) {
          return res.status(400).json({
            success: false,
            error: "Legacy .doc format not fully supported. Please convert to .docx or .pdf"
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: "Unsupported file type"
        });
      }

      if (!textContent.trim()) {
        return res.status(400).json({
          success: false,
          error: "Document appears to be empty or could not be parsed"
        });
      }

      console.log(`[Quote Extraction] Processing ${req.file.originalname} (${textContent.length} chars)`);

      // Extract quotes from the document text
      const quotes: string[] = [];
      
      // First, try to find explicit quotes (text in quotation marks)
      const explicitQuotePattern = /"([^"]{50,500})"/g;
      const explicitMatches = Array.from(textContent.matchAll(explicitQuotePattern));
      for (const match of explicitMatches) {
        if (match[1] && match[1].trim().length >= 50) {
          quotes.push(match[1].trim());
        }
      }

      // Then extract substantial sentences as quotes
      const sentences = textContent.split(/[.!?]\s+/);
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        
        // Filter by query if provided
        if (query && query !== 'all') {
          const queryLower = query.toLowerCase();
          const sentenceLower = trimmed.toLowerCase();
          if (!sentenceLower.includes(queryLower)) {
            continue;
          }
        }

        // Accept sentences between 50-500 chars
        if (trimmed.length >= 50 && trimmed.length <= 500) {
          const wordCount = trimmed.split(/\s+/).length;
          
          // Quality filters
          const hasFormattingArtifacts = 
            trimmed.includes('(<< back)') ||
            trimmed.includes('(<<back)') ||
            trimmed.includes('[<< back]') ||
            trimmed.includes('*_') ||
            trimmed.includes('_*') ||
            /\(\d+\)\s*$/.test(trimmed) ||
            /\[\d+\]\s*$/.test(trimmed);
          
          const specialCharCount = (trimmed.match(/[<>{}|\\]/g) || []).length;
          const hasExcessiveSpecialChars = specialCharCount > 5;
          
          if (wordCount >= 5 && !hasFormattingArtifacts && !hasExcessiveSpecialChars) {
            quotes.push(trimmed);
          }
        }
      }

      // Deduplicate and limit
      const uniqueQuotes = Array.from(new Set(quotes));
      const finalQuotes = uniqueQuotes.slice(0, quotesLimit);

      console.log(`[Quote Extraction] Found ${finalQuotes.length} quotes from ${req.file.originalname}`);

      res.json({
        success: true,
        quotes: finalQuotes,
        meta: {
          filename: req.file.originalname,
          totalQuotesFound: uniqueQuotes.length,
          quotesReturned: finalQuotes.length,
          documentLength: textContent.length
        }
      });

    } catch (error) {
      console.error("[Quote Extraction] Error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to extract quotes"
      });
    }
  });

  // ========================================
  // THESIS TO WORLD: Documentary Incident Generator
  // Dialogue Creator endpoint
  app.post("/api/dialogue-creator", upload.single('file'), async (req, res) => {
    try {
      let sourceText = '';
      const { text, customInstructions, authorId1, authorId2 } = req.body;

      // Get text from file upload or direct input
      if (req.file) {
        const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'txt') {
          sourceText = req.file.buffer.toString('utf-8');
        } else if (fileExtension === 'pdf') {
          const pdfData = await pdfParse(req.file.buffer);
          sourceText = pdfData.text;
        } else if (fileExtension === 'docx' || fileExtension === 'doc') {
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          sourceText = result.value;
        } else {
          return res.status(400).json({
            success: false,
            error: "Unsupported file type. Please upload .txt, .pdf, .doc, or .docx"
          });
        }
      } else if (text) {
        sourceText = text;
      }

      if (!sourceText || sourceText.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: "Please provide at least 5 characters (topic or text)"
        });
      }

      // Determine if input is a short topic vs a full text
      const isTopicOnly = sourceText.trim().length < 200;

      console.log(`[Dialogue Creator] Generating dialogue, ${sourceText.length} chars input (${isTopicOnly ? 'topic' : 'text'}), thinker1=${authorId1}, thinker2=${authorId2 || 'none'}`);

      // Retrieve content for both thinkers
      let author1Content = '';
      let author1Name = '';
      let author2Content = '';
      let author2Name = '';
      const isEveryman = authorId2 === 'everyman';

      // Get first thinker details
      if (authorId1 && authorId1 !== 'none') {
        try {
          const author = getThinkerInfo(authorId1);
          if (author) {
            author1Name = author.name;
            const normalizedAuthorName = normalizeAuthorName(author1Name);
            console.log(`[Dialogue Creator] First thinker: ${author1Name} (normalized: ${normalizedAuthorName})`);
            
            const relevantChunks = await searchPhilosophicalChunks(
              sourceText,
              4,
              "common",
              normalizedAuthorName
            );
            
            if (relevantChunks.length > 0) {
              author1Content = `\n\n=== REFERENCE MATERIAL FROM ${author1Name.toUpperCase()} ===\n\n`;
              relevantChunks.forEach((chunk, index) => {
                author1Content += `[Excerpt ${index + 1}] ${chunk.paperTitle}\n${chunk.content}\n\n`;
              });
              author1Content += `=== END REFERENCE MATERIAL ===\n`;
              console.log(`[Dialogue Creator] Retrieved ${relevantChunks.length} chunks for ${author1Name}`);
            }
          }
        } catch (error) {
          console.error(`[Dialogue Creator] Error retrieving first thinker content:`, error);
        }
      }

      // Get second thinker details (if not Everyman)
      if (authorId2 && authorId2 !== 'none' && authorId2 !== 'everyman') {
        try {
          const author = getThinkerInfo(authorId2);
          if (author) {
            author2Name = author.name;
            const normalizedAuthorName = normalizeAuthorName(author2Name);
            console.log(`[Dialogue Creator] Second thinker: ${author2Name} (normalized: ${normalizedAuthorName})`);
            
            const relevantChunks = await searchPhilosophicalChunks(
              sourceText,
              4,
              "common",
              normalizedAuthorName
            );
            
            if (relevantChunks.length > 0) {
              author2Content = `\n\n=== REFERENCE MATERIAL FROM ${author2Name.toUpperCase()} ===\n\n`;
              relevantChunks.forEach((chunk, index) => {
                author2Content += `[Excerpt ${index + 1}] ${chunk.paperTitle}\n${chunk.content}\n\n`;
              });
              author2Content += `=== END REFERENCE MATERIAL ===\n`;
              console.log(`[Dialogue Creator] Retrieved ${relevantChunks.length} chunks for ${author2Name}`);
            }
          }
        } catch (error) {
          console.error(`[Dialogue Creator] Error retrieving second thinker content:`, error);
        }
      }

      // Set Everyman name if selected
      if (isEveryman) {
        author2Name = 'Everyman';
      }

      // Build dialogue system prompt based on thinker configuration
      const hasTwoPhilosophers = author1Name && author2Name && !isEveryman;
      const hasEverymanDialogue = author1Name && isEveryman;
      const char1Name = author1Name ? author1Name.split(' ').pop()?.toUpperCase() : 'PHILOSOPHER';
      const char2Name = isEveryman ? 'EVERYMAN' : (author2Name ? author2Name.split(' ').pop()?.toUpperCase() : 'STUDENT');
      
      let DIALOGUE_SYSTEM_PROMPT = `# DIALOGUE CREATOR SYSTEM PROMPT

You are the Dialogue Creator for the "Ask a Philosopher" app. Your purpose is to create authentic philosophical dialogue between the specified thinkers.

## DIALOGUE CONFIGURATION

${hasTwoPhilosophers ? `
### TWO-PHILOSOPHER DIALOGUE
This dialogue features two historical philosophers engaging directly with each other:
- **${char1Name}** (${author1Name}): Use their actual philosophical positions, terminology, and intellectual style
- **${char2Name}** (${author2Name}): Use their actual philosophical positions, terminology, and intellectual style

Both philosophers should:
- Speak from their authentic historical/philosophical perspectives
- Engage directly with each other's positions
- Challenge each other's views substantively
- Reference their own works and ideas
- Show genuine intellectual respect while disagreeing
- Address each other directly ("you" not "he/she")
` : hasEverymanDialogue ? `
### PHILOSOPHER-EVERYMAN DIALOGUE
This dialogue features a philosopher speaking with a thoughtful layperson:
- **${char1Name}** (${author1Name}): The philosopher, speaking from their authentic intellectual perspective
- **EVERYMAN**: A thoughtful, curious non-philosopher who asks genuine questions

The philosopher should:
- Speak from their authentic historical/philosophical perspective
- Use their characteristic terminology and reasoning patterns
- Be patient but intellectually honest with the layperson
- Provide concrete examples to illustrate abstract concepts

Everyman should:
- Ask genuine clarifying questions
- Challenge with common-sense objections
- Misunderstand productively (not stupidly)
- Build understanding through the dialogue
` : `
### STANDARD DIALOGUE
Create an authentic philosophical dialogue on the given topic.
`}

## CRITICAL: WHAT YOUR DIALOGUES ARE NOT

You are NOT creating:
- Socratic dialogues (fake "I know nothing" pretense)
- Perry-style straw-man dialogues (weak opponent exists to be demolished)
- Academic Q&A sessions (dry, lifeless exchange of information)
- Generic LLM dialogue (polite, hedging, safe)
- One character lecturing while another nods
- Dialogue where one character is clearly the author's mouthpiece

## WHAT YOUR DIALOGUES ARE

Authentic philosophical conversations characterized by:
- Real intellectual movement and discovery
- Both characters contributing substantively
- Concrete examples grounding abstract concepts
- Natural speech patterns
- Psychological realism
- Building complexity systematically
- Direct engagement (use "you" when addressing each other, never third person)

## DIALOGUE STRUCTURE

### OPENING
Start directly with the topic or disagreement. NO preambles. Just get into it.

### DEVELOPMENT
- Both parties make substantive contributions
- Disagreements are explored, not papered over
- Examples and thought experiments illustrate points
- The dialogue has intellectual movement—ideas develop

### CLOSURE
End with natural exhaustion of the topic, pointing toward further questions, or acknowledgment of remaining disagreement. NO forced lessons or moralizing wrap-ups.

## STYLE REQUIREMENTS

### NATURAL SPEECH
- Use contractions, sentence fragments when natural
- Avoid stiff academic jargon
- No hedging or generic LLM politeness

### DIRECTNESS
Philosophers speak with authority about their positions.
NOT: "Well, one might argue that..." or "It could perhaps be said that..."

### INTELLECTUAL HONESTY
- Acknowledge when questions are difficult
- Point out when distinctions are subtle
- Don't oversimplify for convenience

## OUTPUT FORMAT

Structure your output exactly as:

[CHARACTER NAME]: [Dialogue]

[CHARACTER NAME]: [Dialogue]

Use CAPS for character names (${char1Name}, ${char2Name}). Use proper paragraph breaks. No additional formatting.

## FINAL INSTRUCTION

Create a philosophically rigorous, psychologically realistic dialogue. The dialogue should feel like overhearing two real minds grappling with real ideas. Target 800-1200 words.`;

      // Build user prompt
      let userPrompt = isTopicOnly 
        ? `Topic for dialogue:\n\n${sourceText}\n\nCreate a philosophical dialogue on this topic.`
        : `Source text to transform into dialogue:\n\n${sourceText}`;
      
      // Add author-specific content if available
      if (author1Content) {
        userPrompt += `\n\n${author1Content}`;
      }
      if (author2Content) {
        userPrompt += `\n\n${author2Content}`;
      }
      
      if (customInstructions && customInstructions.trim()) {
        userPrompt += `\n\nCustom instructions: ${customInstructions}`;
      }

      // Set up SSE streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream dialogue generation
      const stream = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        temperature: 0.7,
        stream: true,
        system: DIALOGUE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }]
      });

      let fullResponse = '';
      
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const text = event.delta.text;
          fullResponse += text;
          
          // Send chunks via SSE
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      const wordCount = fullResponse.split(/\s+/).length;
      console.log(`[Dialogue Creator] Generated ${wordCount} words`);

      // Send final metadata
      res.write(`data: ${JSON.stringify({ 
        done: true,
        wordCount
      })}\n\n`);
      
      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error) {
      console.error("[Dialogue Creator] Error:", error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate dialogue"
        });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`);
        res.end();
      }
    }
  });

  // ==================== INTERVIEW CREATOR ====================
  app.post("/api/interview-creator", upload.single('file'), async (req, res) => {
    try {
      const { thinkerId, mode, interviewerTone, wordLength, topic } = req.body;
      let sourceText = '';

      // Validate thinker selection
      if (!thinkerId) {
        return res.status(400).json({
          success: false,
          error: "Please select a thinker to interview"
        });
      }

      // Get text from file upload or use topic
      if (req.file) {
        const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'txt' || fileExtension === 'md') {
          sourceText = req.file.buffer.toString('utf-8');
        } else if (fileExtension === 'pdf') {
          const pdfData = await pdfParse(req.file.buffer);
          sourceText = pdfData.text;
        } else if (fileExtension === 'docx' || fileExtension === 'doc') {
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          sourceText = result.value;
        } else {
          return res.status(400).json({
            success: false,
            error: "Unsupported file type. Please upload .txt, .pdf, .doc, .docx, or .md"
          });
        }
      }

      // Get thinker details
      const thinker = getThinkerInfo(thinkerId);
      if (!thinker) {
        return res.status(404).json({
          success: false,
          error: "Selected thinker not found"
        });
      }

      const targetWordLength = parseInt(wordLength) || 1500;
      const totalChapters = Math.ceil(targetWordLength / 2000);
      const wordsPerChapter = Math.ceil(targetWordLength / totalChapters);
      
      console.log(`[Interview Creator] Generating ${targetWordLength} word interview with ${thinker.name}`);
      console.log(`[Interview Creator] Split into ${totalChapters} chapter(s), ~${wordsPerChapter} words each`);
      console.log(`[Interview Creator] Mode: ${mode}, Tone: ${interviewerTone}`);

      // Retrieve relevant content from the thinker's works
      const normalizedThinkerName = normalizeAuthorName(thinker.name);
      let thinkerContent = '';
      
      try {
        const relevantChunks = await searchPhilosophicalChunks(
          sourceText || topic || thinker.name,
          8,
          "common",
          normalizedThinkerName
        );
        
        if (relevantChunks.length > 0) {
          thinkerContent = `\n\n╔══════════════════════════════════════════════════════════════════╗
║  MANDATORY SOURCE MATERIAL - ${thinker.name.toUpperCase()}'S ACTUAL POSITIONS  ║
╚══════════════════════════════════════════════════════════════════╝

These passages contain ${thinker.name}'s ACTUAL documented positions. You MUST ground all of ${thinker.name}'s interview responses in this material. Do NOT invent positions.\n\n`;
          relevantChunks.forEach((chunk, index) => {
            thinkerContent += `━━━ SOURCE ${index + 1}: "${chunk.paperTitle}" ━━━\n${chunk.content}\n\n`;
          });
          thinkerContent += `╔══════════════════════════════════════════════════════════════════╗
║  END SOURCE MATERIAL - USE ONLY THESE POSITIONS IN RESPONSES    ║
╚══════════════════════════════════════════════════════════════════╝\n`;
          console.log(`[Interview Creator] Retrieved ${relevantChunks.length} relevant passages`);
        }
      } catch (error) {
        console.error(`[Interview Creator] Error retrieving content:`, error);
      }

      // Build interviewer tone description
      const toneDescriptions: Record<string, string> = {
        neutral: `NEUTRAL INTERVIEWER: You are a well-disposed, objective interviewer. You listen attentively, ask for clarification when needed, and help the interviewee relate their views to broader topics. You're supportive but never sycophantic. You don't share your own opinions but focus on drawing out the interviewee's positions.`,
        dialectical: `DIALECTICALLY ENGAGED INTERVIEWER: You are an active intellectual participant, not just a questioner. You volunteer your own views, sometimes agree enthusiastically, sometimes disagree respectfully. You have a cooperative mentality but engage as an almost equal intellectual partner. You push back when you find arguments unconvincing but remain genuinely curious.`,
        hostile: `HOSTILE INTERVIEWER: You are attempting to challenge and critique the interviewee's positions through rigorous logic and legitimate argumentation. You look for weaknesses, inconsistencies, and gaps. You're not rude or personal, but you're intellectually relentless. Every claim must withstand scrutiny.`
      };

      // Build mode description
      const modeDescriptions: Record<string, string> = {
        conservative: `CONSERVATIVE MODE: Stay strictly faithful to ${thinker.name}'s documented views and stated positions. Quote and reference their actual works. Don't speculate about views they never expressed. When uncertain, acknowledge the limits of their written record.`,
        aggressive: `AGGRESSIVE MODE: You may reconstruct and extend ${thinker.name}'s views beyond their explicit statements. Apply their intellectual framework to contemporary issues they never addressed. Integrate insights from later scholarship and related thinkers. The goal is an intellectually alive reconstruction, not a museum exhibit.`
      };

      // If no RAG content retrieved, log warning but continue with general knowledge
      if (!thinkerContent || thinkerContent.trim() === '') {
        console.log(`[Interview Creator] No RAG content found for ${thinker.name}, proceeding with general profile`);
        thinkerContent = `\n\nNote: Using ${thinker.name}'s general profile and historical knowledge. For more authentic responses, upload source material from their actual works.\n`;
      }

      const INTERVIEW_SYSTEM_PROMPT = `# INTERVIEW CREATOR SYSTEM PROMPT

You are generating an in-depth interview with ${thinker.name}. 

## MANDATORY GROUNDING REQUIREMENT - READ THIS FIRST

YOU MUST DERIVE EVERY CLAIM, POSITION, AND ARGUMENT FROM THE RETRIEVED PASSAGES PROVIDED BELOW.

THIS IS NON-NEGOTIABLE:
- Do NOT invent philosophical positions
- Do NOT guess what ${thinker.name} might think
- Do NOT attribute views to ${thinker.name} that are not explicitly supported by the retrieved passages
- If the passages don't support a particular claim, ${thinker.name} should say "I haven't written on that specifically" or redirect to what they HAVE written

CITATION REQUIREMENT:
- ${thinker.name}'s responses MUST incorporate verbatim phrases and concepts from the retrieved passages
- When making a claim, ${thinker.name} should naturally reference their own works: "As I wrote in [title]..." or "My analysis of [concept] shows..."
- Every substantive philosophical claim must be traceable to the provided source material

FORBIDDEN:
- Inventing positions ${thinker.name} never held
- Attributing common philosophical positions to ${thinker.name} without passage support
- Making up arguments that sound plausible but aren't in the sources
- Guessing ${thinker.name}'s views on topics not covered in the passages

## INTERVIEW MODE
${modeDescriptions[mode] || modeDescriptions.conservative}

## INTERVIEWER TONE
${toneDescriptions[interviewerTone] || toneDescriptions.neutral}

## CHARACTER: ${thinker.name.toUpperCase()}
${thinker.title ? `Title/Era: ${thinker.title}` : ''}
${thinker.description ? `Background: ${thinker.description}` : ''}

The interviewee speaks as ${thinker.name} in first person. They deploy their distinctive analytical machinery from the retrieved passages. They reference their actual works and use their characteristic terminology AS FOUND IN THE PASSAGES.

## CRITICAL RULES

1. NO PLEASANTRIES: Start immediately with a substantive question. No greetings whatsoever.

2. PASSAGE-GROUNDED VOICE: ${thinker.name} must speak using concepts, terminology, and arguments FROM THE PROVIDED PASSAGES. Do not paraphrase generic philosophy - use THEIR specific formulations.

3. INTELLECTUAL HONESTY: If asked about something not covered in the passages, ${thinker.name} should redirect: "That's not a topic I've addressed directly. What I have analyzed is..." and pivot to actual passage content.

## OUTPUT FORMAT

INTERVIEWER: [Question or challenge - NO GREETINGS]

${thinker.name.toUpperCase()}: [Response grounded in passage content, using their actual terminology and arguments]

INTERVIEWER: [Follow-up or new direction]

${thinker.name.toUpperCase()}: [Response with explicit reference to their works/concepts from passages]

Continue this pattern. Use CAPS for speaker names. No markdown formatting. Plain text only.

## LENGTH TARGET
Generate approximately ${wordsPerChapter} words for this ${totalChapters > 1 ? 'chapter' : 'interview'}. This is CRITICAL - do not cut short.
${totalChapters > 1 ? `This is chapter content - make it self-contained with a natural ending point. Each chapter MUST be approximately ${wordsPerChapter} words.` : ''}

## QUALITY REQUIREMENTS
- Every ${thinker.name} response must be traceable to the retrieved passages
- Use verbatim phrases from the sources naturally integrated into responses
- Reference specific works/papers by title when possible
- Maintain intellectual tension while staying grounded in actual positions
- The interview explores what's IN the passages, not what you imagine ${thinker.name} might think`;

      // Set up SSE streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';
      let currentChapter = 1;

      // Generate chapters if needed
      for (let chapter = 1; chapter <= totalChapters; chapter++) {
        currentChapter = chapter;
        
        // Send chapter notification
        res.write(`data: ${JSON.stringify({ chapter, totalChapters })}\n\n`);

        // Build the user prompt for this chapter
        let userPrompt = '';
        
        if (sourceText) {
          userPrompt = `Generate an interview about this text:\n\n${sourceText.slice(0, 8000)}\n\n`;
        } else if (topic) {
          userPrompt = `Topic for the interview: ${topic}\n\n`;
        }

        if (thinkerContent) {
          userPrompt += thinkerContent;
        }

        if (chapter > 1) {
          userPrompt += `\n\nThis is Chapter ${chapter} of ${totalChapters}. Continue the interview from where the previous chapter ended. Here's how the previous chapter ended:\n\n${fullResponse.slice(-1500)}\n\nContinue naturally from this point with new questions and topics.`;
        } else if (totalChapters > 1) {
          userPrompt += `\n\nThis is Chapter 1 of ${totalChapters}. Start with foundational concepts and build toward more complex ideas in later chapters.`;
        }

        // Stream this chapter
        const stream = await anthropic!.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          temperature: 0.7,
          stream: true,
          system: INTERVIEW_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }]
        });

        let chapterText = '';
        
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text;
            chapterText += text;
            fullResponse += text;
            
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }

        const currentWordCount = fullResponse.split(/\s+/).length;
        console.log(`[Interview Creator] Chapter ${chapter}/${totalChapters} complete, ${currentWordCount} words total`);

        // Send word count update
        res.write(`data: ${JSON.stringify({ wordCount: currentWordCount })}\n\n`);

        // If more chapters to go, add chapter break and ENFORCE 60-second pause
        if (chapter < totalChapters) {
          const chapterBreak = `\n\n--- END OF CHAPTER ${chapter} ---\n\n`;
          fullResponse += chapterBreak;
          res.write(`data: ${JSON.stringify({ content: chapterBreak })}\n\n`);
          
          // Log the start of the mandatory pause
          const pauseStart = Date.now();
          console.log(`[Interview Creator] PAUSE START: 60-second break after Chapter ${chapter}. No LLM calls during this period.`);
          
          // Notify client about wait
          res.write(`data: ${JSON.stringify({ waiting: true, waitTime: 60, chapter })}\n\n`);
          
          // MANDATORY 60-SECOND WAIT - NO LLM CALLS DURING THIS PERIOD
          await new Promise(resolve => setTimeout(resolve, 60000));
          
          const actualPause = Math.round((Date.now() - pauseStart) / 1000);
          console.log(`[Interview Creator] PAUSE END: Waited ${actualPause} seconds. Resuming with Chapter ${chapter + 1}.`);
        }
      }

      const finalWordCount = fullResponse.split(/\s+/).length;
      console.log(`[Interview Creator] Complete: ${finalWordCount} words, ${totalChapters} chapter(s)`);

      res.write(`data: ${JSON.stringify({ 
        done: true,
        wordCount: finalWordCount,
        chapters: totalChapters
      })}\n\n`);
      
      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error) {
      console.error("[Interview Creator] Error:", error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate interview"
        });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`);
        res.end();
      }
    }
  });

  // ==================== PLATO SQLite DATABASE API ====================
  
  // Import Plato database functions
  const { searchPlatoPositions, getAllDialogues, getAllSpeakers } = await import('./plato-db.js');
  
  // Get all available dialogues
  app.get("/api/plato/dialogues", (_req, res) => {
    try {
      const dialogues = getAllDialogues();
      res.json({ success: true, dialogues });
    } catch (error) {
      console.error("[Plato API] Error fetching dialogues:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch dialogues" 
      });
    }
  });
  
  // Get all available speakers
  app.get("/api/plato/speakers", (_req, res) => {
    try {
      const speakers = getAllSpeakers();
      res.json({ success: true, speakers });
    } catch (error) {
      console.error("[Plato API] Error fetching speakers:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch speakers" 
      });
    }
  });
  
  // Search Plato positions
  app.post("/api/plato/search", async (req, res) => {
    try {
      const { dialogue, speaker, keyword, searchText, limit } = req.body;
      
      // Input validation to prevent abuse
      if (limit && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 100'
        });
      }
      
      // Validate string inputs (max length to prevent abuse)
      const maxStringLength = 500;
      if (dialogue && (typeof dialogue !== 'string' || dialogue.length > maxStringLength)) {
        return res.status(400).json({ success: false, error: 'Invalid dialogue parameter' });
      }
      if (speaker && (typeof speaker !== 'string' || speaker.length > maxStringLength)) {
        return res.status(400).json({ success: false, error: 'Invalid speaker parameter' });
      }
      if (keyword && (typeof keyword !== 'string' || keyword.length > maxStringLength)) {
        return res.status(400).json({ success: false, error: 'Invalid keyword parameter' });
      }
      if (searchText && (typeof searchText !== 'string' || searchText.length > maxStringLength)) {
        return res.status(400).json({ success: false, error: 'Invalid searchText parameter' });
      }
      
      const results = searchPlatoPositions({
        dialogue,
        speaker,
        keyword,
        searchText,
        limit: limit || 50
      });
      
      console.log(`[Plato API] Search returned ${results.length} results`);
      
      res.json({ 
        success: true, 
        count: results.length,
        positions: results
      });
    } catch (error) {
      console.error("[Plato API] Error searching positions:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to search positions" 
      });
    }
  });

  // Nietzsche SQLite Database API endpoints
  const { getAllWorks, getAllYears, searchNietzschePositions, getDatabaseStats: getNietzscheStats } = await import('./nietzsche-db');

  // Get all works
  app.get("/api/nietzsche/works", async (req, res) => {
    try {
      const works = getAllWorks();
      console.log(`[Nietzsche API] Retrieved ${works.length} works`);
      res.json({ success: true, works });
    } catch (error) {
      console.error("[Nietzsche API] Error fetching works:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch works" 
      });
    }
  });

  // Get all years
  app.get("/api/nietzsche/years", async (req, res) => {
    try {
      const years = getAllYears();
      console.log(`[Nietzsche API] Retrieved ${years.length} years`);
      res.json({ success: true, years });
    } catch (error) {
      console.error("[Nietzsche API] Error fetching years:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch years" 
      });
    }
  });

  // Get database stats
  app.get("/api/nietzsche/stats", async (req, res) => {
    try {
      const stats = getNietzscheStats();
      console.log(`[Nietzsche API] Database stats: ${stats.totalPositions} positions`);
      res.json({ success: true, stats });
    } catch (error) {
      console.error("[Nietzsche API] Error fetching stats:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch stats" 
      });
    }
  });

  // Search Nietzsche positions
  app.post("/api/nietzsche/search", async (req, res) => {
    try {
      const { work, year, keyword, searchText, limit } = req.body;
      
      // Input validation
      if (limit && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 100'
        });
      }
      
      const maxStringLength = 500;
      if (work && (typeof work !== 'string' || work.length > maxStringLength)) {
        return res.status(400).json({ success: false, error: 'Invalid work parameter' });
      }
      if (year && (typeof year !== 'number' || year < 1800 || year > 1900)) {
        return res.status(400).json({ success: false, error: 'Invalid year parameter' });
      }
      if (keyword && (typeof keyword !== 'string' || keyword.length > maxStringLength)) {
        return res.status(400).json({ success: false, error: 'Invalid keyword parameter' });
      }
      if (searchText && (typeof searchText !== 'string' || searchText.length > maxStringLength)) {
        return res.status(400).json({ success: false, error: 'Invalid searchText parameter' });
      }
      
      const results = searchNietzschePositions({
        work,
        year,
        keyword,
        searchText,
        limit: limit || 50
      });
      
      console.log(`[Nietzsche API] Search returned ${results.length} results`);
      
      res.json({ 
        success: true, 
        count: results.length,
        positions: results
      });
    } catch (error) {
      console.error("[Nietzsche API] Error searching positions:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to search positions" 
      });
    }
  });

  // Debate Creator endpoint
  app.post("/api/debate/generate", async (req, res) => {
    try {
      const { thinker1Id, thinker2Id, mode, instructions, paperText, enhanced } = req.body;

      if (!thinker1Id || !thinker2Id) {
        return res.status(400).json({ error: "Both thinkers must be selected" });
      }

      const thinker1 = getThinkerInfo(thinker1Id);
      const thinker2 = getThinkerInfo(thinker2Id);

      if (!thinker1 || !thinker2) {
        return res.status(404).json({ error: "One or both thinkers not found" });
      }

      // Build the debate prompt
      let debatePrompt = "";

      if (mode === "auto") {
        // Auto mode: Find their most violent disagreement
        debatePrompt = `You are orchestrating a philosophical debate between ${thinker1.name} and ${thinker2.name}.

CRITICAL RULE: The thinkers must DIRECTLY ADDRESS EACH OTHER using "you" - NOT speak about each other in third person.

WRONG: "Hume fails to understand that..."
RIGHT: "You fail to understand, Hume, that..."

WRONG: "Kuczynski's position leads to..."  
RIGHT: "Your position leads to catastrophe because..."

OBJECTIVE: Identify where these two thinkers most violently disagree and create an intense back-and-forth debate.

FORMAT:
- Brief opening from each (1 paragraph)
- 3-4 rounds of DIRECT exchange where they attack each other's positions face-to-face
- Each turn: 2-4 sentences MAX. Keep it punchy and confrontational.

FORMATTING:
- Plain text only. No markdown.
- Label speakers: ${thinker1.name.split(' ').pop()?.toUpperCase()}: and ${thinker2.name.split(' ').pop()?.toUpperCase()}:

CONTENT:
1. DIRECT ADDRESS - always use "you" when challenging the opponent
2. Short, sharp responses - no long monologues
3. Total length: 800-1200 words
4. Ground positions in RAG context when provided

${paperText ? `TOPIC/CONTEXT:\n${paperText}\n\nDebate this topic directly.` : ''}

Begin the debate. Remember: ADDRESS EACH OTHER DIRECTLY.`;
      } else {
        // Custom mode: User-specified parameters
        if (!instructions || instructions.trim() === "") {
          return res.status(400).json({ error: "Custom mode requires instructions" });
        }
        
        debatePrompt = `You are orchestrating a philosophical debate between ${thinker1.name} and ${thinker2.name}.

CRITICAL RULE: The thinkers must DIRECTLY ADDRESS EACH OTHER using "you" - NOT speak about each other in third person.

WRONG: "Hume fails to understand..."
RIGHT: "You fail to understand, Hume..."

USER TOPIC/INSTRUCTIONS:
${instructions}

${paperText ? `ADDITIONAL CONTEXT:\n${paperText}\n` : ''}

FORMAT:
- Brief opening from each (1 paragraph)
- 3-4 rounds of direct exchange
- Each turn: 2-4 sentences MAX. Short, punchy, confrontational.
- Label speakers: ${thinker1.name.split(' ').pop()?.toUpperCase()}: and ${thinker2.name.split(' ').pop()?.toUpperCase()}:
- Plain text only. No markdown.
- Total: 800-1200 words

Begin. DIRECTLY ADDRESS EACH OTHER.`;
      }

      // If enhanced mode, retrieve RAG context for both thinkers
      let ragContext = "";
      if (enhanced) {
        try {
          const query = mode === "auto" 
            ? `core philosophical positions ${thinker1.name} ${thinker2.name}` 
            : instructions || "";
          
          // CORRECT PARAMETER ORDER: searchPhilosophicalChunks(query, topK, figureId, authorFilter)
          const chunks1 = await searchPhilosophicalChunks(query, 6, "common", normalizeAuthorName(thinker1.name));
          const chunks2 = await searchPhilosophicalChunks(query, 6, "common", normalizeAuthorName(thinker2.name));

          if (chunks1.length > 0 || chunks2.length > 0) {
            ragContext = "\n\n=== DOCUMENTED PHILOSOPHICAL POSITIONS (Use these to ground the debate) ===\n\n";
            
            if (chunks1.length > 0) {
              ragContext += `${thinker1.name}'s documented positions:\n`;
              chunks1.forEach((chunk, i) => {
                ragContext += `[${i + 1}] ${chunk.content}\n`;
                if (chunk.citation) ragContext += `    Source: ${chunk.citation}\n`;
              });
              ragContext += "\n";
            }
            
            if (chunks2.length > 0) {
              ragContext += `${thinker2.name}'s documented positions:\n`;
              chunks2.forEach((chunk, i) => {
                ragContext += `[${i + 1}] ${chunk.content}\n`;
                if (chunk.citation) ragContext += `    Source: ${chunk.citation}\n`;
              });
            }
            
            ragContext += "\n=== END DOCUMENTED POSITIONS ===\n";
          } else if (enhanced) {
            // Warn if RAG failed but enhanced was requested
            console.warn(`[Debate] Enhanced mode enabled but no RAG chunks found for ${thinker1.name} or ${thinker2.name}`);
          }
        } catch (error) {
          console.error("RAG retrieval error:", error);
        }
      }

      const fullPrompt = debatePrompt + ragContext;

      // Setup SSE headers for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
      
      // Disable socket timeout and flush headers immediately
      if (res.socket) {
        res.socket.setTimeout(0);
      }
      res.flushHeaders();

      // Call Anthropic to generate the debate with streaming
      if (!anthropic) {
        res.write(`data: ${JSON.stringify({ error: "Anthropic API not configured" })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      console.log(`[Debate] Starting debate generation between ${thinker1.name} and ${thinker2.name}`);
      
      const stream = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000, // Increased for longer debates (1500-2500 words)
        temperature: 0.7,
        stream: true,
        messages: [
          {
            role: "user",
            content: fullPrompt
          }
        ]
      });

      // Stream the response
      let totalTokens = 0;
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          totalTokens++;
          res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
        }
      }

      console.log(`[Debate] Stream complete. Generated ${totalTokens} chunks`);
      res.write("data: [DONE]\n\n");
      res.end();

    } catch (error) {
      console.error("Debate generation error:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate debate" })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  });

  // ============ QUOTES API ============
  
  // Get all quotes for a thinker
  app.get("/api/quotes/:thinkerId", async (req, res) => {
    try {
      const { thinkerId } = req.params;
      const result = await db.select().from(quotes).where(eq(quotes.thinker, thinkerId));
      res.json(result);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Get random quotes for a thinker
  app.get("/api/quotes/:thinkerId/random", async (req, res) => {
    try {
      const { thinkerId } = req.params;
      const count = parseInt(req.query.count as string) || 5;
      
      const result = await db.select()
        .from(quotes)
        .where(eq(quotes.thinker, thinkerId))
        .orderBy(sql`RANDOM()`)
        .limit(count);
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching random quotes:", error);
      res.status(500).json({ error: "Failed to fetch random quotes" });
    }
  });

  // Search quotes by topic or content
  app.get("/api/quotes/search", async (req, res) => {
    try {
      const { q, thinkerId } = req.query;
      const searchTerm = `%${q}%`;
      
      let query = db.select().from(quotes);
      
      if (thinkerId) {
        query = query.where(eq(quotes.thinker, thinkerId as string));
      }
      
      const result = await query.where(
        sql`${quotes.quoteText} ILIKE ${searchTerm} OR ${quotes.topic} ILIKE ${searchTerm}`
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error searching quotes:", error);
      res.status(500).json({ error: "Failed to search quotes" });
    }
  });

  // Get all quotes (for Quote Generator)
  app.get("/api/quotes", async (req, res) => {
    try {
      const result = await db.select().from(quotes);
      res.json(result);
    } catch (error) {
      console.error("Error fetching all quotes:", error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // ============================================
  // ARGUMENT STATEMENTS API
  // ============================================

  // Import argument statements (bulk upload)
  app.post("/api/arguments/import", async (req, res) => {
    try {
      const { arguments: args } = req.body;
      
      if (!Array.isArray(args) || args.length === 0) {
        return res.status(400).json({ error: "No arguments provided" });
      }
      
      // Validate and insert each argument
      let inserted = 0;
      let errors: string[] = [];
      
      for (let i = 0; i < args.length; i++) {
        try {
          const arg = args[i];
          
          // Validate required fields
          if (!arg.thinker || !arg.argumentType || !arg.premises || !arg.conclusion) {
            errors.push(`Argument ${i + 1}: Missing required fields`);
            continue;
          }
          
          // Generate embedding for semantic search
          let embedding = null;
          try {
            const embeddingText = `Premises: ${arg.premises.join('. ')}. Conclusion: ${arg.conclusion}`;
            const embeddingResponse = await openai?.embeddings.create({
              model: "text-embedding-ada-002",
              input: embeddingText,
            });
            if (embeddingResponse?.data?.[0]?.embedding) {
              embedding = embeddingResponse.data[0].embedding;
            }
          } catch (embeddingError) {
            console.log(`[Arguments Import] Embedding generation failed for argument ${i + 1}`);
          }
          
          // Insert into database
          await db.execute(
            sql`INSERT INTO arguments (thinker, argument_type, premises, conclusion, topic, source_text_id, importance, embedding)
                VALUES (
                  ${arg.thinker.toLowerCase()},
                  ${arg.argumentType},
                  ${JSON.stringify(arg.premises)}::jsonb,
                  ${arg.conclusion},
                  ${arg.sourceSection || null},
                  ${arg.sourceDocument || null},
                  ${arg.importance || 5},
                  ${embedding ? JSON.stringify(embedding) : null}::vector
                )`
          );
          
          inserted++;
        } catch (insertError) {
          errors.push(`Argument ${i + 1}: ${insertError instanceof Error ? insertError.message : 'Insert failed'}`);
        }
      }
      
      console.log(`[Arguments Import] Inserted ${inserted}/${args.length} arguments`);
      
      res.json({
        success: true,
        inserted,
        total: args.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined
      });
    } catch (error) {
      console.error("Error importing arguments:", error);
      res.status(500).json({ error: "Failed to import arguments" });
    }
  });

  // Get argument count by thinker
  app.get("/api/arguments/stats", async (req, res) => {
    try {
      const result = await db.execute(
        sql`SELECT thinker, COUNT(*) as count FROM arguments GROUP BY thinker ORDER BY count DESC`
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching argument stats:", error);
      res.status(500).json({ error: "Failed to fetch argument stats" });
    }
  });

  // Search arguments by thinker
  app.get("/api/arguments/:thinker", async (req, res) => {
    try {
      const { thinker } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await db.execute(
        sql`SELECT id, thinker, argument_type, premises, conclusion, topic, source_text_id, importance
            FROM arguments 
            WHERE thinker ILIKE ${'%' + thinker + '%'}
            ORDER BY importance DESC
            LIMIT ${limit}`
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching arguments:", error);
      res.status(500).json({ error: "Failed to fetch arguments" });
    }
  });

  // Unified RAG search endpoint
  app.post("/api/search", async (req, res) => {
    try {
      const { query, thinker, limit = 20, includeKeyword = true } = req.body;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query is required" });
      }
      
      const result = await unifiedSearch(query, {
        thinker: thinker || null,
        limit: Math.min(limit, 50),
        includeKeyword,
      });
      
      console.log(`[Unified Search] "${query.slice(0, 50)}..." -> ${result.hits.length} hits (embed: ${result.embeddingTime}ms, search: ${result.searchTime}ms)`);
      
      res.json({
        hits: result.hits,
        citations: formatCitations(result.hits),
        stats: {
          embeddingTime: result.embeddingTime,
          searchTime: result.searchTime,
          totalHits: result.totalHits,
        },
      });
    } catch (error) {
      console.error("Error in unified search:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
