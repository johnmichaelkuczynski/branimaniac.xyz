import json
import re
from typing import List, Dict

class NietzscheInferenceEngine:
    def __init__(self, rules_file='nietzsche_rules_full.json'):
        """Initialize the Nietzschean inference engine with lazy loading"""
        self.rules_file = rules_file
        self.rules = None
        self._loaded = False

    def _ensure_loaded(self):
        """Lazy-load rules on first access"""
        if self._loaded:
            return
        try:
            with open(self.rules_file, 'r', encoding='utf-8') as f:
                self.rules = json.load(f)
            print(f"Nietzsche inference engine loaded: {len(self.rules):,} rules")
        except FileNotFoundError:
            print(f"Warning: {self.rules_file} not found. Using empty ruleset.")
            self.rules = []
        self._loaded = True

    def deduce(self, phenomenon: str, max_rules: int = 15) -> List[Dict]:
        """
        Forward-chaining inference over phenomenon.
        Returns list of fired rules with conclusions and metadata.
        """
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

        activated.sort(key=lambda r: r.get('year', 1885), reverse=True)
        return activated[:max_rules]

    def format_chain(self, fired_rules: List[Dict]) -> str:
        """Format fired rules into Nietzschean chain explanation."""
        self._ensure_loaded()

        if not fired_rules:
            return "No specific Nietzschean rules activated. Proceed with general perspectivism."

        chain = []
        for rule in fired_rules:
            viewpoint = self._get_viewpoint(rule)
            year = rule.get('year', '')
            year_str = f" ({year})" if year else ""
            chain.append(
                f"From the {viewpoint} viewpoint{year_str}: {rule.get('conclusion', '')}"
            )

        return "\n\n".join(chain)

    def _get_viewpoint(self, rule: Dict) -> str:
        """Determine philosophical viewpoint from rule content"""
        domain = rule.get('domain', '').lower()

        if domain == 'ethics':
            return 'moral critique'
        elif domain == 'will to power':
            return 'will to power'
        elif domain == 'self-overcoming':
            return 'self-overcoming'
        elif domain == 'religion':
            return 'anti-religious'
        elif domain == 'aesthetics':
            return 'aesthetic'
        elif domain == 'epistemology':
            return 'perspectival'
        elif domain == 'metaphysics':
            return 'metaphysical'
        elif domain == 'psychology':
            return 'psychological'
        elif domain == 'cultural critique':
            return 'cultural critique'
        elif domain == 'zarathustra':
            return 'prophetic'
        else:
            return 'critical'


engine = None

def get_engine():
    """Get or create singleton inference engine (lazy-loaded)"""
    global engine
    if engine is None:
        engine = NietzscheInferenceEngine()
    return engine