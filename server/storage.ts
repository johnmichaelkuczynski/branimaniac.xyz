import {
  users,
  personaSettings,
  goals,
  conversations,
  messages,
  texts,
  positions,
  quotes,
  chunks,
  argumentsTable,
  type User,
  type InsertUser,
  type PersonaSettings,
  type InsertPersonaSettings,
  type Goal,
  type InsertGoal,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Text,
  type InsertText,
  type Position,
  type InsertPosition,
  type Quote,
  type InsertQuote,
  type Chunk,
  type InsertChunk,
  type Argument,
  type InsertArgument,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: Partial<User> & { id: string }): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  createOrGetUserByUsername(username: string): Promise<User>;

  // Persona settings operations
  getPersonaSettings(userId: string): Promise<PersonaSettings | undefined>;
  upsertPersonaSettings(userId: string, settings: InsertPersonaSettings): Promise<PersonaSettings>;

  // Goals operations
  getGoals(userId: string): Promise<Goal[]>;
  createGoal(userId: string, goal: InsertGoal): Promise<Goal>;
  deleteGoal(id: string, userId: string): Promise<void>;

  // Conversation operations
  getCurrentConversation(userId: string): Promise<Conversation | undefined>;
  getAllConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(userId: string, conversation: InsertConversation): Promise<Conversation>;
  migrateUserData(fromUserId: string, toUserId: string): Promise<void>;

  // Message operations
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: string): Promise<void>;

  // Text operations
  getTextsByThinker(thinker: string): Promise<Text[]>;
  createText(text: InsertText): Promise<Text>;

  // Position operations
  getPositionsByThinker(thinker: string): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;

  // Quote operations
  getQuotesByThinker(thinker: string): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;

  // Chunk operations
  getChunksByThinker(thinker: string): Promise<Chunk[]>;
  createChunk(chunk: InsertChunk): Promise<Chunk>;

  // Argument operations
  getArgumentsByThinker(thinker: string): Promise<Argument[]>;
  createArgument(arg: InsertArgument): Promise<Argument>;
}

export class DatabaseStorage implements IStorage {
  async upsertUser(userData: Partial<User> & { id: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createOrGetUserByUsername(username: string): Promise<User> {
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      return existingUser;
    }
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email: `${username}@askaphilosopher.local`,
        firstName: username,
        lastName: null,
        profileImageUrl: null,
      })
      .returning();
    return newUser;
  }

  async getPersonaSettings(userId: string): Promise<PersonaSettings | undefined> {
    const [settings] = await db
      .select()
      .from(personaSettings)
      .where(eq(personaSettings.userId, userId));
    return settings || undefined;
  }

  async upsertPersonaSettings(userId: string, settings: InsertPersonaSettings): Promise<PersonaSettings> {
    const [result] = await db
      .insert(personaSettings)
      .values({ userId, ...settings })
      .onConflictDoUpdate({
        target: personaSettings.userId,
        set: settings,
      })
      .returning();
    return result;
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
  }

  async createGoal(userId: string, goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db
      .insert(goals)
      .values({ userId, ...goal })
      .returning();
    return newGoal;
  }

  async deleteGoal(id: string, userId: string): Promise<void> {
    await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId)));
  }

  async getCurrentConversation(userId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt))
      .limit(1);
    return conversation || undefined;
  }

  async getAllConversations(userId: string): Promise<Conversation[]> {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(userId: string, conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values({ userId, ...conversation })
      .returning();
    return newConversation;
  }

  async migrateUserData(fromUserId: string, toUserId: string): Promise<void> {
    await db
      .update(conversations)
      .set({ userId: toUserId })
      .where(eq(conversations.userId, fromUserId));
    await db
      .update(goals)
      .set({ userId: toUserId })
      .where(eq(goals.userId, fromUserId));
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // Text operations
  async getTextsByThinker(thinker: string): Promise<Text[]> {
    return db.select().from(texts).where(eq(texts.thinker, thinker));
  }

  async createText(text: InsertText): Promise<Text> {
    const [newText] = await db.insert(texts).values(text).returning();
    return newText;
  }

  // Position operations
  async getPositionsByThinker(thinker: string): Promise<Position[]> {
    return db.select().from(positions).where(eq(positions.thinker, thinker));
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const [newPosition] = await db.insert(positions).values(position).returning();
    return newPosition;
  }

  // Quote operations
  async getQuotesByThinker(thinker: string): Promise<Quote[]> {
    return db.select().from(quotes).where(eq(quotes.thinker, thinker));
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db.insert(quotes).values(quote).returning();
    return newQuote;
  }

  // Chunk operations
  async getChunksByThinker(thinker: string): Promise<Chunk[]> {
    return db.select().from(chunks).where(eq(chunks.thinker, thinker));
  }

  async createChunk(chunk: InsertChunk): Promise<Chunk> {
    const [newChunk] = await db.insert(chunks).values(chunk).returning();
    return newChunk;
  }

  // Argument operations
  async getArgumentsByThinker(thinker: string): Promise<Argument[]> {
    return db.select().from(argumentsTable).where(eq(argumentsTable.thinker, thinker));
  }

  async createArgument(arg: InsertArgument): Promise<Argument> {
    const [newArg] = await db.insert(argumentsTable).values(arg).returning();
    return newArg;
  }
}

export const storage = new DatabaseStorage();