import json
import re
from typing import List, Dict

class KuczynskiInferenceEngine:
    def __init__(self, rules_file='kuczynski_rules_full.json'):
        """Initialize the Kuczynskian inference engine with lazy loading"""
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
            print(f"Kuczynski inference engine loaded: {len(self.rules):,} rules")
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

        # Sort by year (most recent first) if available
        activated.sort(key=lambda r: r.get('year', 2020), reverse=True)
        return activated[:max_rules]

    def format_chain(self, fired_rules: List[Dict]) -> str:
        """Format fired rules into philosophical chain explanation."""
        self._ensure_loaded()

        if not fired_rules:
            return "No specific Kuczynskian rules activated. Proceed with general analytical philosophy principles."

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
        premise = rule.get('premise', '').lower()
        conclusion = rule.get('conclusion', '').lower()
        combined = premise + " " + conclusion

        # Philosophy of Language / Semantics
        if any(term in combined for term in ['proposition', 'meaning', 'semantic', 'reference', 'sense', 'denotation', 'intension']):
            return 'semantic'
        # Epistemology
        elif any(term in combined for term in ['knowledge', 'belief', 'justif', 'a priori', 'apriori', 'epistemic', 'certainty']):
            return 'epistemological'
        # Metaphysics
        elif any(term in combined for term in ['exist', 'being', 'identity', 'property', 'modal', 'possible world', 'essence', 'ontolog']):
            return 'metaphysical'
        # Logic
        elif any(term in combined for term in ['logic', 'valid', 'inference', 'deduct', 'proof', 'theorem', 'axiom', 'incompleteness']):
            return 'logical'
        # Philosophy of Mind
        elif any(term in combined for term in ['mental', 'consciousness', 'intentional', 'thought', 'cognitive', 'mind', 'representation']):
            return 'philosophy of mind'
        # Critique of Russell
        elif any(term in combined for term in ['russell', 'definite description', 'theory of descriptions']):
            return 'anti-Russellian'
        # Critique of Empiricism
        elif any(term in combined for term in ['empiric', 'sense data', 'experience', 'observation', 'induction']):
            return 'rationalist'
        # Psychology / Psychoanalysis
        elif any(term in combined for term in ['psycho', 'unconscious', 'neurosis', 'defense', 'ocd', 'anxiety']):
            return 'psychological'
        # Paradoxes
        elif any(term in combined for term in ['paradox', 'sorites', 'vagueness', 'contradiction']):
            return 'paradox-theoretical'
        else:
            return 'analytical'


engine = None

def get_engine():
    """Get or create singleton inference engine (lazy-loaded)"""
    global engine
    if engine is None:
        engine = KuczynskiInferenceEngine()
    return engine