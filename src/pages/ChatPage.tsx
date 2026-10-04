import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Scale, Zap, BookOpen, Mic, MicOff, Download, Sparkles, Send, Menu, Plus, Trash2, MessageSquare, ExternalLink, Volume2, VolumeX, Languages } from "lucide-react";
import Header from "@/components/Header";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReadAloudButton } from "@/components/ReadAloudButton";
import { getApiUrl } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";


interface Judgment {
    title: string;
    summary: string;
}

interface Arguments {
    for: string[];
    against: string[];
}

interface NeutralAnalysis {
    factors: string[];
    interpretations: string[];
}

interface Citation {
    source?: string;
    section?: string | null;
    text?: string;
    url?: string;
}

// Minimal typing for the browser speech-recognition API (not in lib.dom)
interface SpeechRecognitionLike {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    start: () => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    originalContent?: string;
    translatedContent?: string;
    isTranslated?: boolean;
    judgments?: Judgment[];
    arguments?: Arguments;
    neutral_analysis?: NeutralAnalysis;
    citations?: Citation[];
}

const QUICK_PROMPTS_EN = [
    { text: "Punishment for Murder", query: "Punishment for murder under BNS" },
    { text: "File Consumer Complaint", query: "How to file a consumer complaint" },
    { text: "Check Cheating Laws", query: "Punishment for cheating" },
    { text: "Draft Rent Agreement", query: "Essentials of a rent agreement" }
];

const QUICK_PROMPTS_HI = [
    { text: "हत्या की सजा (BNS)", query: "BNS के तहत हत्या की सजा क्या है?" },
    { text: "उपभोक्ता शिकायत प्रक्रिया", query: "उपभोक्ता शिकायत कैसे दर्ज करें?" },
    { text: "धोखाधड़ी (चीटिंग) कानून", query: "धोखाधड़ी की सजा और कानूनी प्रावधान" },
    { text: "किराया समझौता नियम", query: "किराया समझौते (Rent Agreement) के आवश्यक नियम" }
];

const LOADING_TEXTS_EN = [
    "Scanning BNS Section 103...",
    "Cross-referencing Judgments...",
    "Analyzing IPC vs BNS...",
    "Verifying Legal Precedents...",
];

const LOADING_TEXTS_HI = [
    "बीएनएस एवं कानूनी धाराओं की खोज...",
    "अदालती फैसलों का संदर्भ...",
    "आईपीसी बनाम बीएनएस विश्लेषण...",
    "कानूनी प्रावधानों का सत्यापन...",
];

const formatMarkdown = (text: string): string => {
  if (!text) return "";
  // 1. Fix collapsed table rows where consecutive pipes join without newline (e.g., "||----------|" or "etc. || Section 103 |")
  let formatted = text.replace(/\|{2,}/g, "|\n|");
  // 2. Ensure a blank line before any table if preceded directly by text
  formatted = formatted.replace(/([^\n])\n(\| ?[^\n]+\| *\n\| *[-:| ]+ *\|)/g, "$1\n\n$2");
  return formatted;
};

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { language, setLanguage } = useLanguage();
  const [domain, setDomain] = useState("all");
  const [argumentsMode, setArgumentsMode] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS_EN[0]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Conversation history state
  const [conversations, setConversations] = useState<Array<{
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
  }>>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth >= 768));

  // Text-to-speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('legal-compass-conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        // Load the most recent conversation
        if (parsed.length > 0) {
          const latest = parsed[0];
          setActiveConversationId(latest.id);
          setMessages(latest.messages);
        }
      } catch (e) {
        console.error('Failed to load conversations:', e);
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  const conversationsLoaded = useRef(false);
  useEffect(() => {
    if (!conversationsLoaded.current) {
      // Skip the initial empty render so we do not wipe saved chats before they load
      conversationsLoaded.current = true;
      return;
    }
    if (conversations.length > 0) {
      localStorage.setItem('legal-compass-conversations', JSON.stringify(conversations));
    } else {
      localStorage.removeItem('legal-compass-conversations');
    }
  }, [conversations]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-to-speech functions
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
        
        const isHindi = /[\u0900-\u097F]/.test(text) || language === 'hi';
        let chosenVoice: SpeechSynthesisVoice | undefined;

        if (isHindi) {
          utterance.lang = 'hi-IN';
          chosenVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('Swara') || v.name.includes('Madhur')) || voices.find(v => v.lang.includes('hi'));
        } else {
          utterance.lang = 'en-IN';
          chosenVoice = voices.find(
            v => (v.lang.includes('IN') || v.lang.startsWith('en')) &&
                 (v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Natural'))
          ) || voices.find(v => v.lang.startsWith('en'));
        }

        if (chosenVoice) {
          utterance.voice = chosenVoice;
          console.log('🎙️ Using voice:', chosenVoice.name);
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
  };

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
        let i = 0;
        const list = language === 'hi' ? LOADING_TEXTS_HI : LOADING_TEXTS_EN;
        interval = setInterval(() => {
            i = (i + 1) % list.length;
            setLoadingText(list[i]);
        }, 800);
    }
    return () => clearInterval(interval);
  }, [isLoading, language]);

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const Recognition = (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
      const recognition = new Recognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      
      recognition.start();
    } else {
      alert("Voice input is not supported in this browser.");
    }
  };

  const getKanoonLink = (source: string, section: string) => {
      // Create a smart search query for Indian Kanoon
      const fullNames: Record<string, string> = {
        BNS: "Bharatiya Nyaya Sanhita",
        IPC: "Indian Penal Code",
        "IT Act": "Information Technology Act 2000",
      };
      const query = encodeURIComponent(`${fullNames[source] ?? source} ${section ?? ""}`.trim());
      return `https://indiankanoon.org/search/?formInput=${query}`;
  };

  const answerSections = (msg: Message) => [
    { title: "Arguments For", items: msg.arguments?.for ?? [] },
    { title: "Arguments Against", items: msg.arguments?.against ?? [] },
    { title: "Key Factors", items: msg.neutral_analysis?.factors ?? [] },
    { title: "Interpretations", items: msg.neutral_analysis?.interpretations ?? [] },
  ];

  const exportPDF = async (msg: Message, query: string) => {
    const { downloadAnswerPdf } = await import("@/lib/pdf");
    await downloadAnswerPdf({
      title: "Nyaya - Research Report",
      meta: `Date: ${new Date().toLocaleDateString()} | Domain: ${domain}`,
      query,
      answer: msg.content,
      sections: answerSections(msg),
      citations: msg.citations,
      filename: "nyaya-research-report.pdf",
    });
  };

  const exportFullChat = async () => {
    const { downloadAnswerPdf } = await import("@/lib/pdf");
    const transcript = messages
      .map((m) => `## ${m.role === "user" ? "You" : "Nyaya"}\n\n${m.content}`)
      .join("\n\n");
    await downloadAnswerPdf({
      title: "Nyaya - Conversation History",
      meta: `Date: ${new Date().toLocaleDateString()} | Domain: ${domain}`,
      answer: transcript,
      filename: "nyaya-conversation.pdf",
    });
  };

  // Conversation management functions
  const createNewChat = () => {
    setMessages([]);
    setActiveConversationId(null);
    setInput("");
  };

  const switchConversation = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setActiveConversationId(conv.id);
      setMessages(conv.messages);
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
  };

  const deleteConversation = (convId: string) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversationId === convId) {
      createNewChat();
    }
  };

  const saveCurrentConversation = (updatedMessages: Message[], conversationId: string) => {
    if (updatedMessages.length === 0) return;

    const title = updatedMessages[0].content.slice(0, 40) + (updatedMessages[0].content.length > 40 ? '...' : '');
    const timestamp = Date.now();

    setConversations(prev =>
      prev.some(c => c.id === conversationId)
        // Update existing conversation
        ? prev.map(c => (c.id === conversationId ? { ...c, messages: updatedMessages, timestamp } : c))
        // Create new conversation, using the same id the backend session uses
        : [{ id: conversationId, title, messages: updatedMessages, timestamp }, ...prev]
    );
  };

  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null);

  const translateMessage = async (index: number, forceTargetLang?: 'en' | 'hi') => {
    const msg = messages[index];
    if (!msg || msg.role !== 'assistant') return;

    const isCurrentlyHindi = /[\u0900-\u097F]/.test(msg.content);
    const target = forceTargetLang || (isCurrentlyHindi ? 'en' : 'hi');

    // If message is already in target language, do nothing
    if ((target === 'en' && !isCurrentlyHindi) || (target === 'hi' && isCurrentlyHindi)) {
      return;
    }

    // If message has cached original/translated content, toggle directly
    if (msg.originalContent && msg.translatedContent) {
      setMessages(prev => prev.map((m, i) => {
        if (i !== index) return m;
        const nextContent = target === 'en'
          ? (/[a-zA-Z]/.test(m.originalContent!) ? m.originalContent! : m.translatedContent!)
          : (/[\u0900-\u097F]/.test(m.originalContent!) ? m.originalContent! : m.translatedContent!);
        return {
          ...m,
          content: nextContent,
          isTranslated: nextContent !== m.originalContent
        };
      }));
      return;
    }

    try {
      setTranslatingIndex(index);
      const response = await fetch(getApiUrl('/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.content, target_language: target })
      });
      const data = await response.json();
      if (data.translated_text) {
        setMessages(prev => prev.map((m, i) => {
          if (i !== index) return m;
          return {
            ...m,
            originalContent: m.originalContent || m.content,
            translatedContent: data.translated_text,
            content: data.translated_text,
            isTranslated: true
          };
        }));
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setTranslatingIndex(null);
    }
  };

  // When language is toggled, auto-translate existing assistant messages to match
  useEffect(() => {
    if (messages.length === 0) return;
    const target = language;
    messages.forEach((m, idx) => {
      if (m.role === 'assistant') {
        const isHindi = /[\u0900-\u097F]/.test(m.content);
        if ((target === 'en' && isHindi) || (target === 'hi' && !isHindi)) {
          translateMessage(idx, target);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Respect the user's active language choice (EN or HI)
    const useLanguage = language;

    const currentSessionId = activeConversationId || `conv_${Date.now()}`;
    if (!activeConversationId) {
        setActiveConversationId(currentSessionId);
    }

    try {
        const response = await fetch(getApiUrl('/query'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                query: text, 
                language: useLanguage, // Use determined language immediately 
                domain, 
                arguments_mode: argumentsMode,
                analysis_mode: analysisMode,
                session_id: currentSessionId
            })
        });
        
        const data = await response.json().catch(() => ({}));
        
        if (data.answer) {
            const newMessages = [...messages, userMsg, { 
                role: 'assistant' as const, 
                content: data.answer,
                judgments: data.related_judgments,
                arguments: data.arguments,
                neutral_analysis: data.neutral_analysis,
                citations: data.citations
            }];
            setMessages(newMessages);
            saveCurrentConversation(newMessages, currentSessionId);
        } else {
             const newMessages = [...messages, userMsg, { role: 'assistant' as const, content: data.detail || "Sorry, I couldn't process that request." }];
             setMessages(newMessages);
             saveCurrentConversation(newMessages, currentSessionId);
        }
    } catch (error) {
        console.error("Chat Error:", error);
        const newMessages = [...messages, userMsg, { role: 'assistant' as const, content: "Error connecting to the server. Please ensure the backend is running." }];
        setMessages(newMessages);
        saveCurrentConversation(newMessages, currentSessionId);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0B0A09] text-white selection:bg-saffron/30 font-sans">
      <Header autoHide />
      
      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden pt-0 [@media(hover:none)]:pt-24">
        
        {/* Sidebar - Now a direct child of the flex container */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-[260px] bg-[#0c0c0e] border-r border-[#1B1916] flex flex-col shrink-0 z-40 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:shadow-2xl"
            >
              <div className="p-3">
                <Button
                  onClick={createNewChat}
                  className="w-full justify-start gap-2 bg-transparent hover:bg-[#1B1916] text-sm font-medium text-gray-200 border border-[#1B1916] h-10 px-3 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </Button>
              </div>

               <div className="flex-1 overflow-y-auto px-2 py-2 no-scrollbar">
                 {conversations.length > 0 && (
                   <div className="mb-4">
                     <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</h3>
                     <div className="space-y-0.5">
                       {conversations.map((conv) => (
                         <div
                           key={conv.id}
                           onClick={() => switchConversation(conv.id)}
                           className={cn(
                             "group relative flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer transition-colors text-sm",
                             activeConversationId === conv.id 
                               ? "bg-[#1B1916] text-white" 
                               : "text-gray-400 hover:bg-[#131210] hover:text-gray-200"
                           )}
                         >
                           <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                           <span className="flex-1 truncate font-normal">
                             {conv.title}
                           </span>
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-6 w-6 opacity-0 group-hover:opacity-100 -mr-1 hover:bg-white/10"
                             onClick={(e) => {
                               e.stopPropagation();
                               deleteConversation(conv.id);
                             }}
                           >
                             <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-400" />
                           </Button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative min-w-0 bg-[#0B0A09]">
           {/* Subtle Background Gradients */}
           {/* Subtle Background Gradients - Removed as per user request */}
           {/* <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-saffron/5 rounded-full blur-[120px]" />
               <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
           </div> */}

           {/* Mobile Sidebar Toggle */}
           {!sidebarOpen && (
             <Button
               variant="ghost"
               size="icon"
               onClick={() => setSidebarOpen(true)}
               className="absolute top-4 left-4 z-30 text-gray-400 hover:text-white hover:bg-[#1B1916]"
             >
               <Menu className="h-5 w-5" />
             </Button>
           )}

           {/* Top Controls Bar - Simplified */}
           <div className="w-full border-b border-[#1B1916] px-6 py-3 flex items-center justify-end gap-3 bg-[#0B0A09]/80 backdrop-blur-sm z-10 max-md:justify-start max-md:overflow-x-auto max-md:px-3 max-md:pl-14 max-md:gap-2 no-scrollbar">
               {sidebarOpen && (
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => setSidebarOpen(false)}
                   className="mr-auto text-gray-400 hover:text-white"
                 >
                   <Menu className="h-5 w-5" />
                 </Button>
               )}
               
               <div className="flex items-center gap-1 bg-[#131210] p-1 rounded-lg border border-[#1B1916]">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setArgumentsMode(!argumentsMode)}
                    className={cn("h-7 px-3 text-xs rounded-md transition-all", argumentsMode ? "bg-saffron/10 text-saffron" : "text-gray-400 hover:text-white")}
                  >
                     <Zap className="w-3 h-3 mr-1.5" /> Args
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setAnalysisMode(!analysisMode)}
                    className={cn("h-7 px-3 text-xs rounded-md transition-all", analysisMode ? "bg-blue-500/10 text-blue-400" : "text-gray-400 hover:text-white")}
                  >
                     <Scale className="w-3 h-3 mr-1.5" /> Analysis
                  </Button>
               </div>


               <div className="h-4 w-px bg-[#1B1916]" />

               {/* Language Toggle */}
               <div className="flex items-center gap-1 bg-[#131210] p-1 rounded-lg border border-[#1B1916]">
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={() => setLanguage('en')}
                     className={cn("h-7 w-7 p-0 text-xs rounded-md transition-all", language === 'en' ? "bg-white/10 text-white font-bold" : "text-gray-500 hover:text-white")}
                   >
                      EN
                   </Button>
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={() => setLanguage('hi')}
                     className={cn("h-7 w-7 p-0 text-xs rounded-md transition-all", language === 'hi' ? "bg-white/10 text-white font-bold" : "text-gray-500 hover:text-white")}
                   >
                      HI
                   </Button>
               </div>
               
               <div className="h-4 w-px bg-[#1B1916]" />

               <Button 
                   variant="ghost" 
                   size="sm"
                   onClick={exportFullChat}
                   disabled={messages.length === 0}
                   className="text-gray-400 hover:text-white"
                   title="Export Full Chat to PDF"
                >
                   <Download className="w-4 h-4" />
                </Button>

                <div className="h-4 w-px bg-[#1B1916]" />

               <Select value={domain} onValueChange={setDomain}>
                   <SelectTrigger className="w-[130px] h-8 bg-transparent border-none text-xs text-gray-300 focus:ring-0">
                       <SelectValue placeholder="Domain" />
                   </SelectTrigger>
                   <SelectContent className="bg-[#131210] border-[#1B1916] text-gray-300">
                       <SelectItem value="all">All Domains</SelectItem>
                       <SelectItem value="criminal">Criminal Law</SelectItem>
                       <SelectItem value="corporate">Corporate Law</SelectItem>
                   </SelectContent>
               </Select>
           </div>

           {/* Messages List */}
           <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
              <div className="max-w-3xl mx-auto space-y-6 pb-4">
                  <AnimatePresence mode="popLayout">
                      {messages.length === 0 && (
                          <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
                          >
                              <div className="w-16 h-16 bg-[#131210] rounded-2xl flex items-center justify-center mb-6 border border-[#1B1916] shadow-xl">
                                  <Sparkles className="w-8 h-8 text-saffron" />
                              </div>
                              <h2 className="text-xl font-medium text-white mb-2">Nyaya</h2>
                              <p className="text-gray-500 max-w-sm mb-8 text-sm leading-relaxed">
                                  {language === 'hi' 
                                      ? "भारतीय कानून (BNS/IPC), अदालती फैसलों और कानूनी दस्तावेजों पर आधारित आपका एआई कानूनी सहायक।"
                                      : "Your advanced legal research assistant. Ask about IPC, BNS, or analyze specific cases."}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                                  {(language === 'hi' ? QUICK_PROMPTS_HI : QUICK_PROMPTS_EN).map((prompt, idx) => (
                                      <button 
                                          key={idx}
                                          onClick={() => handleSend(prompt.query)}
                                          className="text-left p-3 rounded-lg bg-[#131210] border border-[#1B1916] hover:bg-[#1B1916] hover:border-gray-600 transition-all group"
                                      >
                                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                              {prompt.text}
                                          </span>
                                      </button>
                                  ))}
                              </div>
                          </motion.div>
                      )}

                      {messages.map((msg, idx) => (
                          <motion.div 
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn("flex w-full gap-4", msg.role === 'user' ? "justify-end" : "justify-start")}
                          >
                              {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-saffron/20 flex items-center justify-center shrink-0 border border-saffron/20 mt-1">
                                  <Scale className="w-4 h-4 text-saffron" />
                                </div>
                              )}
                              
                              <div className={cn(
                                  "max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed",
                                  msg.role === 'user' 
                                      ? "bg-[#1B1916] text-white rounded-br-none" 
                                      : "bg-transparent text-gray-200 pl-0 pt-1" // Minimal assistant look
                              )}>
                                  {msg.role === 'assistant' ? (
                                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#131210] prose-pre:border prose-pre:border-[#1B1916]">
                                          <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                              table: ({ ...props }) => (
                                                <div className="my-4 w-full overflow-x-auto rounded-lg border border-[#2A2723] bg-[#141210]">
                                                  <table className="w-full min-w-full divide-y divide-[#2A2723] text-left text-xs" {...props} />
                                                </div>
                                              ),
                                              thead: ({ ...props }) => (
                                                <thead className="bg-[#1C1A17] text-gray-200 font-semibold" {...props} />
                                              ),
                                              tbody: ({ ...props }) => (
                                                <tbody className="divide-y divide-[#2A2723]/60 text-gray-300" {...props} />
                                              ),
                                              tr: ({ ...props }) => (
                                                <tr className="hover:bg-white/[0.02] transition-colors" {...props} />
                                              ),
                                              th: ({ ...props }) => (
                                                <th className="px-3.5 py-2.5 text-xs font-semibold text-saffron tracking-wider" {...props} />
                                              ),
                                              td: ({ ...props }) => (
                                                <td className="px-3.5 py-2.5 text-xs text-gray-300 align-top leading-relaxed" {...props} />
                                              ),
                                            }}
                                          >
                                            {formatMarkdown(msg.content)}
                                          </ReactMarkdown>
                                           
                                           
                                           {/* Analysis Cards */}
                                          {(msg.neutral_analysis || msg.arguments || (msg.judgments && msg.judgments.length > 0)) && (
                                             <div className="mt-6 flex flex-col gap-4 not-prose">
                                                {msg.neutral_analysis && (
                                                    <div className="bg-blue-900/10 border border-blue-800/20 rounded-lg p-4">
                                                        <h4 className="flex items-center gap-2 text-blue-400 font-medium mb-3 text-xs uppercase tracking-wider">
                                                            Neutral Analysis
                                                        </h4>
                                                        <div className="grid md:grid-cols-2 gap-4">
                                                           <ul className="text-xs text-blue-200/70 list-disc list-inside space-y-1">
                                                               {msg.neutral_analysis.factors.map((f, i) => <li key={i}>{f}</li>)}
                                                           </ul>
                                                           <ul className="text-xs text-blue-200/70 list-disc list-inside space-y-1">
                                                               {msg.neutral_analysis.interpretations.map((f, i) => <li key={i}>{f}</li>)}
                                                           </ul>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {msg.arguments && (
                                                    <div className="grid md:grid-cols-2 gap-3">
                                                        <div className="bg-emerald-900/10 border border-emerald-800/20 rounded-lg p-3">
                                                            <h4 className="text-emerald-400 font-medium mb-2 text-xs uppercase">Arguments For</h4>
                                                            <ul className="text-xs text-emerald-200/70 list-disc list-inside space-y-1">
                                                                {msg.arguments.for.map((f, i) => <li key={i}>{f}</li>)}
                                                            </ul>
                                                        </div>
                                                        <div className="bg-red-900/10 border border-red-800/20 rounded-lg p-3">
                                                            <h4 className="text-red-400 font-medium mb-2 text-xs uppercase">Arguments Against</h4>
                                                            <ul className="text-xs text-red-200/70 list-disc list-inside space-y-1">
                                                                {msg.arguments.against.map((f, i) => <li key={i}>{f}</li>)}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )}
                                             </div>
                                          )}
                                          
                                          {msg.citations && msg.citations.length > 0 && (
                                              <div className="mt-4 not-prose bg-[#131210] border border-[#1B1916] rounded-xl overflow-hidden">
                                                  <div className="px-4 py-2 bg-[#1f1f23] border-b border-[#1B1916] flex items-center justify-between">
                                                      <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                          <BookOpen className="w-3 h-3" /> Verifiable Sources
                                                      </h4>
                                                  </div>
                                                  <div className="p-1">
                                                      {msg.citations.map((cite, i) => (
                                                          <a 
                                                              key={i} 
                                                              href={getKanoonLink(cite.source, cite.section)}
                                                              target="_blank"
                                                              rel="noopener noreferrer"
                                                              className="flex items-center justify-between px-3 py-2 hover:bg-[#1B1916] rounded-lg group transition-colors text-xs"
                                                          >
                                                              <div className="flex flex-col">
                                                                  <span className="font-medium text-saffron group-hover:text-saffron transition-colors">
                                                                       {cite.section}
                                                                  </span>
                                                                  <span className="text-[10px] text-gray-500">{cite.source}</span>
                                                              </div>
                                                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                  <ExternalLink className="w-3 h-3 text-gray-400 hover:text-white" />
                                                              </div>
                                                          </a>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}
                                           
                                           <div className="mt-4 flex flex-wrap items-center gap-2 justify-start opacity-75 hover:opacity-100 transition-opacity not-prose">
                                               <Button 
                                                   variant="ghost" 
                                                   size="sm" 
                                                   className="h-7 text-xs text-gray-400 hover:text-white hover:bg-[#1B1916] px-2.5 rounded-lg"
                                                   onClick={() => translateMessage(idx)}
                                                   disabled={translatingIndex === idx}
                                                   title="Translate between English and Hindi"
                                               >
                                                   <Languages className="h-3.5 w-3.5 mr-1.5 text-saffron" />
                                                   {translatingIndex === idx 
                                                       ? (language === 'hi' ? 'अनुवाद हो रहा है...' : 'Translating...')
                                                       : (/[\u0900-\u097F]/.test(msg.content) ? 'Translate to English' : 'हिन्दी में अनुवाद')
                                                   }
                                               </Button>
                                               
                                               <Button 
                                                   variant="ghost" 
                                                   size="sm" 
                                                   className="h-7 text-xs text-gray-400 hover:text-white hover:bg-[#1B1916] px-2.5 rounded-lg" 
                                                   onClick={() => handleReadAloud(msg.content, idx)}
                                               >
                                                   {isSpeaking && speakingMessageIndex === idx ? (
                                                       <>
                                                           <VolumeX className="h-3.5 w-3.5 mr-1.5 text-saffron" />
                                                           {language === 'hi' ? 'रोकें' : 'Stop Reading'}
                                                       </>
                                                   ) : (
                                                       <>
                                                           <Volume2 className="h-3.5 w-3.5 mr-1.5" />
                                                           {language === 'hi' ? 'बोलकर सुनें' : 'Read Aloud'}
                                                       </>
                                                   )}
                                               </Button>

                                               <Button 
                                                   variant="ghost" 
                                                   size="sm" 
                                                   className="h-7 text-xs text-gray-400 hover:text-white hover:bg-[#1B1916] px-2.5 rounded-lg" 
                                                   onClick={() => exportPDF(msg, [...messages.slice(0, idx)].reverse().find((m) => m.role === "user")?.content ?? "")}
                                               >
                                                   <Download className="h-3.5 w-3.5 mr-1.5" /> 
                                                   {language === 'hi' ? 'पीडीएफ सहेजें' : 'Save PDF'}
                                               </Button>
                                           </div>
                                      </div>
                                  ) : (
                                      <p>{msg.content}</p>
                                  )}
                              </div>
                          </motion.div>
                      ))}
                      
                      {isLoading && (
                          <motion.div 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-4 pl-0"
                          >
                               <div className="w-8 h-8 rounded-full bg-saffron/20 flex items-center justify-center shrink-0 border border-saffron/20">
                                  <Loader2 className="h-4 w-4 animate-spin text-saffron" />
                               </div>
                              <span className="text-xs font-mono text-gray-500 animate-pulse">{loadingText}</span>
                          </motion.div>
                      )}
                  </AnimatePresence>
                  <div ref={scrollRef} />
              </div>
           </div>

           {/* Input Area */}
           <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
               <div className="relative flex items-center gap-2 bg-[#131210] border border-[#1B1916] rounded-xl p-2 shadow-lg focus-within:ring-1 focus-within:ring-saffron/30 transition-all">
                   <Button 
                       variant={isListening ? "destructive" : "ghost"} 
                       size="icon" 
                       onClick={startListening}
                       className={cn("rounded-lg h-9 w-9 shrink-0", isListening ? "" : "text-gray-400 hover:text-white hover:bg-[#1B1916]")}
                   >
                       {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                   </Button>
                   
                   <Input 
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                       placeholder={isListening ? (language === "hi" ? "सुन रहा हूँ..." : "Listening...") : (language === "hi" ? "कानूनी प्रश्न पूछें... (उदा. किराया समझौता, जमानत के नियम)" : "Ask your legal question... (e.g. Can police arrest without warrant?)")}
                       className="border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-gray-500 h-9 px-2 shadow-none"
                   />
                   
                   <Button 
                       size="icon" 
                       onClick={() => handleSend()}
                       disabled={!input.trim()}
                       className={cn(
                           "rounded-lg h-9 w-9 shrink-0 transition-all",
                           input.trim() ? "bg-saffron hover:bg-saffron/85 text-ink" : "bg-[#1B1916] text-gray-500 cursor-not-allowed"
                       )}
                   >
                       <Send className="h-4 w-4" />
                   </Button>
               </div>
               <div className="mt-2 text-[10px] text-center text-gray-600">
                   {language === "hi" ? "एआई से गलतियां संभव हैं। कृपया महत्वपूर्ण कानूनी जानकारी की पुष्टि करें।" : "AI can make mistakes. Please verify important information."}
               </div>
           </div>

        </main>
      </div>

    </div>
  );
};

export default ChatPage;
