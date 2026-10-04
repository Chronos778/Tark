"""
Keyword-aware re-ranking on top of vector search.

The default local embedder matches loosely (e.g. "cheating" ranks below unrelated sections),
so we nudge results whose section topic, number or law the user actually mentioned.
Distances are smaller-is-better; matches subtract a bonus.
"""
import re
from typing import Any, Dict, List, Tuple

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "of", "in", "on", "for", "to", "and", "or", "if",
    "it", "its", "this", "that", "what", "which", "who", "whom", "how", "do", "does", "can", "i", "my",
    "me", "we", "you", "your", "with", "by", "as", "at", "from", "under", "about", "there", "any", "has",
    "have", "had", "should", "would", "will", "shall", "tell", "explain", "give", "get", "when", "where",
}
# Words that appear in nearly every legal question and say nothing about the topic
GENERIC = {
    "punishment", "punishable", "penalty", "penalties", "section", "sections", "law", "laws", "act", "code",
    "offence", "offense", "crime", "legal", "india", "indian", "bns", "ipc", "bharatiya", "nyaya", "sanhita",
    "difference", "differ", "changed", "change", "new", "old", "vs", "versus", "meaning", "define", "definition",
}

# Phrases that point at a particular law (matched against meta["law"])
LAW_HINTS = {
    "BNS": ("bns", "bharatiya nyaya"),
    "IPC": ("ipc", "indian penal code"),
    "IT Act": ("it act", "information technology", "cyber", "hacking", "online", "electronic", "computer"),
    "Companies Act": ("company", "companies", "director", "shareholder", "incorporat"),
    "Consumer Protection Act": ("consumer", "defective", "refund", "e-commerce", "product liability"),
    "Motor Vehicles Act": ("vehicle", "driving", "driver", "licence", "license", "motor", "traffic", "helmet", "accident"),
}

TOPIC_BONUS = 0.30
SECTION_BONUS = 0.40
LAW_BONUS = 0.12
CURRENT_LAW_BONUS = 0.18  # BNS is in force; prefer it over the IPC unless the question is about the IPC
TEXT_BONUS = 0.18
TIGHT_TOPIC_BONUS = 0.25  # the topic is essentially just the asked-about word(s), e.g. "Theft" for "theft"


def _stem(word: str) -> str:
    for suffix in ("ation", "ing", "ed", "es", "s"):
        if word.endswith(suffix) and len(word) - len(suffix) >= 4:
            return word[: -len(suffix)]
    return word


def keywords(query: str) -> List[str]:
    words = re.findall(r"[a-z]+", query.lower())
    return [_stem(w) for w in words if w not in STOPWORDS and w not in GENERIC and len(w) > 2]


def _meta_section(meta: Dict[str, Any]) -> str:
    value = meta.get("section") or meta.get("bns_section") or meta.get("ipc_section") or ""
    return str(value).replace("Section", "").strip().lower()


def adjust(query: str, doc: str, meta: Dict[str, Any], dist: float) -> float:
    q = query.lower()
    kws = keywords(query)
    bonus = 0.0

    topic = str(meta.get("topic") or "").lower()
    if kws and topic and any(k in topic for k in kws):
        bonus += TOPIC_BONUS
        topic_words = {w for w in keywords(topic)}
        if topic_words and set(kws) <= topic_words and len(topic_words) <= len(set(kws)) + 1:
            bonus += TIGHT_TOPIC_BONUS

    numbers = set(re.findall(r"\b(\d{1,3}[a-z]?)\b", q))
    section = _meta_section(meta)
    if section and section in numbers:
        bonus += SECTION_BONUS

    law = str(meta.get("law") or "")
    if law and any(h in q for h in LAW_HINTS.get(law, ())):
        bonus += LAW_BONUS
    if law == "BNS" and not any(h in q for h in LAW_HINTS["IPC"]):
        bonus += CURRENT_LAW_BONUS

    if kws and doc:
        text = doc.lower()
        hits = sum(1 for k in kws if k in text)
        bonus += TEXT_BONUS * hits / len(kws)

    return dist - bonus


def select_context(
    query: str,
    docs: List[str],
    metas: List[Dict[str, Any]],
    dists: List[float],
    max_docs: int = 6,
    window: float = 0.5,
    use_rerank: bool = True,
) -> List[Tuple[str, Dict[str, Any], float]]:
    """Pick the passages to show the model: re-rank, then keep those close to the best match."""
    scored = [
        (adjust(query, d, m, x) if use_rerank else x, d, m)
        for d, m, x in zip(docs, metas, dists)
    ]
    scored.sort(key=lambda t: t[0])
    if not scored:
        return []
    best = scored[0][0]
    cutoff = min(1.5, best + window)
    return [(d, m, s) for s, d, m in scored if s <= cutoff][:max_docs]
