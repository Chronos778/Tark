"""
Offline unit tests for the backend logic (no LLM, no network, no database).

Run from the project root:
  .venv\\Scripts\\python.exe -m unittest discover -s rag_service\\tests -p "test_unit_*.py"
"""
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from rag_engine import RAGEngine  # noqa: E402
from rerank import keywords, select_context  # noqa: E402


def meta(law, section, topic):
    key = {"BNS": "bns_section", "IPC": "ipc_section"}.get(law, "section")
    return {"type": "statute", "law": law, "topic": topic, key: section}


class GreetingDetection(unittest.TestCase):
    classify = staticmethod(lambda q: RAGEngine._classify_query(None, q))

    def test_real_greetings_are_simple(self):
        for q in ("hello", "hi there", "thanks", "who are you", "what can you do"):
            self.assertEqual(self.classify(q), "simple", q)

    def test_hi_inside_a_word_is_not_a_greeting(self):
        for q in (
            "What is the punishment for attempt to murder under the Bharatiya Nyaya Sanhita?",
            "Is this punishable?",
            "which section covers theft",
        ):
            self.assertEqual(self.classify(q), "legal", q)

    def test_legal_words_win_over_help(self):
        self.assertEqual(self.classify("help me understand section 302"), "legal")


class NamedSectionPatterns(unittest.TestCase):
    def numbers(self, q):
        rx = RAGEngine._SECTION_REF
        return [(m.group(1) or m.group(2) or m.group(3)).upper() for m in rx.finditer(q)]

    def test_forms(self):
        self.assertEqual(self.numbers("Is section 66A of the IT Act still valid?"), ["66A"])
        self.assertEqual(self.numbers("What is IPC section 302?"), ["302"])
        self.assertEqual(self.numbers("punishment under IPC 498A"), ["498A"])
        self.assertEqual(self.numbers("What is 420 IPC"), ["420"])
        self.assertEqual(self.numbers("Explain section 103 of the BNS"), ["103"])

    def test_no_number_no_match(self):
        self.assertEqual(self.numbers("What is the punishment for theft?"), [])


class FollowUpDetection(unittest.TestCase):
    def looks(self, q):
        return RAGEngine._looks_like_followup(RAGEngine.__new__(RAGEngine), q)

    def test_followups(self):
        for q in ("And what if it is only an attempt?", "what about the fine?", "Is it bailable?"):
            self.assertTrue(self.looks(q), q)

    def test_standalone_questions(self):
        self.assertFalse(self.looks("Explain the offence of criminal breach of trust under the BNS in detail and with examples please"))
        self.assertFalse(self.looks("punishment for murder"))


class RunawayTrim(unittest.TestCase):
    def test_collapses_repeated_lines_and_caps_length(self):
        text = "a\nb\nb\nb\nc\n" + "x\n" * 10000
        out = RAGEngine._trim_runaway(text)
        self.assertTrue(out.startswith("a\nb\nc\nx"))
        self.assertLessEqual(len(out), 7000)


class Reranking(unittest.TestCase):
    docs = ["theft in a dwelling house", "theft", "assault"]
    metas = [
        meta("BNS", "305", "Theft in a dwelling house"),
        meta("BNS", "303", "Theft"),
        meta("BNS", "131", "Assault"),
    ]

    def test_keywords_drop_generic_words(self):
        self.assertEqual(keywords("What is the punishment for theft?"), ["theft"])

    def test_base_offence_beats_variants_at_equal_distance(self):
        sel = select_context("punishment for theft", self.docs, self.metas, [0.8, 0.8, 0.8])
        self.assertEqual(sel[0][1]["bns_section"], "303")

    def test_named_section_wins(self):
        sel = select_context("what is section 131", self.docs, self.metas, [0.7, 0.7, 0.9])
        self.assertEqual(sel[0][1]["bns_section"], "131")

    def test_bns_preferred_unless_ipc_named(self):
        docs = ["ipc theft", "bns theft"]
        metas = [meta("IPC", "379", "Theft"), meta("BNS", "303", "Theft")]
        self.assertEqual(select_context("punishment for theft", docs, metas, [0.75, 0.80])[0][1]["law"], "BNS")
        self.assertEqual(select_context("theft under the IPC", docs, metas, [0.75, 0.80])[0][1]["law"], "IPC")

    def test_distant_results_are_dropped(self):
        sel = select_context("theft", ["near", "far"], [meta("BNS", "1", "Theft"), meta("BNS", "2", "Other")], [0.4, 1.4])
        self.assertEqual(len(sel), 1)

    def test_empty_input(self):
        self.assertEqual(select_context("theft", [], [], []), [])


class ErrorMapping(unittest.TestCase):
    def test_engine_errors_are_detected(self):
        import main  # imported lazily: it builds the FastAPI app (the engine only starts on server startup)

        self.assertTrue(main.is_engine_error("Error: API Error 429: {}"))
        self.assertTrue(main.is_engine_error("Failed to summarize document: boom"))
        self.assertFalse(main.is_engine_error("**Direct Answer** Murder is punishable under section 103."))

    def test_emoji_stripped(self):
        import main

        self.assertEqual(main.strip_emoji("Hello \U0001F44B there"), "Hello there")


class MultiTurnConversationTests(unittest.TestCase):
    def test_query_request_accepts_history(self):
        import main
        req = main.QueryRequest(
            query="Is it bailable?",
            history=[
                {"role": "user", "content": "What is Section 302 of IPC?"},
                {"role": "assistant", "content": "Section 302 deals with murder."}
            ]
        )
        self.assertEqual(req.query, "Is it bailable?")
        self.assertEqual(len(req.history), 2)
        self.assertEqual(req.history[0]["role"], "user")

    def test_followup_rewrite_with_history(self):
        engine = RAGEngine.__new__(RAGEngine)
        engine.api_key = "dummy_valid_api_key_12345"
        engine.model_simple = "dummy"
        captured = []
        engine._call_llm = lambda msgs, **kw: captured.append(msgs) or "Rewritten Standalone Query"
        
        history = [
            {"role": "user", "content": "What is IPC 302?"},
            {"role": "assistant", "content": "IPC 302 covers murder."}
        ]
        rewritten = engine._rewrite_followup(None, "And what about the fine?", history=history)
        self.assertEqual(rewritten, "Rewritten Standalone Query")
        self.assertTrue(len(captured) > 0)
        self.assertIn("What is IPC 302?", captured[0][0]["content"])


if __name__ == "__main__":
    unittest.main()
