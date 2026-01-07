import json
import re
from typing import List, Dict

class KantInferenceEngine:
    def __init__(self, rules_file='kant_rules_full.json'):
        self.rules_file = rules_file
        self.rules = None
        self._loaded = False

    def _ensure_loaded(self):
        if self._loaded:
            return
        try:
            with open(self.rules_file, 'r', encoding='utf-8') as f:
                self.rules = json.load(f)
            print(f"Kant inference engine loaded: {len(self.rules):,} rules")
        except FileNotFoundError:
            print(f"Warning: {self.rules_file} not found. Using empty ruleset.")
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
            chain.append(f"[{topic}]: {rule.get('conclusion', '')}")

        return "\n\n".join(chain)


engine = None

def get_engine():
    global engine
    if engine is None:
        engine = KantInferenceEngine()
    return engine
