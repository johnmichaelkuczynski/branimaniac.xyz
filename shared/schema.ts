import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
  vector,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* =========================================================
   AUTH + APP TABLES (REPLIT AUTH)
   ========================================================= */

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const personaSettings = pgTable("persona_settings", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  responseLength: integer("response_length").notNull().default(1000),
  writePaper: boolean("write_paper").notNull().default(false),
  quoteFrequency: integer("quote_frequency").notNull().default(10),
  selectedModel: text("selected_model").notNull().default("zhi5"),
  enhancedMode: boolean("enhanced_mode").notNull().default(true),
  dialogueMode: boolean("dialogue_mode").notNull().default(false),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================================================
   CORE PHILOSOPHY DATABASE (NO REDUNDANCY)
   ========================================================= */

/**
 * TEXTS
 * One row per primary source file or work.
 */
export const texts = pgTable(
  "texts",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    thinker: text("thinker").notNull(), // "freud", "russell", "kuczynski"
    title: text("title").notNull(),
    sourceFile: text("source_file").notNull(), // filename or canonical id
    content: text("content").notNull(), // full text
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("texts_thinker_idx").on(table.thinker),
    uniqueIndex("texts_unique_idx").on(table.thinker, table.sourceFile),
  ],
);

/**
 * POSITIONS
 * Verified curated positions (short structured statements).
 */
export const positions = pgTable(
  "positions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    thinker: text("thinker").notNull(),
    topic: text("topic"),
    positionText: text("position_text").notNull(),
    sourceTextId: varchar("source_text_id").references(() => texts.id, {
      onDelete: "set null",
    }),
    embedding: vector("embedding", { dimensions: 1536 }),
    searchVector: text("search_vector"), // tsvector stored as text, cast in queries
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("positions_thinker_idx").on(table.thinker),
    index("positions_topic_idx").on(table.topic),
  ],
);

/**
 * ARGUMENTS
 * Structured arguments: premises + conclusion.
 */
export const argumentsTable = pgTable(
  "arguments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    thinker: text("thinker").notNull(),
    argumentType: text("argument_type").notNull(), // deductive/causal/etc
    premises: jsonb("premises").notNull().$type<string[]>(),
    conclusion: text("conclusion").notNull(),
    topic: text("topic"),
    sourceTextId: varchar("source_text_id").references(() => texts.id, {
      onDelete: "set null",
    }),
    importance: integer("importance").notNull().default(5), // 1–10
    embedding: vector("embedding", { dimensions: 1536 }),
    searchVector: text("search_vector"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("arguments_thinker_idx").on(table.thinker),
    index("arguments_type_idx").on(table.argumentType),
    index("arguments_importance_idx").on(table.importance),
  ],
);

/**
 * QUOTES
 * Clean quote table. One quote = one row.
 */
export const quotes = pgTable(
  "quotes",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    thinker: text("thinker").notNull(),
    quoteText: text("quote_text").notNull(),
    topic: text("topic"),
    sourceTextId: varchar("source_text_id").references(() => texts.id, {
      onDelete: "set null",
    }),
    embedding: vector("embedding", { dimensions: 1536 }),
    searchVector: text("search_vector"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("quotes_thinker_idx").on(table.thinker),
    index("quotes_topic_idx").on(table.topic),
    uniqueIndex("quotes_unique_idx").on(table.thinker, table.quoteText),
  ],
);

/**
 * CHUNKS (RAG)
 * ONE chunk table only.
 * Includes embeddings for semantic search.
 */
export const chunks = pgTable(
  "chunks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

    thinker: text("thinker").notNull(),
    sourceTextId: varchar("source_text_id")
      .notNull()
      .references(() => texts.id, { onDelete: "cascade" }),

    chunkIndex: integer("chunk_index").notNull(),
    chunkText: text("chunk_text").notNull(),

    embedding: vector("embedding", { dimensions: 1536 }),
    searchVector: text("search_vector"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("chunks_thinker_idx").on(table.thinker),
    index("chunks_text_idx").on(table.sourceTextId),
    uniqueIndex("chunks_unique_idx").on(table.sourceTextId, table.chunkIndex),
  ],
);

/* =========================================================
   RELATIONS (APP)
   ========================================================= */

export const usersRelations = relations(users, ({ one, many }) => ({
  personaSettings: one(personaSettings, {
    fields: [users.id],
    references: [personaSettings.userId],
  }),
  goals: many(goals),
  conversations: many(conversations),
}));

export const personaSettingsRelations = relations(personaSettings, ({ one }) => ({
  user: one(users, {
    fields: [personaSettings.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

/* =========================================================
   ZOD INSERT SCHEMAS
   ========================================================= */

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPersonaSettingsSchema = createInsertSchema(personaSettings)
  .omit({ userId: true })
  .extend({
    responseLength: z.number().int().min(0).optional(),
    writePaper: z.boolean().optional(),
    quoteFrequency: z.number().int().min(0).max(50).optional(),
    enhancedMode: z.boolean().optional(),
    dialogueMode: z.boolean().optional(),
  });

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertTextSchema = createInsertSchema(texts).omit({
  id: true,
  createdAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
});

export const insertArgumentSchema = createInsertSchema(argumentsTable)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    importance: z.number().int().min(1).max(10).optional(),
    premises: z.array(z.string()),
  });

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export const insertChunkSchema = createInsertSchema(chunks).omit({
  id: true,
  createdAt: true,
  embedding: true,
});

/* =========================================================
   TYPES
   ========================================================= */

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PersonaSettings = typeof personaSettings.$inferSelect;
export type InsertPersonaSettings = z.infer<typeof insertPersonaSettingsSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Text = typeof texts.$inferSelect;
export type InsertText = z.infer<typeof insertTextSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Argument = typeof argumentsTable.$inferSelect;
export type InsertArgument = z.infer<typeof insertArgumentSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type Chunk = typeof chunks.$inferSelect;
export type InsertChunk = z.infer<typeof insertChunkSchema>;

// Virtual types for UI (not stored in database - derived from thinker data)
export interface Figure {
  id: string;
  name: string;
  title?: string;
  icon?: string;
  description?: string;
}

export interface FigureMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}
