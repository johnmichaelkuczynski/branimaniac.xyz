#!/usr/bin/env python3
"""
Generate inference engine files for any thinker from PostgreSQL.

Usage:
    python generate_engine.py freud
    python generate_engine.py nietzsche
    python generate_engine.py --all
"""

import os
import sys
import json
import re
import psycopg2

# Database connection - uses environment variable
DATABASE_URL = os.environ.get('DATABASE_URL')

STOP_WORDS = {
    'the','a','an','is','are','was','were','be','been','being','have','has','had',
    'do','does','did','will','would','could','should','may','might','must','shall',
    'can','need','to','of','in','for','on','with','at','by','from','as','into',
    'through','during','before','after','above','below','between','under','again',
    'further','then','once','here','there','when','where','why','how','all','each',
    'every','both','few','more','most','other','some','such','no','nor','not','only',
    'own','same','so','than','too','very','just','also','now','and','but','if','or',
    'because','until','while','that','which','who','whom','this','these','those',
    'what','its','it','they','their','them','itself','himself','herself','themselves',
    'one','ones','upon','any','even','never','always'
}

ENGINE_TEMPLATE = '''import json
import re
from typing import List, Dict

class {class_name}InferenceEngine:
    def __init__(self, rules_file='{thinker}_rules_full.json'):
        self.rules_file = rules_file
        self.rules = None
        self._loaded = False

    def _ensure_loaded(self):
        if self._loaded:
            return
        try:
            with open(self.rules_file, 'r', encoding='utf-8') as f:
                self.rules = json.load(f)
            print(f"{class_name} inference engine loaded: {{len(self.rules):,}} rules")
        except FileNotFoundError:
            print(f"Warning: {{self.rules_file}} not found. Using empty ruleset.")
            self.rules = []
        self._loaded = True

    def deduce(self, phenomenon: str, max_rules: int = 15) -> List[Dict]:
        self._ensure_loaded()

        if not self.rules:
            return []

        activated = []
        accumulated_text = phenomenon.lower()

        for rule in self.rules:
            premise_pattern = rule.get('premise', '')
            try:
                if re.search(premise_pattern, accumulated_text, re.IGNORECASE):
                    activated.append(rule)
                    conclusion = rule.get('conclusion', '')
                    accumulated_text += " " + conclusion.lower()
            except re.error:
                continue

        return activated[:max_rules]

    def format_chain(self, fired_rules: List[Dict]) -> str:
        self._ensure_loaded()

        if not fired_rules:
            return ""

        chain = []
        for rule in fired_rules:
            topic = rule.get('topic', '')
            chain.append(f"[{{topic}}]: {{rule.get('conclusion', '')}}")

        return "\\n\\n".join(chain)


engine = None

def get_engine():
    global engine
    if engine is None:
        engine = {class_name}InferenceEngine()
    return engine
'''


def make_premise(position_text):
    """Extract keywords from position text for regex premise."""
    text = position_text.lower()
    words = re.findall(r'\b[a-z]{4,}\b', text)
    keywords = []
    seen = set()
    for w in words:
        if w not in STOP_WORDS and w not in seen:
            seen.add(w)
            keywords.append(w)
    return '|'.join(keywords[:6])


def get_positions(thinker):
    """Fetch all positions for a thinker from PostgreSQL."""
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute(
        "SELECT id, thinker, position, topic FROM positions WHERE thinker = %s ORDER BY id",
        (thinker.lower(),)
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {'id': row[0], 'thinker': row[1], 'position': row[2], 'topic': row[3]}
        for row in rows
    ]


def generate_files(thinker):
    """Generate engine.py and rules_full.json for a thinker."""
    thinker_lower = thinker.lower().replace(' ', '_').replace('.', '').replace('-', '_')
    class_name = ''.join(word.capitalize() for word in thinker.replace('-', ' ').replace('.', ' ').split())

    print(f"Fetching positions for {thinker}...")
    positions = get_positions(thinker_lower)

    if not positions:
        print(f"ERROR: No positions found for '{thinker_lower}'")
        print("Available thinkers:")

        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT thinker, COUNT(*) FROM positions GROUP BY thinker ORDER BY COUNT(*) DESC")
        for row in cur.fetchall():
            print(f"  {row[0]}: {row[1]}")
        cur.close()
        conn.close()
        return False

    print(f"Found {len(positions)} positions")

    # Generate rules JSON
    rules = []
    for p in positions:
        rule = {
            "id": p['id'],
            "topic": p['topic'],
            "premise": make_premise(p['position']),
            "conclusion": p['position']
        }
        rules.append(rule)

    rules_filename = f"{thinker_lower}_rules_full.json"
    with open(rules_filename, 'w', encoding='utf-8') as f:
        json.dump(rules, f, indent=2)
    print(f"Created {rules_filename} ({len(rules)} rules)")

    # Generate engine.py
    engine_code = ENGINE_TEMPLATE.format(
        class_name=class_name,
        thinker=thinker_lower
    )

    engine_filename = f"{thinker_lower}_engine.py"
    with open(engine_filename, 'w', encoding='utf-8') as f:
        f.write(engine_code)
    print(f"Created {engine_filename}")

    return True


def list_thinkers():
    """List all thinkers in the database."""
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT thinker, COUNT(*) FROM positions GROUP BY thinker ORDER BY COUNT(*) DESC")

    print("Available thinkers:")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]} positions")

    cur.close()
    conn.close()


def generate_all():
    """Generate files for all thinkers."""
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT thinker FROM positions ORDER BY thinker")
    thinkers = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()

    print(f"Generating files for {len(thinkers)} thinkers...\n")

    for thinker in thinkers:
        generate_files(thinker)
        print()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python generate_engine.py <thinker>    Generate files for one thinker")
        print("  python generate_engine.py --list       List all thinkers")
        print("  python generate_engine.py --all        Generate files for ALL thinkers")
        print()
        print("Examples:")
        print("  python generate_engine.py freud")
        print("  python generate_engine.py nietzsche")
        print("  python generate_engine.py kuczynski")
        sys.exit(1)

    arg = sys.argv[1]

    if arg == '--list':
        list_thinkers()
    elif arg == '--all':
        generate_all()
    else:
        generate_files(arg)
        