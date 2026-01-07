CREATE TABLE "argument_statements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thinker" text NOT NULL,
	"argument_type" text NOT NULL,
	"premises" jsonb NOT NULL,
	"conclusion" text NOT NULL,
	"source_section" text,
	"source_document" text,
	"importance" integer DEFAULT 5 NOT NULL,
	"counterarguments" jsonb,
	"embedding" vector(1536),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auxiliary" (
	"id" integer PRIMARY KEY NOT NULL,
	"author" text NOT NULL,
	"content" text NOT NULL,
	"source" text,
	"topic" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "figure_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"figure_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "figure_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "figures" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"system_prompt" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"verse_text" text,
	"verse_reference" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paper_chunks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"figure_id" varchar NOT NULL,
	"author" text NOT NULL,
	"paper_title" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"chunk_index" integer NOT NULL,
	"position_id" text,
	"domain" text,
	"philosophical_engagements" jsonb,
	"source_work" text,
	"significance" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona_settings" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"response_length" integer DEFAULT 1000 NOT NULL,
	"write_paper" boolean DEFAULT false NOT NULL,
	"quote_frequency" integer DEFAULT 10 NOT NULL,
	"selected_model" text DEFAULT 'zhi5' NOT NULL,
	"enhanced_mode" boolean DEFAULT true NOT NULL,
	"dialogue_mode" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" integer PRIMARY KEY NOT NULL,
	"thinker" text NOT NULL,
	"position" text NOT NULL,
	"topic" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" integer PRIMARY KEY NOT NULL,
	"thinker" text NOT NULL,
	"quote" text NOT NULL,
	"topic" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "text_chunks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thinker" text NOT NULL,
	"source_file" text NOT NULL,
	"chunk_text" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thinker_positions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thinker_id" varchar NOT NULL,
	"thinker_name" varchar NOT NULL,
	"position" text NOT NULL,
	"source" varchar,
	"topic" varchar,
	"category" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "thinker_quotes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thinker_id" text NOT NULL,
	"thinker_name" text NOT NULL,
	"quote" text NOT NULL,
	"topic" text,
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "figure_conversations" ADD CONSTRAINT "figure_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "figure_conversations" ADD CONSTRAINT "figure_conversations_figure_id_figures_id_fk" FOREIGN KEY ("figure_id") REFERENCES "public"."figures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "figure_messages" ADD CONSTRAINT "figure_messages_conversation_id_figure_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."figure_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_chunks" ADD CONSTRAINT "paper_chunks_figure_id_figures_id_fk" FOREIGN KEY ("figure_id") REFERENCES "public"."figures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_settings" ADD CONSTRAINT "persona_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "argument_statements_thinker_idx" ON "argument_statements" USING btree ("thinker");--> statement-breakpoint
CREATE INDEX "argument_statements_type_idx" ON "argument_statements" USING btree ("argument_type");--> statement-breakpoint
CREATE INDEX "argument_statements_importance_idx" ON "argument_statements" USING btree ("importance");--> statement-breakpoint
CREATE INDEX "auxiliary_author_idx" ON "auxiliary" USING btree ("author");--> statement-breakpoint
CREATE INDEX "paper_chunks_figure_idx" ON "paper_chunks" USING btree ("figure_id");--> statement-breakpoint
CREATE INDEX "paper_chunks_author_idx" ON "paper_chunks" USING btree ("author");--> statement-breakpoint
CREATE INDEX "paper_chunks_position_idx" ON "paper_chunks" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "paper_chunks_domain_idx" ON "paper_chunks" USING btree ("domain");--> statement-breakpoint
CREATE UNIQUE INDEX "paper_chunks_unique_idx" ON "paper_chunks" USING btree ("figure_id","paper_title","chunk_index");--> statement-breakpoint
CREATE INDEX "positions_thinker_idx" ON "positions" USING btree ("thinker");--> statement-breakpoint
CREATE INDEX "quotes_thinker_idx" ON "quotes" USING btree ("thinker");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "text_chunks_thinker_idx" ON "text_chunks" USING btree ("thinker");--> statement-breakpoint
CREATE UNIQUE INDEX "text_chunks_unique_idx" ON "text_chunks" USING btree ("thinker","source_file","chunk_index");--> statement-breakpoint
CREATE INDEX "thinker_positions_thinker_idx" ON "thinker_positions" USING btree ("thinker_id");--> statement-breakpoint
CREATE INDEX "thinker_positions_topic_idx" ON "thinker_positions" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "thinker_positions_category_idx" ON "thinker_positions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "thinker_quotes_thinker_idx" ON "thinker_quotes" USING btree ("thinker_id");--> statement-breakpoint
CREATE INDEX "thinker_quotes_topic_idx" ON "thinker_quotes" USING btree ("topic");--> statement-breakpoint
CREATE UNIQUE INDEX "thinker_quotes_unique_idx" ON "thinker_quotes" USING btree ("thinker_id","quote");