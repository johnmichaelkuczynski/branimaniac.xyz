import json
import re
from typing import List, Dict

class FreudInferenceEngine:
    def __init__(self, rules_file='freud_rules_full.json'):
        """Initialize the Freudian inference engine with lazy loading"""
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
            print(f"Freud inference engine loaded: {len(self.rules):,} rules")
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
        activated.sort(key=lambda r: r.get('year', 1920), reverse=True)
        return activated[:max_rules]

    def format_chain(self, fired_rules: List[Dict]) -> str:
        """Format fired rules into metapsychological chain explanation."""
        self._ensure_loaded()

        if not fired_rules:
            return "No specific Freudian rules activated. Proceed with general psychoanalytic principles."

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
        """Determine metapsychological viewpoint from rule content"""
        premise = rule.get('premise', '').lower()
        conclusion = rule.get('conclusion', '').lower()
        combined = premise + " " + conclusion

        # Economic viewpoint (energy, cathexis, quantity)
        if any(term in combined for term in ['energy', 'cathex', 'libido', 'quantity', 'excitat', 'discharge', 'tension']):
            return 'economic'
        # Dynamic viewpoint (conflict, force, repression)
        elif any(term in combined for term in ['conflict', 'repress', 'resist', 'defense', 'force', 'drive', 'instinct']):
            return 'dynamic'
        # Topographical viewpoint (conscious, preconscious, unconscious)
        elif any(term in combined for term in ['unconscious', 'preconscious', 'conscious', 'topograph', 'system']):
            return 'topographical'
        # Structural viewpoint (id, ego, superego)
        elif any(term in combined for term in ['ego', 'superego', 'id ', ' id,', 'structural']):
            return 'structural'
        # Genetic/developmental viewpoint
        elif any(term in combined for term in ['oral', 'anal', 'phallic', 'genital', 'oedip', 'develop', 'infantile', 'childhood']):
            return 'genetic'
        # Dream interpretation
        elif any(term in combined for term in ['dream', 'manifest', 'latent', 'wish', 'condensat', 'displac', 'symbol']):
            return 'oneiric'
        # Transference/clinical
        elif any(term in combined for term in ['transfer', 'counter-transfer', 'analys', 'therapeutic', 'cure', 'treatment']):
            return 'clinical'
        # Sexuality
        elif any(term in combined for term in ['sexual', 'pervers', 'homosex', 'hetero', 'inversion', 'erotic']):
            return 'sexual'
        # Anxiety/neurosis
        elif any(term in combined for term in ['anxiety', 'neurosis', 'neurotic', 'hysteri', 'phobia', 'obsess']):
            return 'psychopathological'
        # Death drive
        elif any(term in combined for term in ['death', 'thanatos', 'destruct', 'aggress', 'repetition compulsion']):
            return 'thanatological'
        else:
            return 'metapsychological'


engine = None

def get_engine():
    """Get or create singleton inference engine (lazy-loaded)"""
    global engine
    if engine is None:
        engine = FreudInferenceEngine()
    return engine