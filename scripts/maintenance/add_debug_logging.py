import re

# Read the file
with open('src/pages/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the handleReadAloud function
old_function = r'''  // Text-to-speech functions
  const handleReadAloud = \(text: string, messageIndex: number\) => \{
    // If already speaking this message, stop it
    if \(isSpeaking && speakingMessageIndex === messageIndex\) \{
      window\.speechSynthesis\.cancel\(\);
      setIsSpeaking\(false\);
      setSpeakingMessageIndex\(null\);
      return;
    \}

    // Stop any ongoing speech
    window\.speechSynthesis\.cancel\(\);

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance\(text\);
    utterance\.rate = 0\.9; // Slightly slower for legal content
    utterance\.pitch = 1;
    utterance\.volume = 1;

    // Event handlers
    utterance\.onstart = \(\) => \{
      setIsSpeaking\(true\);
      setSpeakingMessageIndex\(messageIndex\);
    \};

    utterance\.onend = \(\) => \{
      setIsSpeaking\(false\);
      setSpeakingMessageIndex\(null\);
    \};

    utterance\.onerror = \(\) => \{
      setIsSpeaking\(false\);
      setSpeakingMessageIndex\(null\);
    \};

    speechSynthesisRef\.current = utterance;
    window\.speechSynthesis\.speak\(utterance\);
  \};'''

new_function = '''  // Text-to-speech functions
  const handleReadAloud = (text: string, messageIndex: number) => {
    console.log('🔊 Read Aloud clicked!', { text: text.substring(0, 50), messageIndex });
    
    // Check browser support
    if (!('speechSynthesis' in window)) {
      console.error('❌ Speech Synthesis not supported in this browser');
      alert('Text-to-speech is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // If already speaking this message, stop it
    if (isSpeaking && speakingMessageIndex === messageIndex) {
      console.log('⏹️ Stopping speech...');
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for legal content
    utterance.pitch = 1;
    utterance.volume = 1;

    console.log('🎤 Starting speech synthesis...');

    // Event handlers
    utterance.onstart = () => {
      console.log('✅ Speech started!');
      setIsSpeaking(true);
      setSpeakingMessageIndex(messageIndex);
    };

    utterance.onend = () => {
      console.log('🏁 Speech ended');
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };

    utterance.onerror = (event) => {
      console.error('❌ Speech error:', event);
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    console.log('📢 Speech queued');
  };'''

new_content = re.sub(old_function, new_function, content, flags=re.MULTILINE)

# Write back
with open('src/pages/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Added debug logging to handleReadAloud!")
