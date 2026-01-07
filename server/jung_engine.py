import json
import re
from typing import List, Dict

class JungInferenceEngine:
    def __init__(self, rules_file='jung_rules_full.json'):
        """Initialize the Jungian inference engine with lazy loading"""
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
            print(f"Jung inference engine loaded: {len(self.rules):,} rules")
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
        activated.sort(key=lambda r: r.get('year', 1935), reverse=True)
        return activated[:max_rules]

    def format_chain(self, fired_rules: List[Dict]) -> str:
        """Format fired rules into analytical psychology chain explanation."""
        self._ensure_loaded()

        if not fired_rules:
            return "No specific Jungian rules activated. Proceed with general analytical psychology principles."

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
        """Determine analytical psychology viewpoint from rule content"""
        premise = rule.get('premise', '').lower()
        conclusion = rule.get('conclusion', '').lower()
        combined = premise + " " + conclusion

        # Archetypal
        if any(term in combined for term in ['archetype', 'archetypal', 'anima', 'animus', 'shadow', 'wise old', 'great mother', 'hero', 'trickster']):
            return 'archetypal'
        # Collective unconscious
        elif any(term in combined for term in ['collective unconscious', 'collective', 'universal', 'inherited', 'phylogenetic']):
            return 'collective'
        # Individuation
        elif any(term in combined for term in ['individuation', 'self-realization', 'wholeness', 'integration', 'self ']):
            return 'individuation'
        # Typological
        elif any(term in combined for term in ['introvert', 'extravert', 'thinking', 'feeling', 'sensation', 'intuition', 'type', 'attitude']):
            return 'typological'
        # Complex
        elif any(term in combined for term in ['complex', 'father complex', 'mother complex', 'feeling-toned']):
            return 'complex'
        # Symbolic
        elif any(term in combined for term in ['symbol', 'symbolic', 'image', 'mandala', 'myth', 'fairy tale', 'alchemical']):
            return 'symbolic'
        # Dreams
        elif any(term in combined for term in ['dream', 'vision', 'fantasy', 'active imagination']):
            return 'oneiric'
        # Psychopathology
        elif any(term in combined for term in ['neurosis', 'psychosis', 'dissociation', 'inflation', 'possession']):
            return 'psychopathological'
        # Religious/spiritual
        elif any(term in combined for term in ['religious', 'spiritual', 'numinous', 'god', 'transcendent']):
            return 'religious'
        # Therapeutic
        elif any(term in combined for term in ['analysis', 'therapy', 'transference', 'analyst', 'patient']):
            return 'clinical'
        else:
            return 'analytical'


engine = None

def get_engine():
    """Get or create singleton inference engine (lazy-loaded)"""
    global engine
    if engine is None:
        engine = JungInferenceEngine()
    return engine