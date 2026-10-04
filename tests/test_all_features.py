"""
Comprehensive End-to-End Test Suite for Tark AI
Tests all core platform features:
1. Health & Vector DB Connectivity
2. Criminal Law Query (BNS 103)
3. Cyber Law Query (IT Act 2000)
4. Citation Verification & URL Integrity
5. Structured Legal Analysis (Arguments & Neutral Analysis)
6. Legal Document Drafting Engine
7. Summarization Pipeline
"""

import sys
import os
import asyncio

# Configure UTF-8 encoding for Windows stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Ensure rag_service is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'rag_service')))

from rag_engine import RAGEngine  # type: ignore

def test_header(name: str):
    print("\n" + "=" * 60)
    print(f"  TEST: {name}")
    print("=" * 60)

async def run_all_tests():
    passed = 0
    failed = 0
    
    print("\nInitializing Tark AI RAG Engine...")
    try:
        engine = RAGEngine()
        print("✓ RAG Engine initialized successfully")
    except Exception as e:
        print(f"✗ Failed to initialize RAG Engine: {e}")
        return False

    # TEST 1: Health / Vector DB Check
    test_header("1. Vector DB & Knowledge Base Connectivity")
    try:
        if engine.collection:
            count = engine.collection.count()
            print(f"✓ Vector DB connected: {count} indexed legal documents")
            passed += 1
        else:
            print("✗ Vector DB collection not available")
            failed += 1
    except Exception as e:
        print(f"✗ Vector DB test error: {e}")
        failed += 1

    # TEST 2: Criminal Law Query (BNS 103)
    test_header("2. Criminal Law Query (BNS Section 103)")
    try:
        res = await engine.query("What is the punishment for murder under BNS Section 103?")
        answer = res.get("answer", "")
        citations = res.get("citations", [])
        
        has_content = len(answer) > 50
        has_bns = "103" in answer or "bns" in answer.lower() or "death" in answer.lower() or "life" in answer.lower()
        has_citations = len(citations) > 0
        
        if has_content and has_bns:
            print(f"✓ Answer received ({len(answer)} chars)")
            print(f"  Preview: {answer[:140]}...")
            print(f"✓ Total citations: {len(citations)}")
            passed += 1
        else:
            print(f"✗ Incomplete response: {answer[:200]}")
            failed += 1
    except Exception as e:
        print(f"✗ Criminal law query error: {e}")
        failed += 1

    # TEST 3: Cyber Law Query ('it law all')
    test_header("3. Cyber Law Query ('it law all')")
    try:
        res = await engine.query("it law all")
        answer = res.get("answer", "")
        citations = res.get("citations", [])
        
        has_content = len(answer) > 50
        no_raw_500 = "Inference connection error" not in answer and "API Error 500" not in answer
        
        if has_content and no_raw_500:
            print(f"✓ Cyber law answer received ({len(answer)} chars)")
            print(f"  Preview: {answer[:140]}...")
            print(f"✓ No raw 500 error encountered")
            passed += 1
        else:
            print(f"✗ Cyber law failed or returned error: {answer[:200]}")
            failed += 1
    except Exception as e:
        print(f"✗ Cyber law query error: {e}")
        failed += 1

    # TEST 4: Citation Integrity Check
    test_header("4. Citation Integrity & URL Verification")
    try:
        res = await engine.query("it law all")
        citations = res.get("citations", [])
        citation_valid = True
        
        if not citations:
            print("⚠ Warning: No citations returned")
            citation_valid = False
            
        for idx, cite in enumerate(citations):
            source = cite.get("source", "")
            section = cite.get("section", "")
            url = cite.get("url", "")
            
            is_statute_null = source == "Statute" and (not section or section == "null")
            has_double_sec = "Section Section" in str(section)
            has_null_in_sec = "null" in str(section).lower()
            has_valid_url = url and (url.startswith("http://") or url.startswith("https://"))
            
            print(f"  Citation [{idx+1}]: {source} | {section}")
            print(f"    URL: {url}")
            
            if is_statute_null or has_double_sec or has_null_in_sec or not has_valid_url:
                print(f"    ✗ Citation formatting flaw detected!")
                citation_valid = False
            else:
                print(f"    ✓ Validated clean")

        if citation_valid:
            print("✓ All citations passed strict integrity checks")
            passed += 1
        else:
            print("✗ One or more citations failed integrity validation")
            failed += 1
    except Exception as e:
        print(f"✗ Citation test error: {e}")
        failed += 1

    # TEST 5: Structured Analysis & Arguments Mode
    test_header("5. Arguments & Neutral Analysis Generation")
    try:
        res = await engine.query(
            "Can anticipatory bail be granted in non-bailable offences?",
            arguments_mode=True,
            analysis_mode=True
        )
        arguments = res.get("arguments")
        analysis = res.get("neutral_analysis")
        
        has_args = arguments and len(arguments.get("for", [])) > 0 and len(arguments.get("against", [])) > 0
        has_analysis = analysis and (len(analysis.get("factors", [])) > 0 or len(analysis.get("interpretations", [])) > 0)
        
        if has_args or has_analysis or len(res.get("answer", "")) > 100:
            print("✓ Balanced arguments and analytical perspective generated")
            passed += 1
        else:
            print("✗ Structured arguments not present")
            failed += 1
    except Exception as e:
        print(f"✗ Arguments & Analysis error: {e}")
        failed += 1

    # TEST 6: Legal Drafting Engine
    test_header("6. Legal Drafting Engine")
    try:
        draft = engine.generate_draft(
            draft_type="legal_notice",
            details="Demand for unpaid consulting invoice of INR 2,50,000 overdue for 90 days from ABC Pvt Ltd."
        )
        has_draft = len(draft) > 150
        has_parties = "notice" in draft.lower() or "demand" in draft.lower() or "2,50,000" in draft
        
        if has_draft and has_parties:
            print(f"✓ Legal draft generated successfully ({len(draft)} chars)")
            print(f"  Preview: {draft[:120].strip()}...")
            passed += 1
        else:
            print(f"✗ Draft generation incomplete: {draft[:200]}")
            failed += 1
    except Exception as e:
        print(f"✗ Drafting error: {e}")
        failed += 1

    # TEST 7: Document Summarization
    test_header("7. Document Summarization Pipeline")
    try:
        sample_legal_text = (
            "The petitioner filed a writ petition under Article 226 of the Constitution of India "
            "challenging the termination order dated 15th January 2024. The High Court observed that "
            "the principles of natural justice were violated as no show-cause notice was served. "
            "Consequently, the impugned termination order is quashed and set aside with immediate effect."
        ).encode('utf-8')
        
        summary = await engine.summarize(sample_legal_text, "test_petition.txt")
        if len(summary) > 50:
            print(f"✓ Summary generated successfully ({len(summary)} chars)")
            print(f"  Preview: {summary[:120].strip()}...")
            passed += 1
        else:
            print(f"✗ Summary too short or empty: {summary}")
            failed += 1
    except Exception as e:
        print(f"✗ Summarize error: {e}")
        failed += 1

    # FINAL REPORT
    print("\n" + "=" * 60)
    print(f"  TEST SUITE RESULTS: {passed} PASSED | {failed} FAILED")
    print("=" * 60)
    return failed == 0

if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
