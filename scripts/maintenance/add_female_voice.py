import re

# Read the file
with open('src/pages/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the handleReadAloud function and replace it with a version that:
# 1. Waits for voices to load
# 2. Selects a female voice
# 3. Has a small delay to prevent interruption

old_function_pattern = r'''  // Text-to-speech functions
  const handleReadAloud = \(text: string, messageIndex: number\) => \{
    console\.log\('🔊 Read Aloud clicked!', \{ text: text\.substring\(0, 50\), messageIndex \}\);
    
    // Check browser support
    if \(!\('speechSynthesis' in window\)\) \{
      console\.error\('❌ Speech Synthesis not supported in this browser'\);
      alert\('Text-to-speech is not supported in your browser\. Please use Chrome, Edge, or Safari\.'\);
      return;
    \}

    // If already speaking this message, stop it
    if \(isSpeaking && speakingMessageIndex === messageIndex\) \{
      console\.log\('⏹️ Stopping speech\.\.\.'\);
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

    console\.log\('🎤 Starting speech synthesis\.\.\.'\);

    // Event handlers
    utterance\.onstart = \(\) => \{
      console\.log\('✅ Speech started!'\);
      setIsSpeaking\(true\);
      setSpeakingMessageIndex\(messageIndex\);
    \};

    utterance\.onend = \(\) => \{
      console\.log\('🏁 Speech ended'\);
      setIsSpeaking\(false\);
      setSpeakingMessageIndex\(null\);
    \};

    utterance\.onerror = \(event\) => \{
      console\.error\('❌ Speech error:', event\);
      setIsSpeaking\(false\);
      setSpeakingMessageIndex\(null\);
    \};

    speechSynthesisRef\.current = utterance;
    window\.speechSynthesis\.speak\(utterance\);
    console\.log\('📢 Speech queued'\);
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

    // Small delay to prevent interruption error
    setTimeout(() => {
      // Get available voices
      let voices = window.speechSynthesis.getVoices();
      
      // If voices aren't loaded yet, wait for them
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          startSpeaking(voices);
        };
      } else {
        startSpeaking(voices);
      }

      function startSpeaking(voices: SpeechSynthesisVoice[]) {
        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Select a female voice (prefer Google US English Female or similar)
        const femaleVoice = voices.find(
          voice => voice.name.includes('Female') || 
                   voice.name.includes('Google') && voice.name.includes('US') ||
                   voice.name.includes('Samantha') || 
                   voice.name.includes('Zira') ||
                   voice.name.includes('Microsoft') && voice.name.includes('Female')
        ) || voices.find(voice => voice.lang.startsWith('en'));

        if (femaleVoice) {
          utterance.voice = femaleVoice;
          console.log('🎙️ Using voice:', femaleVoice.name);
        }

        utterance.rate = 0.85; // Slower, softer pace
        utterance.pitch = 1.1; // Slightly higher pitch for softer sound
        utterance.volume = 0.9; // Slightly softer volume

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
      }
    }, 100); // 100ms delay to prevent interruption
  };'''

new_content = re.sub(old_function_pattern, new_function, content, flags=re.MULTILINE)

# Write back
with open('src/pages/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Added female voice selection and fixed interruption issue!")
