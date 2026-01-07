#!/usr/bin/env python3
"""
Generic text ingestion script for inserting text chunks into the database.

Usage:
    python scripts/ingest_generic_text.py --file PATH --thinker "Thinker Name" --source "Source Title" [--thinker-id THINKER_ID]

Example:
    python scripts/ingest_generic_text.py --file darwin-texts/Origin.txt --thinker "Charles Darwin" --source "Origin of Species" --thinker-id charles_darwin
"""

import argparse
import os
import sys
import psycopg2
from psycopg2.extras import execute_values

def chunk_text(text: str, max_chunk_size: int = 4000, overlap: int = 200) -> list:
    """Split text into chunks with overlap, respecting paragraph boundaries."""
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
            
        if len(current_chunk) + len(para) + 2 <= max_chunk_size:
            if current_chunk:
                current_chunk += "\n\n" + para
            else:
                current_chunk = para
        else:
            if current_chunk and len(current_chunk) >= 100:
                chunks.append(current_chunk)
            if len(para) > max_chunk_size:
                words = para.split()
                current_chunk = ""
                for word in words:
                    if len(current_chunk) + len(word) + 1 <= max_chunk_size:
                        current_chunk = current_chunk + " " + word if current_chunk else word
                    else:
                        if current_chunk:
                            chunks.append(current_chunk)
                        current_chunk = word
            else:
                current_chunk = para
    
    if current_chunk and len(current_chunk) >= 100:
        chunks.append(current_chunk)
    
    return chunks

def normalize_thinker_id(name: str) -> str:
    """Convert thinker name to a normalized ID."""
    return name.lower().replace(' ', '_').replace('-', '_').replace('.', '')

def main():
    parser = argparse.ArgumentParser(description='Ingest text file into text_chunks table')
    parser.add_argument('--file', '-f', required=True, help='Path to text file')
    parser.add_argument('--thinker', '-t', required=True, help='Thinker name (e.g., "Charles Darwin")')
    parser.add_argument('--source', '-s', required=True, help='Source title (e.g., "Origin of Species")')
    parser.add_argument('--thinker-id', '-i', help='Thinker ID (defaults to normalized name)')
    parser.add_argument('--chunk-size', '-c', type=int, default=4000, help='Max chunk size (default: 4000)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}")
        sys.exit(1)
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    thinker_id = args.thinker_id or normalize_thinker_id(args.thinker)
    
    print(f"Reading file: {args.file}")
    with open(args.file, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    
    print(f"Chunking text (max size: {args.chunk_size})...")
    chunks = chunk_text(text, max_chunk_size=args.chunk_size)
    print(f"Created {len(chunks)} chunks")
    
    print(f"Connecting to database...")
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'text_chunks'
        )
    """)
    if not cur.fetchone()[0]:
        print("Creating text_chunks table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS text_chunks (
                id SERIAL PRIMARY KEY,
                thinker VARCHAR(255) NOT NULL,
                thinker_name VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                source VARCHAR(500),
                chunk_index INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_text_chunks_thinker ON text_chunks(thinker)")
        conn.commit()
    
    print(f"Inserting chunks for {args.thinker} ({thinker_id})...")
    
    values = [
        (thinker_id, args.thinker, chunk, args.source, i)
        for i, chunk in enumerate(chunks)
    ]
    
    execute_values(
        cur,
        """
        INSERT INTO text_chunks (thinker, thinker_name, content, source, chunk_index)
        VALUES %s
        ON CONFLICT DO NOTHING
        """,
        values
    )
    
    conn.commit()
    
    cur.execute("SELECT COUNT(*) FROM text_chunks WHERE thinker = %s", (thinker_id,))
    total = cur.fetchone()[0]
    
    cur.close()
    conn.close()
    
    print(f"Done! {len(chunks)} chunks inserted.")
    print(f"Total chunks for {args.thinker}: {total}")

if __name__ == '__main__':
    main()
