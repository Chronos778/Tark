import re

# Read the file
with open('src/pages/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the onClick handler to use 'idx' instead of 'index'
# The button is using index but should use idx (from the .map((msg, idx) => ...))
content = content.replace(
    'onClick={() => handleReadAloud(msg.content, index)}',
    'onClick={() => handleReadAloud(msg.content, idx)}'
)

# Also fix the isSpeaking check
content = content.replace(
    '{isSpeaking && speakingMessageIndex === index ?',
    '{isSpeaking && speakingMessageIndex === idx ?'
)

# Write back
with open('src/pages/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed index variable to use idx!")
