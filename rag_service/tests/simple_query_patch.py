"""
Fast Query Handler Helper for Tark AI
"""

def fast_query_handler(query: str, language: str = "en"):
    """Fast path for common greetings and simple queries."""
    query_lower = query.lower().strip()
    if any(word in query_lower for word in ['hello', 'hi', 'hey']) and len(query_lower) < 20:
        return {
            "answer": "Hello! 👋 I'm **Tark AI**, your Indian legal assistant.\n\nI specialize in:\n- 🏛️ **Criminal Law** (IPC/BNS)\n- 💻 **IT & Cyber Law**\n- 🏢 **Corporate Law**\n- 🛡️ **Consumer Law**\n- 🚗 **Transport Law**\n\nHow can I help you today?",
            "citations": [],
            "related_judgments": []
        }
    elif any(word in query_lower for word in ['thank', 'thanks']) and len(query_lower) < 30:
        return {
            "answer": "You're welcome! 😊 Feel free to ask if you have more legal questions.",
            "citations": [],
            "related_judgments": []
        }
    return None
