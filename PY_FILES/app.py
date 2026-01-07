# Ask a Philosopher - Main Application
# Adapted from FreudGPT architecture with PostgreSQL backend

from gevent import monkey
monkey.patch_all()

from flask import Flask, render_template, request, Response, jsonify, session
import json
import os
import time
import re
import gevent
from gevent import queue as gevent_queue
import psycopg2

# Import inference engines (add more as they're created)
from kuczynski_engine import get_engine as get_kuczynski_engine
# from freud_engine import get_engine as get_freud_engine
# from hume_engine import get_engine as get_hume_engine
# from nietzsche_engine import get_engine as get_nietzsche_engine
# ... add all 53 thinkers

try:
    from anthropic import Anthropic
except ImportError:
    print("Anthropic library not found")
    Anthropic = None

try:
    from openai import OpenAI
except ImportError:
    print("OpenAI library not found")
    OpenAI = None

app = Flask(__name__)
app.secret_key = os.environ.get('SESSION_SECRET', os.urandom(24))

DATABASE_URL = os.environ.get('DATABASE_URL')

# Initialize inference engines (lazy-loaded)
INFERENCE_ENGINES = {
    'kuczynski': get_kuczynski_engine,
    # Add more as engines are created:
    # 'freud': get_freud_engine,
    # 'hume': get_hume_engine,
    # 'nietzsche': get_nietzsche_engine,
    # 'jung': get_jung_engine,
    # 'aristotle': get_aristotle_engine,
    # ... all 53 thinkers
}

# Thinker display names
THINKER_NAMES = {
    'kuczynski': 'J.-M. Kuczynski',
    'freud': 'Sigmund Freud',
    'jung': 'Carl Gustav Jung',
    'hume': 'David Hume',
    'nietzsche': 'Friedrich Nietzsche',
    'aristotle': 'Aristotle',
    'plato': 'Plato',
    'kant': 'Immanuel Kant',
    'descartes': 'René Descartes',
    'spinoza': 'Baruch Spinoza',
    'leibniz': 'Gottfried Wilhelm Leibniz',
    'locke': 'John Locke',
    'berkeley': 'George Berkeley',
    'russell': 'Bertrand Russell',
    'hegel': 'G.W.F. Hegel',
    'schopenhauer': 'Arthur Schopenhauer',
    'marx': 'Karl Marx',
    'engels': 'Friedrich Engels',
    'mill': 'John Stuart Mill',
    'bacon': 'Francis Bacon',
    'hobbes': 'Thomas Hobbes',
    'rousseau': 'Jean-Jacques Rousseau',
    'voltaire': 'Voltaire',
    'sartre': 'Jean-Paul Sartre',
    'james': 'William James',
    'dewey': 'John Dewey',
    'peirce': 'Charles Sanders Peirce',
    'popper': 'Karl Popper',
    'darwin': 'Charles Darwin',
    'newton': 'Isaac Newton',
    'galileo': 'Galileo',
    'confucius': 'Confucius',
    'machiavelli': 'Niccolò Machiavelli',
    'tocqueville': 'Alexis de Tocqueville',
    'gibbon': 'Edward Gibbon',
    'bergson': 'Henri Bergson',
    'poincare': 'Henri Poincaré',
    'spencer': 'Herbert Spencer',
    'veblen': 'Thorstein Veblen',
    'mises': 'Ludwig von Mises',
    'adler': 'Alfred Adler',
    'reich': 'Wilhelm Reich',
    'stekel': 'Wilhelm Stekel',
    'bergler': 'Edmund Bergler',
    'lebon': 'Gustave Le Bon',
    'dworkin': 'Andrea Dworkin',
    'goldman': 'Emma Goldman',
    'lenin': 'Vladimir Lenin',
    'luther': 'Martin Luther',
    'maimonides': 'Moses Maimonides',
    'larochefoucauld': 'François de La Rochefoucauld',
    'whewell': 'William Whewell',
    'marden': 'Orison Swett Marden',
    'aesop': 'Aesop',
    'smith': 'Adam Smith',
    'allen': 'ALLEN',
}

# API clients
anthropic_client = None
openai_client = None

try:
    ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
    if ANTHROPIC_API_KEY and Anthropic:
        anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)
        print("✓ Anthropic client initialized")
except Exception as e:
    print(f"✗ Could not initialize Anthropic: {e}")

try:
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
    if OPENAI_API_KEY and OpenAI:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print("✓ OpenAI client initialized")
except Exception as e:
    print(f"✗ Could not initialize OpenAI: {e}")


def get_db_connection():
    """Get PostgreSQL connection"""
    return psycopg2.connect(DATABASE_URL)


def get_thinker_list():
    """Get list of all thinkers from database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT thinker, COUNT(*) FROM positions GROUP BY thinker ORDER BY thinker")
        thinkers = [{'id': row[0], 'name': THINKER_NAMES.get(row[0], row[0].capitalize()), 'count': row[1]} for row in cur.fetchall()]
        cur.close()
        conn.close()
        return thinkers
    except Exception as e:
        print(f"Error getting thinker list: {e}")
        return []


def search_positions(question, thinker, top_k=15):
    """Search positions from PostgreSQL using full-text search"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Extract keywords
        words = re.findall(r'\b\w{3,}\b', question.lower())
        stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'his', 'has', 'have', 'with', 'they', 'this', 'from', 'that', 'what', 'how', 'why', 'when', 'where', 'which', 'who', 'does', 'your'}
        keywords = [w for w in words if w not in stop_words][:10]

        if not keywords:
            cur.close()
            conn.close()
            return []

        tsquery = ' | '.join(keywords)

        query = """
            SELECT id, thinker, position, topic,
                   ts_rank(to_tsvector('english', position || ' ' || COALESCE(topic, '')), to_tsquery('english', %s)) as rank
            FROM positions
            WHERE thinker = %s
              AND to_tsvector('english', position || ' ' || COALESCE(topic, '')) @@ to_tsquery('english', %s)
            ORDER BY rank DESC
            LIMIT %s
        """

        cur.execute(query, (tsquery, thinker, tsquery, top_k))
        rows = cur.fetchall()

        positions = []
        for row in rows:
            positions.append({
                'position_id': f"PG-{row[0]}",
                'text': row[2],
                'title': row[3] or '',
                'domain': row[3] or 'General',
                'similarity': float(row[4]) if row[4] else 0.5,
                'source': ['PostgreSQL']
            })

        cur.close()
        conn.close()

        print(f"📊 Found {len(positions)} positions for '{thinker}' (keywords: {keywords[:5]})")
        return positions

    except Exception as e:
        print(f"PostgreSQL search error: {e}")
        return []


def search_quotes(question, thinker, top_k=5):
    """Search quotes from PostgreSQL"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        words = re.findall(r'\b\w{3,}\b', question.lower())
        stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'his', 'has', 'have', 'with', 'they', 'this', 'from', 'that', 'what', 'how', 'why', 'when', 'where', 'which', 'who', 'does', 'your'}
        keywords = [w for w in words if w not in stop_words][:10]

        if not keywords:
            cur.close()
            conn.close()
            return []

        tsquery = ' | '.join(keywords)

        query = """
            SELECT id, thinker, quote, topic,
                   ts_rank(to_tsvector('english', quote || ' ' || COALESCE(topic, '')), to_tsquery('english', %s)) as rank
            FROM quotes
            WHERE thinker = %s
              AND to_tsvector('english', quote || ' ' || COALESCE(topic, '')) @@ to_tsquery('english', %s)
            ORDER BY rank DESC
            LIMIT %s
        """

        cur.execute(query, (tsquery, thinker, tsquery, top_k))
        rows = cur.fetchall()

        quotes = []
        for row in rows:
            quotes.append({
                'position_id': f"QUOTE-{row[0]}",
                'text': row[2],
                'title': row[3] or '',
                'domain': 'Quote',
                'similarity': float(row[4]) if row[4] else 0.5,
                'source': ['PostgreSQL Quotes']
            })

        cur.close()
        conn.close()
        return quotes

    except Exception as e:
        print(f"PostgreSQL quotes search error: {e}")
        return []


def search_text_chunks(question, thinker, top_k=5):
    """RAG: Search text_chunks for source text"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        words = re.findall(r'\b\w{3,}\b', question.lower())
        stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'his', 'has', 'have', 'with', 'they', 'this', 'from', 'that', 'what', 'how', 'why', 'when', 'where', 'which', 'who', 'does', 'your'}
        keywords = [w for w in words if w not in stop_words][:10]

        if not keywords:
            cur.close()
            conn.close()
            return []

        tsquery = ' | '.join(keywords)

        query = """
            SELECT source_file, chunk_text, chunk_index,
                   ts_rank(to_tsvector('english', chunk_text), to_tsquery('english', %s)) as rank
            FROM texts
            WHERE thinker = %s
              AND to_tsvector('english', chunk_text) @@ to_tsquery('english', %s)
            ORDER BY rank DESC
            LIMIT %s
        """

        cur.execute(query, (tsquery, thinker, tsquery, top_k))
        rows = cur.fetchall()

        chunks = []
        for row in rows:
            chunks.append({
                'source_file': row[0],
                'chunk_text': row[1],
                'chunk_index': row[2],
                'relevance': float(row[3])
            })

        cur.close()
        conn.close()
        return chunks

    except Exception as e:
        print(f"RAG search error: {e}")
        return []


def get_inference_engine(thinker):
    """Get inference engine for a thinker if available"""
    if thinker in INFERENCE_ENGINES:
        try:
            return INFERENCE_ENGINES[thinker]()
        except Exception as e:
            print(f"Could not load inference engine for {thinker}: {e}")
    return None


def build_prompt(question, positions, thinker, deduced_rules=None, answer_length=500, rag_chunks=None):
    """Build prompt with inference deductions and retrieved positions"""

    if deduced_rules is None:
        deduced_rules = []
    if rag_chunks is None:
        rag_chunks = []

    thinker_name = THINKER_NAMES.get(thinker, thinker.capitalize())

    # Build deduction section if rules were fired
    deduction_section = ""
    if deduced_rules:
        formatted_deductions = []
        for rule in deduced_rules:
            year = rule.get('year', '?')
            conclusion = rule.get('conclusion', '')
            domain = rule.get('domain', 'general')
            formatted_deductions.append(f"[{domain}] ({year}): {conclusion}")

        deduction_section = f"""
INFERENCE ENGINE DEDUCTIONS:
The following principles have been automatically deduced from your question. These form the theoretical backbone of your response:

{chr(10).join(formatted_deductions)}

INSTRUCTION: These deductions are the foundation for your response. Build your analysis upon them.

"""

    # Format positions
    excerpts = "\n\n---\n\n".join([
        f"[{p.get('domain', 'General')}] {p.get('title', '')}\n{p.get('text', '')}"
        for p in positions
    ])

    # RAG section
    rag_section = ""
    if rag_chunks:
        rag_texts = []
        for chunk in rag_chunks:
            rag_texts.append(f"[Source: {chunk['source_file']}]\n{chunk['chunk_text']}")
        rag_section = f"""

PRIMARY SOURCE TEXTS:
{chr(10).join(['---' + chr(10) + t for t in rag_texts])}

"""

    prompt = f"""You are {thinker_name} answering a philosophical question.

{deduction_section}RETRIEVED POSITIONS FROM YOUR WRITINGS:
{excerpts}
{rag_section}
RESPONSE REQUIREMENTS:
- Minimum length: {answer_length} words
- Draw primarily from the retrieved positions above
- Quote directly when possible
- Maintain philosophical rigor and depth

Question: {question}

{thinker_name}:"""

    return prompt


@app.route('/')
def index():
    return jsonify({'status': 'ok', 'endpoints': ['/api/ask', '/api/thinkers']})


@app.route('/api/thinkers', methods=['GET'])
def get_thinkers():
    """Return list of available thinkers"""
    thinkers = get_thinker_list()
    return jsonify({'thinkers': thinkers})


@app.route('/api/ask', methods=['POST'])
def ask():
    """Main query endpoint with streaming response"""
    data = request.get_json()
    question = data.get('question', '')
    thinker = data.get('thinker', 'kuczynski').lower()
    answer_length = int(data.get('answer_length', 500))
    provider = data.get('provider', 'anthropic')

    if not question:
        return jsonify({'error': 'Question required'}), 400

    def generate():
        event_queue = gevent_queue.Queue()
        streaming_done = [False]

        def content_worker():
            try:
                # Search for relevant positions
                positions = search_positions(question, thinker, top_k=15)
                quotes = search_quotes(question, thinker, top_k=5)
                positions.extend(quotes)
                rag_chunks = search_text_chunks(question, thinker, top_k=5)

                # Run inference engine if available
                deduced_rules = []
                engine = get_inference_engine(thinker)
                if engine:
                    print(f"🧠 Activating {thinker} inference engine...")
                    deduced_rules = engine.deduce(question, max_rules=15)
                    print(f"✓ Fired {len(deduced_rules)} inference rules")

                # Send sources
                sources = [p['position_id'] for p in positions]
                event_queue.put(f"data: {json.dumps({'type': 'sources', 'data': sources})}\n\n")

                # Build prompt
                prompt = build_prompt(question, positions, thinker, deduced_rules, answer_length, rag_chunks)
                thinker_name = THINKER_NAMES.get(thinker, thinker.capitalize())

                sys_prompt = f"""You are {thinker_name}. Respond in first person as this philosopher.
Your response MUST be at least {answer_length} words.
Draw from the retrieved positions and inference deductions provided."""

                # Stream from AI provider
                if provider == 'anthropic' and anthropic_client:
                    with anthropic_client.messages.stream(
                        model="claude-sonnet-4-20250514",
                        max_tokens=8000,
                        system=sys_prompt,
                        messages=[{"role": "user", "content": prompt}]
                    ) as stream:
                        for text in stream.text_stream:
                            event_queue.put(f"data: {json.dumps({'type': 'token', 'data': text})}\n\n")

                elif provider == 'openai' and openai_client:
                    stream = openai_client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": sys_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        stream=True,
                        max_tokens=8000
                    )
                    for chunk in stream:
                        if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                            content = chunk.choices[0].delta.content
                            event_queue.put(f"data: {json.dumps({'type': 'token', 'data': content})}\n\n")

                event_queue.put(f"data: {json.dumps({'type': 'done'})}\n\n")

            except Exception as e:
                print(f"Error in content worker: {e}")
                event_queue.put(f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n")
            finally:
                streaming_done[0] = True

        def heartbeat_worker():
            count = 0
            while not streaming_done[0]:
                gevent.sleep(5)
                if not streaming_done[0]:
                    count += 1
                    event_queue.put(f": keepalive {count}\n\n")

        # Start workers
        gevent.spawn(heartbeat_worker)
        gevent.spawn(content_worker)

        # Yield events
        while True:
            try:
                event = event_queue.get(timeout=30)
                yield event
                if '"type": "done"' in event or '"type": "error"' in event:
                    break
            except gevent_queue.Empty:
                if streaming_done[0]:
                    break
                yield ": timeout keepalive\n\n"

    return Response(generate(), mimetype='text/event-stream')


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print("\n" + "="*60)
    print("  Ask a Philosopher - Multi-Thinker AI Assistant")
    print("="*60)
    print(f"  Server starting on http://0.0.0.0:{port}")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', port=port, debug=False)
    