import re

# Read the file
with open('src/pages/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Step 1: Remove the existing Read Aloud button (currently placed after ReactMarkdown)
# This is at lines 713-730
old_button_location = r'''                                            
                                            \{/\* Read Aloud Button \*/\}
                                            <div className="mt-3 flex items-center gap-2 not-prose">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick=\{\(\) => handleReadAloud\(msg\.content, idx\)\}
                                                className="h-8 px-3 text-xs text-gray-400 hover:text-white hover:bg-\[#27272a\] transition-colors"
                                              >
                                                \{isSpeaking && speakingMessageIndex === idx \? \(
                                                  <>
                                                    <VolumeX className="w-3\.5 h-3\.5 mr-1\.5" />
                                                    Stop Reading
                                                  </>
                                                \) : \(
                                                  <>
                                                    <Volume2 className="w-3\.5 h-3\.5 mr-1\.5" />
                                                    Read Aloud
                                                  </>
                                                \)\}
                                              </Button>
                                            </div>
                                            '''

# Remove the old button
content = re.sub(old_button_location, '', content, flags=re.MULTILINE)

# Step 2: Add the Read Aloud button BEFORE the Save PDF button
# Find the Save PDF section and add Read Aloud before it
old_pdf_section = r'''                                            <div className="mt-4 flex gap-2 justify-start opacity-70 hover:opacity-100 transition-opacity">
                                               <Button variant="ghost" size="sm" className="h-6 text-\[10px\] text-gray-500 hover:text-gray-300 px-2" onClick=\{\(\) => exportPDF\(msg, "Legal Query"\)\}>
                                                   <Download className="h-3 w-3 mr-1\.5" /> Save PDF
                                               </Button>
                                           </div>'''

new_pdf_section = '''                                            <div className="mt-4 flex gap-2 justify-start opacity-70 hover:opacity-100 transition-opacity">
                                               {/* Read Aloud Button */}
                                               <Button 
                                                 variant="ghost" 
                                                 size="sm" 
                                                 className="h-6 text-[10px] text-gray-500 hover:text-gray-300 px-2" 
                                                 onClick={() => handleReadAloud(msg.content, idx)}
                                               >
                                                 {isSpeaking && speakingMessageIndex === idx ? (
                                                   <>
                                                     <VolumeX className="h-3 w-3 mr-1.5" />
                                                     Stop
                                                   </>
                                                 ) : (
                                                   <>
                                                     <Volume2 className="h-3 w-3 mr-1.5" />
                                                     Read Aloud
                                                   </>
                                                 )}
                                               </Button>
                                               {/* Save PDF Button */}
                                               <Button variant="ghost" size="sm" className="h-6 text-[10px] text-gray-500 hover:text-gray-300 px-2" onClick={() => exportPDF(msg, "Legal Query")}>
                                                   <Download className="h-3 w-3 mr-1.5" /> Save PDF
                                               </Button>
                                           </div>'''

content = re.sub(old_pdf_section, new_pdf_section, content, flags=re.MULTILINE)

# Write back
with open('src/pages/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Moved Read Aloud button next to Save PDF button!")
