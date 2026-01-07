import os
import psycopg2
from datetime import datetime

INGEST_FOLDER = "data/ingest"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 100

def get_db_connection():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise Exception("DATABASE_URL not found in environment variables")
    return psycopg2.connect(database_url)

def parse_filename(filename):
    name = filename.rsplit('.', 1)[0]
    if '_' not in name:
        raise ValueError(f"Invalid filename format: {filename}. Expected THINKER_Title.txt")
    parts = name.split('_', 1)
    thinker = parts[0].lower()
    return thinker

def get_file_type(filename):
    lower = filename.lower()
    if '_positions_' in lower:
        return 'positions'
    elif '_quotes_' in lower:
        return 'quotes'
    else:
        return 'texts'

def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk.strip())
        start = end - overlap
    return [c for c in chunks if c]

def extract_pipe_delimited(text):
    """Extract pipe-delimited entries: thinker | content | topic"""
    lines = text.split('\n')
    entries = []

    for line in lines:
        line = line.strip()
        if not line or ' | ' not in line:
            continue

        parts = line.split(' | ')
        if len(parts) >= 2:
            thinker = parts[0].strip()
            content = parts[1].strip()
            topic = parts[2].strip() if len(parts) >= 3 else None
            entries.append({
                'thinker': thinker,
                'content': content,
                'topic': topic
            })

    return entries

def ingest_positions_file(filepath, conn):
    """Ingest into thinker_positions table"""
    filename = os.path.basename(filepath)
    print(f"Processing POSITIONS: {filename}")
    thinker_from_filename = parse_filename(filename)
    print(f"  Thinker (from filename): {thinker_from_filename}")

    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    entries = extract_pipe_delimited(text)
    print(f"  Positions found: {len(entries)}")

    cursor = conn.cursor()
    for e in entries:
        thinker_id = e.get('thinker') or thinker_from_filename
        thinker_name = thinker_id.replace('-', ' ').replace('_', ' ').title()
        cursor.execute("""
            INSERT INTO thinker_positions (thinker_id, thinker_name, position, topic, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (thinker_id, thinker_name, e['content'], e['topic'], datetime.now()))

    conn.commit()
    cursor.close()
    print(f"  Inserted {len(entries)} positions into thinker_positions table.")

    os.remove(filepath)
    print(f"  Deleted: {filename}")

def ingest_quotes_file(filepath, conn):
    """Ingest into thinker_quotes table"""
    filename = os.path.basename(filepath)
    print(f"Processing QUOTES: {filename}")
    thinker_from_filename = parse_filename(filename)
    print(f"  Thinker (from filename): {thinker_from_filename}")

    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    entries = extract_pipe_delimited(text)
    print(f"  Quotes found: {len(entries)}")

    cursor = conn.cursor()
    for e in entries:
        thinker_id = e.get('thinker') or thinker_from_filename
        thinker_name = thinker_id.replace('-', ' ').replace('_', ' ').title()
        cursor.execute("""
            INSERT INTO thinker_quotes (thinker_id, thinker_name, quote, topic, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (thinker_id, thinker_name, e['content'], e['topic'], datetime.now()))

    conn.commit()
    cursor.close()
    print(f"  Inserted {len(entries)} quotes into thinker_quotes table.")

    os.remove(filepath)
    print(f"  Deleted: {filename}")

def ingest_texts_file(filepath, conn):
    """Ingest into text_chunks table"""
    filename = os.path.basename(filepath)
    print(f"Processing TEXTS: {filename}")
    thinker = parse_filename(filename)
    name = filename.rsplit('.', 1)[0]
    parts = name.split('_', 1)
    source_file = parts[1] if len(parts) > 1 else name
    print(f"  Thinker: {thinker}")
    print(f"  Source: {source_file}")

    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    chunks = chunk_text(text)
    print(f"  Chunks: {len(chunks)}")

    cursor = conn.cursor()
    for index, chunk_text_content in enumerate(chunks):
        cursor.execute("""
            INSERT INTO text_chunks (thinker, source_file, chunk_text, chunk_index, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (thinker, source_file, chunk_index) DO NOTHING
        """, (thinker, source_file, chunk_text_content, index, datetime.now()))

    conn.commit()
    cursor.close()
    print(f"  Inserted {len(chunks)} chunks into text_chunks table.")

    os.remove(filepath)
    print(f"  Deleted: {filename}")

def ingest_file(filepath, conn):
    filename = os.path.basename(filepath)
    file_type = get_file_type(filename)

    if file_type == 'positions':
        ingest_positions_file(filepath, conn)
    elif file_type == 'quotes':
        ingest_quotes_file(filepath, conn)
    else:
        ingest_texts_file(filepath, conn)

def main():
    if not os.path.exists(INGEST_FOLDER):
        print(f"Creating ingest folder: {INGEST_FOLDER}")
        os.makedirs(INGEST_FOLDER)
        print("Drop files here and run this script again.")
        return

    files = [f for f in os.listdir(INGEST_FOLDER) if '_' in f]
    if not files:
        print(f"No files found in {INGEST_FOLDER}")
        return

    print(f"Found {len(files)} file(s) to process.\n")
    conn = get_db_connection()

    try:
        for filename in files:
            filepath = os.path.join(INGEST_FOLDER, filename)
            try:
                ingest_file(filepath, conn)
                print()
            except Exception as e:
                print(f"  ERROR: {e}")
                print()
    finally:
        conn.close()

    print("Done.")

if __name__ == "__main__":
    main()