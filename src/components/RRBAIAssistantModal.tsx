import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  FlaskConical, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  Award,
  Zap
} from 'lucide-react';
import { askRRBAI, ChatMessage } from '../utils/aiService';

interface RRBAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  activeExamContext?: string;
}

export const RRBAIAssistantModal: React.FC<RRBAIAssistantModalProps> = ({
  isOpen,
  onClose,
  initialPrompt,
  activeExamContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `नमस्ते! 🙏 मैं **RRB AI (आपका AI साथी)** हूँ।\n\nआप मुझसे भारतीय रेलवे (RRB) भर्ती परीक्षाओं के बारे में कुछ भी पूछ सकते हैं, जैसे:\n• **कट-ऑफ और मेरिट लिस्ट** (NTPC, ALP, Technician, Group D, JE)\n• **मार्क्स एनालिसिस और सेफ स्कोर प्रेडिक्शन**\n• **नॉर्मलाइजेशन फॉर्मूला और शिफ्ट डिफिकल्टी**\n• **सिलेबस और एग्जाम पैटर्न (हिंदी/English)**\n• **मेडिकल फिटनेस और DV प्रक्रिया**\n\nआप क्या जानना चाहते हैं? नीचे लिखें या क्विक प्रॉम्प्ट चुनें!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [testResults, setTestResults] = useState<{ testName: string; status: 'pending' | 'passed' | 'failed'; time: number }[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle initial prompt if provided
  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const reply = await askRRBAI(textToSend.trim(), [...messages, userMessage], activeExamContext);

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'माफ़ कीजिये, AI सर्वर से जुड़ने में समस्या हुई। कृपया दोबारा प्रयास करें।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = text.match(/[\u0900-\u097F]/) ? 'hi-IN' : 'en-IN';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleResetChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setTestResults(null);
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: `नमस्ते! आपका चैट रीसेट हो गया है। आप मुझसे रेलवे भर्ती परीक्षाओं से जुड़ा कोई भी प्रश्न पूछ सकते हैं।`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Comprehensive AI Self-Test Suite
  const runAISelfTest = async () => {
    setIsTesting(true);
    setTestResults([]);

    const tests = [
      { name: '1. Cut-off Prediction Engine Test', prompt: 'RRB Technician 2024 Grade 3 cut-off बताओ' },
      { name: '2. Marks & Normalization Formula Test', prompt: 'मेरे 68 raw marks हैं OBC Allahabad CBT-1 mein' },
      { name: '3. Railway Vacancy Intelligence Test', prompt: 'Latest railway vacancies calendar 2024-25' },
      { name: '4. Syllabus & Exam Pattern Test', prompt: 'RRB NTPC CBT 1 syllabus in detail' },
    ];

    const results: { testName: string; status: 'pending' | 'passed' | 'failed'; time: number }[] = [];

    for (const test of tests) {
      const startTime = performance.now();
      try {
        const response = await askRRBAI(test.prompt);
        const duration = Math.round(performance.now() - startTime);
        if (response && response.length > 30) {
          results.push({ testName: test.name, status: 'passed', time: duration });
        } else {
          results.push({ testName: test.name, status: 'failed', time: duration });
        }
      } catch (e) {
        results.push({ testName: test.name, status: 'failed', time: 0 });
      }
      setTestResults([...results]);
    }

    setIsTesting(false);
  };

  const quickPromptChips = [
    '📊 RRB Technician का cut-off बताओ',
    '🎯 मेरे 65 marks पर selection chance क्या है?',
    '📢 Latest Railway Vacancies 2024-25',
    '📚 RRB NTPC CBT-1 Complete Syllabus',
    '⚖️ Normalization formula कैसे काम करता है?',
    '👁️ ALP A-1 Medical Standard क्या होता है?',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl h-[90vh] max-h-[700px] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#031435] via-[#072458] to-[#0c3a82] text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg ring-2 ring-cyan-300/40">
                <Bot className="w-6 h-6" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border border-white" />
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center space-x-1.5 leading-tight">
                  <span>Ask RRB AI</span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </h3>
                <span className="bg-blue-500/30 text-cyan-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-400/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                आपका AI साथी • Indian Railways Knowledge Grounded
              </p>
            </div>
          </div>

          {/* Action Buttons: Self-Test, Reset, Close */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={runAISelfTest}
              disabled={isTesting}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-cyan-200 flex items-center space-x-1 transition-all cursor-pointer"
              title="Test AI Responses"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTesting ? 'Testing...' : 'Self Test'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetChat}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white transition-all cursor-pointer"
              title="Close AI Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Test Results Banner (if ran) */}
        {testResults && testResults.length > 0 && (
          <div className="bg-slate-900 text-white p-3 border-b border-slate-800 text-xs space-y-1.5 animate-in slide-in-from-top">
            <div className="flex items-center justify-between font-bold text-cyan-300">
              <span className="flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>AI Validation & Knowledge Integrity Suite:</span>
              </span>
              <button
                onClick={() => setTestResults(null)}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {testResults.map((res, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1 rounded-lg">
                  <span className="text-slate-200 truncate pr-2">{res.testName}</span>
                  <span className={`font-black text-[10px] px-1.5 py-0.5 rounded ${
                    res.status === 'passed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {res.status === 'passed' ? `✓ PASSED (${res.time}ms)` : '✗ FAILED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs space-y-2 select-text ${
                    isUser
                      ? 'bg-[#c1121f] text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-medium">
                    {msg.text}
                  </div>

                  {/* Message Bottom Bar: Timestamp, Copy, TTS */}
                  <div className={`flex items-center justify-between pt-1 text-[10px] ${
                    isUser ? 'text-red-100' : 'text-slate-400 border-t border-slate-100'
                  }`}>
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSpeak(msg.text)}
                          className="hover:text-blue-600 transition-colors p-1 cursor-pointer"
                          title="Read Out Loud"
                        >
                          {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-blue-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-blue-600 transition-colors p-1 cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-xs p-4 text-xs text-slate-500 flex items-center space-x-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce [animation-delay:0.4s]" />
                <span className="font-semibold text-slate-600 pl-1">RRB AI सोच रहा है...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-white px-4 py-2 border-t border-slate-200 overflow-x-auto scrollbar-none flex items-center space-x-2 shrink-0">
          {quickPromptChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip.replace(/^[^\w\s\u0900-\u097F]+/, '').trim())}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-red-50 hover:text-[#c1121f] text-slate-700 text-[11px] font-bold whitespace-nowrap transition-all border border-slate-200 hover:border-red-200 cursor-pointer shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuery);
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about RRB NTPC, ALP, Technician, Cutoffs, Normalization..."
              className="flex-1 bg-slate-100 border border-slate-300 focus:border-[#c1121f] focus:bg-white rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-3 rounded-2xl bg-[#c1121f] hover:bg-[#a50f1a] disabled:bg-slate-300 text-white transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
