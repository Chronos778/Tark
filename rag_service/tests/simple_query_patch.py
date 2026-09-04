"""
Simple Query Handler - Add to main.py

Insert this code at the START of the handle_query function (line 53)
Right after "try:" and before "if request.session_id:"
"""

# Fast path for simple queries
query_lower = request.query.lower().strip()
if any(word in query_lower for word in ['hello', 'hi', 'hey']) and len(query_lower) < 20:
    return {
        "answer": "Hello! 👋 I'm **Legal Compass AI**, your Indian legal assistant.\\n\\nI specialize in:\\n- 🏛️ **Criminal Law** (IPC/BNS)\\n- 💻 **IT & Cyber Law**\\n- 🏢 **Corporate Law**\\n- 🛡️ **Consumer Law**\\n- 🚗 **Transport Law**\\n\\nHow can I help you today?",
        "citations": [],
        "related_judgments": []
    }
elif any(word in query_lower for word in ['thank', 'thanks']) and len(query_lower) < 30:
    return {
        "answer": "You're welcome! 😊 Feel free to ask if you have more legal questions.",
        "citations": [],
        "related_judgments": []
    }
