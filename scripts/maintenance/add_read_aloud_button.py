import re

# Read the file
with open('src/pages/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The code to insert
button_code = '''
                                           
                                           {/* Read Aloud Button */}
                                           <div className="mt-3 flex items-center gap-2 not-prose">
                                             <Button
                                               variant="ghost"
                                               size="sm"
                                               onClick={() => handleReadAloud(msg.content, index)}
                                               className="h-8 px-3 text-xs text-gray-400 hover:text-white hover:bg-[#27272a] transition-colors"
                                             >
                                               {isSpeaking && speakingMessageIndex === index ? (
                                                 <>
                                                   <VolumeX className="w-3.5 h-3.5 mr-1.5" />
                                                   Stop Reading
                                                 </>
                                               ) : (
                                                 <>
                                                   <Volume2 className="w-3.5 h-3.5 mr-1.5" />
                                                   Read Aloud
                                                 </>
                                               )}
                                             </Button>
                                           </div>'''

# Find and replace
search_pattern = r'(<ReactMarkdown>\{msg\.content\}</ReactMarkdown>)\s*\r?\n\s*\r?\n\s*(\{/\* Analysis Cards \*/\})'
replacement = r'\1' + button_code + r'\n                                           \n                                           \2'

new_content = re.sub(search_pattern, replacement, content)

# Write back
with open('src/pages/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Read Aloud button added successfully!")
