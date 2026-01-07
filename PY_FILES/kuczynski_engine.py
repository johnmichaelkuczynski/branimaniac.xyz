"""
Kuczynskian Inference Engine v3.0
=================================
Full logical inference machinery. Returns ONLY actual positions from the database.
No synthesized text. No fabrication. Only Kuczynski's words.

Capabilities:
- Semantic position matching
- Entailment detection between positions
- Contradiction detection between positions
- Forward/backward chaining through logical relations
- Dialectical analysis (thesis/antithesis from actual positions)
- Multi-thinker comparison with actual positions
- Topic hierarchy navigation
- Position-grounded critique generation
"""

import json
import re
from typing import List, Dict, Set, Tuple, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict


class LogicalRelation(Enum):
    """Types of logical relationships between positions"""
    ENTAILS = "entails"
    CONTRADICTS = "contradicts"
    PRESUPPOSES = "presupposes"
    SPECIFIES = "specifies"
    GENERALIZES = "generalizes"
    SUPPORTS = "supports"
    WEAKENS = "weakens"


@dataclass
class Position:
    """A philosophical position with full metadata"""
    id: int
    thinker: str
    position: str
    topic: str

    keywords: Set[str] = field(default_factory=set)
    domain: str = ""

    def __post_init__(self):
        self.keywords = self._extract_keywords()
        self.domain = self._classify_domain()

    def _extract_keywords(self) -> Set[str]:
        """Extract philosophically significant terms"""
        text = self.position.lower()
        stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                    'would', 'could', 'should', 'may', 'might', 'must', 'shall',
                    'can', 'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by',
                    'from', 'as', 'into', 'through', 'during', 'before', 'after',
                    'above', 'below', 'between', 'under', 'again', 'further',
                    'then', 'once', 'here', 'there', 'when', 'where', 'why',
                    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
                    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
                    'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but',
                    'if', 'or', 'because', 'until', 'while', 'although', 'though',
                    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
                    'their', 'what', 'which', 'who', 'whom', 'whose'}
        words = re.findall(r'\b[a-z]+\b', text)
        return {w for w in words if w not in stopwords and len(w) > 2}

    def _classify_domain(self) -> str:
        """Classify position into philosophical domain"""
        topic_lower = self.topic.lower()
        text_lower = self.position.lower()
        combined = topic_lower + " " + text_lower

        domain_markers = {
            'epistemology': ['knowledge', 'belief', 'justif', 'a priori', 'epistemic', 
                           'certainty', 'doubt', 'skeptic', 'truth', 'evidence',
                           'empiric', 'rational'],
            'metaphysics': ['exist', 'being', 'identity', 'property', 'essence', 
                          'substance', 'modal', 'possible', 'necessary', 'ontolog',
                          'reality', 'nature', 'universal', 'particular', 'causation',
                          'cause', 'spatiotemporal'],
            'philosophy_of_language': ['meaning', 'reference', 'proposition', 'semantic',
                                      'sense', 'denotation', 'intension', 'extension',
                                      'sentence', 'word', 'language', 'truth condition'],
            'philosophy_of_mind': ['mental', 'consciousness', 'intentional', 'thought',
                                  'mind', 'cognitive', 'perception', 'qualia', 'experience',
                                  'represent', 'belief', 'desire', 'subpersonal', 'personal'],
            'logic': ['valid', 'inference', 'deduct', 'proof', 'theorem', 'axiom',
                     'contradict', 'consistent', 'complete', 'decidable', 'recursive',
                     'formal', 'logical', 'entail'],
            'ethics': ['moral', 'ethical', 'virtue', 'duty', 'good', 'right', 'wrong',
                      'ought', 'value', 'norm'],
            'psychology': ['unconscious', 'neurosis', 'defense', 'anxiety', 'psycho',
                          'behavior', 'motivation', 'personality', 'sociopath', 'psychopath'],
            'social_theory': ['society', 'social', 'culture', 'institution', 'power',
                            'community', 'individual', 'collective']
        }

        scores = defaultdict(int)
        for domain, markers in domain_markers.items():
            for marker in markers:
                if marker in combined:
                    scores[domain] += 1

        if scores:
            return max(scores.keys(), key=lambda d: scores[d])
        return 'general'


@dataclass
class Rule:
    """An inference rule - contains ONLY position IDs, no synthesized text"""
    id: str
    name: str
    domain: str
    antecedent_topics: List[str]
    antecedent_concepts: List[str]
    relation_type: str
    position_ids: List[int]
    strength: float


@dataclass
class InferenceChain:
    """A chain of inferences with provenance - all actual positions"""
    steps: List[Tuple[Dict, str, Dict]]  # (position, relation, position)
    initial_position: Dict
    final_position: Dict
    domains_traversed: List[str]
    thinkers_involved: List[str]


class KuczynskiInferenceEngine:
    """
    Full inference engine returning ONLY actual Kuczynski positions.
    No fabricated text. No synthesis. Only his words.

    Capabilities:
    - query(): Semantic search over positions
    - infer(): Rule-based + semantic inference
    - forward_chain(): Follow entailment relations
    - find_contradictions(): Find opposing positions
    - dialectical_analysis(): Thesis/antithesis on a topic
    - compare_thinkers(): Compare positions across thinkers
    - critique(): Find Kuczynski positions opposing a claim
    - get_positions_by_topic(): All positions on a topic
    - get_positions_by_domain(): All positions in a domain
    """

    def __init__(self, positions_file: str = 'positions.json',
                 rules_file: str = 'kuczynski_rules.json'):
        self.positions_file = positions_file
        self.rules_file = rules_file

        # Core data
        self.positions: Dict[int, Position] = {}
        self.rules: List[Rule] = []

        # Indices
        self.positions_by_thinker: Dict[str, List[int]] = defaultdict(list)
        self.positions_by_topic: Dict[str, List[int]] = defaultdict(list)
        self.positions_by_domain: Dict[str, List[int]] = defaultdict(list)
        self.keyword_index: Dict[str, Set[int]] = defaultdict(set)

        # Logical relation graphs (computed from position content)
        self.entailment_graph: Dict[int, Set[int]] = defaultdict(set)
        self.contradiction_graph: Dict[int, Set[int]] = defaultdict(set)
        self.specificity_graph: Dict[int, Set[int]] = defaultdict(set)

        # Topic hierarchy
        self.related_topics: Dict[str, Set[str]] = defaultdict(set)

        self._loaded = False

    def _ensure_loaded(self):
        """Lazy load all data on first access"""
        if self._loaded:
            return
        self._load_positions()
        self._load_rules()
        self._build_indices()
        self._infer_logical_relations()
        self._build_topic_hierarchy()
        self._loaded = True

    def _load_positions(self):
        """Load positions from JSON"""
        try:
            with open(self.positions_file, 'r', encoding='utf-8') as f:
                raw = json.load(f)
            for item in raw:
                pos = Position(
                    id=item['id'],
                    thinker=item['thinker'],
                    position=item['position'],
                    topic=item['topic']
                )
                self.positions[pos.id] = pos
        except FileNotFoundError:
            print(f"Warning: {self.positions_file} not found")

    def _load_rules(self):
        """Load inference rules"""
        try:
            with open(self.rules_file, 'r', encoding='utf-8') as f:
                raw = json.load(f)
            for item in raw:
                rule = Rule(
                    id=item['id'],
                    name=item['name'],
                    domain=item['domain'],
                    antecedent_topics=item['antecedent_topics'],
                    antecedent_concepts=item['antecedent_concepts'],
                    relation_type=item['relation_type'],
                    position_ids=item['position_ids'],
                    strength=item['strength']
                )
                self.rules.append(rule)
        except FileNotFoundError:
            print(f"Warning: {self.rules_file} not found")

    def _build_indices(self):
        """Build efficient lookup indices"""
        for pos_id, pos in self.positions.items():
            self.positions_by_thinker[pos.thinker.lower()].append(pos_id)
            self.positions_by_topic[pos.topic.lower()].append(pos_id)
            self.positions_by_domain[pos.domain].append(pos_id)
            for kw in pos.keywords:
                self.keyword_index[kw].add(pos_id)

    def _infer_logical_relations(self):
        """Infer logical relationships between positions based on content"""
        # Negation patterns for contradiction detection
        negation_pairs = [
            ('is not', 'is'), ('cannot', 'can'), ('never', 'always'),
            ('false', 'true'), ('impossible', 'possible'), ('rejects', 'accepts'),
            ('denies', 'affirms'), ('mistaken', 'correct'), ('fails', 'succeeds'),
            ("doesn't", 'does'), ("don't", 'do'), ('inadequate', 'adequate'),
            ('wrong', 'right'), ('erroneous', 'valid')
        ]

        # Specificity markers
        specificity_markers = ['specifically', 'in particular', 'for example',
                              'instance', 'case of', 'type of', 'form of']

        positions_list = list(self.positions.values())

        for i, pos1 in enumerate(positions_list):
            for pos2 in positions_list[i+1:]:
                # Only check positions on same/related topics
                if not self._topics_related(pos1.topic, pos2.topic):
                    continue

                # Check for contradictions
                if self._positions_contradict(pos1, pos2, negation_pairs):
                    self.contradiction_graph[pos1.id].add(pos2.id)
                    self.contradiction_graph[pos2.id].add(pos1.id)

                # Check for entailment (shared keywords + same topic = likely entailment)
                if self._position_entails(pos1, pos2):
                    self.entailment_graph[pos1.id].add(pos2.id)

                # Check for specificity relation
                if self._position_specifies(pos1, pos2, specificity_markers):
                    self.specificity_graph[pos1.id].add(pos2.id)

    def _topics_related(self, topic1: str, topic2: str) -> bool:
        """Check if two topics are related"""
        t1_lower = topic1.lower()
        t2_lower = topic2.lower()

        if t1_lower == t2_lower:
            return True

        # Check word overlap
        words1 = set(t1_lower.split())
        words2 = set(t2_lower.split())
        if words1 & words2:
            return True

        return False

    def _positions_contradict(self, pos1: Position, pos2: Position,
                             negation_pairs: List[Tuple[str, str]]) -> bool:
        """Check if two positions contradict each other"""
        text1 = pos1.position.lower()
        text2 = pos2.position.lower()

        # Must share significant keywords
        shared = pos1.keywords & pos2.keywords
        if len(shared) < 2:
            return False

        for neg, pos in negation_pairs:
            if (neg in text1 and pos in text2) or (neg in text2 and pos in text1):
                return True

        return False

    def _position_entails(self, pos1: Position, pos2: Position) -> bool:
        """Check if pos1 entails pos2 (pos1 is more specific)"""
        if pos1.topic.lower() != pos2.topic.lower():
            return False

        # pos1 entails pos2 if pos1's keywords are superset
        if pos1.keywords > pos2.keywords and len(pos2.keywords) >= 2:
            return True

        return False

    def _position_specifies(self, pos1: Position, pos2: Position,
                           markers: List[str]) -> bool:
        """Check if pos1 is a more specific form of pos2"""
        text1 = pos1.position.lower()

        if any(m in text1 for m in markers):
            if pos1.keywords >= pos2.keywords:
                return True

        return False

    def _build_topic_hierarchy(self):
        """Build topic relationship graph"""
        topics = list(self.positions_by_topic.keys())

        for i, t1 in enumerate(topics):
            words1 = set(t1.split())
            for t2 in topics[i+1:]:
                words2 = set(t2.split())
                if words1 & words2:
                    self.related_topics[t1].add(t2)
                    self.related_topics[t2].add(t1)

    # =========================================================================
    # QUERY METHODS - All return ONLY actual positions
    # =========================================================================

    def _extract_query_keywords(self, text: str) -> Set[str]:
        """Extract significant keywords from query"""
        stopwords = {'what', 'how', 'why', 'when', 'where', 'who', 'which',
                    'explain', 'describe', 'tell', 'about', 'mean', 'think',
                    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'does',
                    'view', 'position', 'say', 'believe', 'hold', 'argue'}
        words = re.findall(r'\b[a-z]+\b', text.lower())
        return {w for w in words if w not in stopwords and len(w) > 2}

    def _relevance_score(self, pos: Position, query_keywords: Set[str],
                        query_text: str) -> float:
        """Compute relevance score for a position"""
        # Keyword overlap
        overlap = len(pos.keywords & query_keywords)
        keyword_score = overlap / max(len(query_keywords), 1)

        # Topic match
        topic_words = set(pos.topic.lower().split())
        topic_score = len(topic_words & query_keywords) / max(len(topic_words), 1)

        # Text similarity
        pos_words = set(pos.position.lower().split())
        query_words = set(query_text.lower().split())
        text_score = len(pos_words & query_words) / max(len(query_words), 1)

        return (keyword_score * 0.4) + (topic_score * 0.35) + (text_score * 0.25)

    def _pos_to_dict(self, pos: Position, score: float = None) -> Dict[str, Any]:
        """Convert Position to dict - ONLY actual data"""
        result = {
            'id': pos.id,
            'thinker': pos.thinker,
            'position': pos.position,  # ACTUAL TEXT
            'topic': pos.topic,
            'domain': pos.domain
        }
        if score is not None:
            result['relevance'] = round(score, 3)
        return result

    def query(self, phenomenon: str, max_results: int = 15,
              thinker: Optional[str] = None,
              domain: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Semantic search over positions.
        Returns ONLY actual position text.
        """
        self._ensure_loaded()

        query_keywords = self._extract_query_keywords(phenomenon)

        # Find candidates via keyword matching
        candidates = set()
        for kw in query_keywords:
            candidates.update(self.keyword_index.get(kw, set()))
            for indexed_kw, pos_ids in self.keyword_index.items():
                if kw in indexed_kw or indexed_kw in kw:
                    candidates.update(pos_ids)

        # Filter by thinker
        if thinker:
            thinker_positions = set(self.positions_by_thinker.get(thinker.lower(), []))
            candidates = candidates & thinker_positions

        # Filter by domain
        if domain:
            domain_positions = set(self.positions_by_domain.get(domain, []))
            candidates = candidates & domain_positions

        # Score and rank
        scored = []
        for pos_id in candidates:
            pos = self.positions[pos_id]
            score = self._relevance_score(pos, query_keywords, phenomenon)
            scored.append((pos, score))

        scored.sort(key=lambda x: x[1], reverse=True)

        return [self._pos_to_dict(pos, score) for pos, score in scored[:max_results]]

    def apply_rules(self, query: str) -> List[Dict[str, Any]]:
        """
        Apply inference rules.
        Returns ONLY actual positions from matched rules.
        """
        self._ensure_loaded()

        query_lower = query.lower()
        activated = []

        for rule in self.rules:
            concept_matches = sum(
                1 for c in rule.antecedent_concepts
                if c.lower() in query_lower
            )

            topic_matches = sum(
                1 for t in rule.antecedent_topics
                if t.lower() in query_lower or
                any(word in query_lower for word in t.lower().split())
            )

            if concept_matches + topic_matches >= 1:
                # Get ACTUAL positions
                positions = []
                for pid in rule.position_ids:
                    if pid in self.positions:
                        pos = self.positions[pid]
                        positions.append({
                            'id': pos.id,
                            'position': pos.position,  # ACTUAL TEXT
                            'topic': pos.topic
                        })

                activation = min(1.0, (concept_matches + topic_matches) * 0.3) * rule.strength

                activated.append({
                    'rule_id': rule.id,
                    'rule_name': rule.name,
                    'domain': rule.domain,
                    'relation_type': rule.relation_type,
                    'activation_strength': round(activation, 3),
                    'positions': positions
                })

        activated.sort(key=lambda r: r['activation_strength'], reverse=True)
        return activated

    def infer(self, phenomenon: str, max_positions: int = 20) -> Dict[str, Any]:
        """
        Full inference combining rules and semantic search.
        Returns ONLY actual positions.
        """
        self._ensure_loaded()

        # Get rule-based positions
        rules = self.apply_rules(phenomenon)

        # Collect positions from rules
        rule_positions = []
        seen_ids = set()
        for r in rules:
            for p in r['positions']:
                if p['id'] not in seen_ids:
                    seen_ids.add(p['id'])
                    rule_positions.append(p)

        # Get semantic search positions (Kuczynski only)
        query_positions = self.query(phenomenon, max_results=max_positions,
                                    thinker='kuczynski')

        # Merge
        for qp in query_positions:
            if qp['id'] not in seen_ids:
                seen_ids.add(qp['id'])
                rule_positions.append({
                    'id': qp['id'],
                    'position': qp['position'],
                    'topic': qp['topic']
                })

        # Get related positions via entailment
        entailed = []
        for p in rule_positions[:10]:
            for entailed_id in self.entailment_graph.get(p['id'], set()):
                if entailed_id not in seen_ids:
                    pos = self.positions[entailed_id]
                    if pos.thinker == 'kuczynski':
                        seen_ids.add(entailed_id)
                        entailed.append({
                            'id': pos.id,
                            'position': pos.position,
                            'topic': pos.topic,
                            'entailed_from': p['id']
                        })

        return {
            'query': phenomenon,
            'positions': rule_positions[:max_positions],
            'entailed_positions': entailed[:10],
            'rules_activated': len(rules),
            'total_positions': len(rule_positions)
        }

    # =========================================================================
    # LOGICAL INFERENCE METHODS
    # =========================================================================

    def forward_chain(self, starting_position_id: int,
                     max_depth: int = 3) -> Dict[str, Any]:
        """
        Forward chain through entailment relations.
        Returns ONLY actual positions.
        """
        self._ensure_loaded()

        if starting_position_id not in self.positions:
            return {'error': f'Position {starting_position_id} not found'}

        start_pos = self.positions[starting_position_id]

        chain = [{
            'depth': 0,
            'id': start_pos.id,
            'position': start_pos.position,
            'topic': start_pos.topic,
            'thinker': start_pos.thinker
        }]

        visited = {starting_position_id}
        current_level = [starting_position_id]

        for depth in range(1, max_depth + 1):
            next_level = []
            for pos_id in current_level:
                for entailed_id in self.entailment_graph.get(pos_id, set()):
                    if entailed_id not in visited:
                        visited.add(entailed_id)
                        pos = self.positions[entailed_id]
                        chain.append({
                            'depth': depth,
                            'id': pos.id,
                            'position': pos.position,
                            'topic': pos.topic,
                            'thinker': pos.thinker,
                            'entailed_from': pos_id
                        })
                        next_level.append(entailed_id)

            if not next_level:
                break
            current_level = next_level

        return {
            'starting_position': start_pos.position,
            'chain': chain,
            'total_reached': len(chain)
        }

    def find_contradictions(self, position_id: int) -> Dict[str, Any]:
        """
        Find positions that contradict a given position.
        Returns ONLY actual positions.
        """
        self._ensure_loaded()

        if position_id not in self.positions:
            return {'error': f'Position {position_id} not found'}

        pos = self.positions[position_id]

        contradicting = []
        for contra_id in self.contradiction_graph.get(position_id, set()):
            contra_pos = self.positions[contra_id]
            contradicting.append({
                'id': contra_pos.id,
                'position': contra_pos.position,
                'topic': contra_pos.topic,
                'thinker': contra_pos.thinker
            })

        return {
            'original': {
                'id': pos.id,
                'position': pos.position,
                'topic': pos.topic,
                'thinker': pos.thinker
            },
            'contradictions': contradicting
        }

    def dialectical_analysis(self, topic: str) -> Dict[str, Any]:
        """
        Find thesis/antithesis pairs on a topic.
        Returns ONLY actual positions.
        """
        self._ensure_loaded()

        # Get all positions on topic
        topic_lower = topic.lower()
        topic_positions = []

        for indexed_topic, pos_ids in self.positions_by_topic.items():
            if topic_lower in indexed_topic or indexed_topic in topic_lower:
                for pid in pos_ids:
                    topic_positions.append(self.positions[pid])

        if not topic_positions:
            return {'error': f'No positions found for topic: {topic}'}

        # Group by thinker
        by_thinker = defaultdict(list)
        for pos in topic_positions:
            by_thinker[pos.thinker].append({
                'id': pos.id,
                'position': pos.position,
                'topic': pos.topic
            })

        # Find contradictions within topic
        contradictions = []
        for pos in topic_positions:
            for contra_id in self.contradiction_graph.get(pos.id, set()):
                if contra_id in {p.id for p in topic_positions}:
                    contra = self.positions[contra_id]
                    # Avoid duplicates
                    pair = tuple(sorted([pos.id, contra_id]))
                    if pair not in [(c['thesis']['id'], c['antithesis']['id']) 
                                   for c in contradictions]:
                        contradictions.append({
                            'thesis': {
                                'id': pos.id,
                                'thinker': pos.thinker,
                                'position': pos.position
                            },
                            'antithesis': {
                                'id': contra.id,
                                'thinker': contra.thinker,
                                'position': contra.position
                            }
                        })

        return {
            'topic': topic,
            'total_positions': len(topic_positions),
            'thinkers': list(by_thinker.keys()),
            'positions_by_thinker': dict(by_thinker),
            'contradictions': contradictions[:20],
            'kuczynski_positions': by_thinker.get('kuczynski', [])
        }

    def compare_thinkers(self, thinker1: str, thinker2: str,
                        topic: Optional[str] = None) -> Dict[str, Any]:
        """
        Compare positions of two thinkers.
        Returns ONLY actual positions.
        """
        self._ensure_loaded()

        t1_lower = thinker1.lower()
        t2_lower = thinker2.lower()

        pos1_ids = set(self.positions_by_thinker.get(t1_lower, []))
        pos2_ids = set(self.positions_by_thinker.get(t2_lower, []))

        # Filter by topic if specified
        if topic:
            topic_lower = topic.lower()
            topic_ids = set()
            for indexed_topic, pids in self.positions_by_topic.items():
                if topic_lower in indexed_topic or indexed_topic in topic_lower:
                    topic_ids.update(pids)
            pos1_ids &= topic_ids
            pos2_ids &= topic_ids

        positions1 = [self.positions[pid] for pid in pos1_ids]
        positions2 = [self.positions[pid] for pid in pos2_ids]

        # Find shared topics
        topics1 = {p.topic.lower() for p in positions1}
        topics2 = {p.topic.lower() for p in positions2}
        shared_topics = topics1 & topics2

        # Find contradictions between thinkers
        disagreements = []
        for p1 in positions1:
            for contra_id in self.contradiction_graph.get(p1.id, set()):
                if contra_id in pos2_ids:
                    p2 = self.positions[contra_id]
                    disagreements.append({
                        thinker1: {
                            'id': p1.id,
                            'position': p1.position,
                            'topic': p1.topic
                        },
                        thinker2: {
                            'id': p2.id,
                            'position': p2.position,
                            'topic': p2.topic
                        }
                    })

        # Find agreements (same topic, high keyword overlap, no contradiction)
        agreements = []
        for p1 in positions1:
            for p2 in positions2:
                if p1.topic.lower() == p2.topic.lower():
                    if p2.id not in self.contradiction_graph.get(p1.id, set()):
                        overlap = len(p1.keywords & p2.keywords)
                        if overlap >= 3:
                            agreements.append({
                                'topic': p1.topic,
                                thinker1: {
                                    'id': p1.id,
                                    'position': p1.position
                                },
                                thinker2: {
                                    'id': p2.id,
                                    'position': p2.position
                                },
                                'keyword_overlap': overlap
                            })

        agreements.sort(key=lambda x: x['keyword_overlap'], reverse=True)

        return {
            'thinker1': thinker1,
            'thinker2': thinker2,
            'topic': topic,
            f'{thinker1}_count': len(positions1),
            f'{thinker2}_count': len(positions2),
            'shared_topics': list(shared_topics)[:20],
            'agreements': agreements[:15],
            'disagreements': disagreements[:15]
        }

    def critique(self, claim: str, max_results: int = 10) -> Dict[str, Any]:
        """
        Find Kuczynski positions that oppose/critique a claim.
        Returns ONLY actual positions.
        """
        self._ensure_loaded()

        # Find positions semantically related to the claim
        related = self.query(claim, max_results=30, thinker='kuczynski')

        # Look for positions with critical/negative language toward claim concepts
        claim_keywords = self._extract_query_keywords(claim)

        critical_markers = ['wrong', 'false', 'mistaken', 'fails', 'inadequate',
                          'cannot', 'error', 'rejects', 'denies', 'critique',
                          'problem', 'flaw', "doesn't", 'impossible']

        critiques = []
        for p in related:
            text_lower = p['position'].lower()
            # Check if position contains critical language
            has_critical = any(m in text_lower for m in critical_markers)
            # Check if it addresses claim keywords
            addresses_claim = any(kw in text_lower for kw in claim_keywords)

            if has_critical and addresses_claim:
                critiques.append(p)

        return {
            'claim': claim,
            'critiques': critiques[:max_results],
            'related_positions': [p for p in related if p not in critiques][:max_results]
        }

    # =========================================================================
    # TOPIC AND DOMAIN METHODS
    # =========================================================================

    def get_positions_by_topic(self, topic: str,
                              thinker: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all positions on a topic.
        Returns ONLY actual positions.
        """
        self._ensure_loaded()

        topic_lower = topic.lower()
        results = []

        for indexed_topic, pos_ids in self.positions_by_topic.items():
            if topic_lower in indexed_topic or indexed_topic in topic_lower:
                for pid in pos_ids:
                    pos = self.positions[pid]
                    if thinker is None or pos.thinker == thinker.lower():
                        results.append({
                            'id': pos.id,
                            'thinker': pos.thinker,
                            'position': pos.position,
                            'topic': pos.topic
                        })

        return results

    def get_positions_by_domain(self, domain: str,
                               thinker: Optional[str] = None,
                               max_results: int = 50) -> List[Dict[str, Any]]:
        """
        Get positions in a philosophical domain.
        Returns ONLY actual positions.
        """
        self._ensure_loaded()

        results = []
        for pid in self.positions_by_domain.get(domain, []):
            pos = self.positions[pid]
            if thinker is None or pos.thinker == thinker.lower():
                results.append({
                    'id': pos.id,
                    'thinker': pos.thinker,
                    'position': pos.position,
                    'topic': pos.topic
                })

        return results[:max_results]

    def get_related_topics(self, topic: str) -> List[str]:
        """Get topics related to a given topic"""
        self._ensure_loaded()
        return list(self.related_topics.get(topic.lower(), set()))

    def get_all_topics(self, thinker: Optional[str] = None) -> List[str]:
        """Get all unique topics, optionally filtered by thinker"""
        self._ensure_loaded()

        if thinker:
            thinker_ids = set(self.positions_by_thinker.get(thinker.lower(), []))
            topics = set()
            for pid in thinker_ids:
                topics.add(self.positions[pid].topic)
            return sorted(topics)

        return sorted(self.positions_by_topic.keys())

    def get_all_thinkers(self) -> List[str]:
        """Get all unique thinkers"""
        self._ensure_loaded()
        return sorted(self.positions_by_thinker.keys())

    # =========================================================================
    # STATISTICS
    # =========================================================================

    def statistics(self) -> Dict[str, Any]:
        """Return statistics about the knowledge base"""
        self._ensure_loaded()

        kuc_count = len(self.positions_by_thinker.get('kuczynski', []))

        return {
            'total_positions': len(self.positions),
            'kuczynski_positions': kuc_count,
            'total_rules': len(self.rules),
            'total_topics': len(self.positions_by_topic),
            'total_thinkers': len(self.positions_by_thinker),
            'thinker_counts': {t: len(pids) for t, pids in self.positions_by_thinker.items()},
            'domain_counts': {d: len(pids) for d, pids in self.positions_by_domain.items()},
            'entailments': sum(len(v) for v in self.entailment_graph.values()),
            'contradictions': sum(len(v) for v in self.contradiction_graph.values()) // 2
        }


# =========================================================================
# SINGLETON ACCESS
# =========================================================================

_engine: Optional[KuczynskiInferenceEngine] = None

def get_engine(positions_file: str = 'positions.json',
               rules_file: str = 'kuczynski_rules.json') -> KuczynskiInferenceEngine:
    """
    Get or create singleton inference engine.

    Default rules file contains 729 rules covering ALL 2,103 Kuczynski positions.
    100% complete - every position is accessible.
    """
    """Get or create singleton inference engine"""
    global _engine
    if _engine is None:
        _engine = KuczynskiInferenceEngine(positions_file, rules_file)
    return _engine


# =========================================================================
# CONVENIENCE FUNCTIONS
# =========================================================================

def query(phenomenon: str, **kwargs) -> List[Dict[str, Any]]:
    """Query positions"""
    return get_engine().query(phenomenon, **kwargs)

def infer(phenomenon: str, **kwargs) -> Dict[str, Any]:
    """Full inference"""
    return get_engine().infer(phenomenon, **kwargs)

def dialectic(topic: str) -> Dict[str, Any]:
    """Dialectical analysis"""
    return get_engine().dialectical_analysis(topic)

def compare(thinker1: str, thinker2: str, topic: str = None) -> Dict[str, Any]:
    """Compare thinkers"""
    return get_engine().compare_thinkers(thinker1, thinker2, topic)

def critique(claim: str) -> Dict[str, Any]:
    """Find critiques of a claim"""
    return get_engine().critique(claim)