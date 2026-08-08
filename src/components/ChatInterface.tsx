import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  MicOff, 
  ThumbsUp, 
  ThumbsDown, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Bot, 
  User, 
  Copy, 
  Check, 
  MessageSquare,
  Lock,
  Layers,
  FileCode,
  Zap,
  Info,
  ExternalLink,
  Globe,
  FileText
} from 'lucide-react';
import { Message } from '../types';
import { GroundingSentence } from './GroundingSentence';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, customKnowledge?: string) => void;
  isProcessing: boolean;
  onFeedback: (messageId: string, type: 'up' | 'down') => void;
  onOpenPiiAudit?: (message: Message) => void;
  activeDomain: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  onFeedback,
  onOpenPiiAudit,
  activeDomain,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAdhocContext, setShowAdhocContext] = useState(false);
  const [adhocText, setAdhocText] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Voice-to-text Web Speech API integration
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(prev => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
        showToast('Speech recognition error or permission denied');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      showToast('Web Speech API is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        showToast('Listening... Speak now.');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    onSendMessage(inputText.trim(), adhocText.trim() || undefined);
    setInputText('');
    setAdhocText('');
    setShowAdhocContext(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Response copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sample quick prompt chips
  const samplePrompts = [
    'How does Gottman 5:1 ratio and Love Maps improve conflict resolution for romantic couples?',
    'What role does Adult Attachment Theory and EFT play in de-escalating relationship distress for couples?',
    'What risk categories and grounding rules are defined in the EU AI Act?',
    'What are the NIST post-quantum encryption standards for lattice cryptography (ML-KEM)?',
    'How does IPCC AR6 define greenhouse gas reduction targets for 2030 and net-zero?',
    'What are the CRISPR-Cas9 variant analysis guidelines in bioinformatics research?',
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0D14] overflow-hidden relative">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-2xl text-xs font-semibold flex items-center gap-2 border border-indigo-400/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Dock at the Top (UPSIDE) */}
      <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-[#0A0D14]/95 backdrop-blur-xl z-20">
        <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto space-y-2">
          {/* Ad-hoc Context Toggle */}
          {showAdhocContext && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-slate-900 border border-indigo-500/40 rounded-xl space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                <span>Attach Temporary Grounding Snippet (Ad-hoc Document)</span>
                <button
                  type="button"
                  onClick={() => setShowAdhocContext(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Paste specific guideline or article text to ground this turn against..."
                value={adhocText}
                onChange={(e) => setAdhocText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </motion.div>
          )}

          {/* Main Search / Input Box */}
          <div className="relative flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl focus-within:border-indigo-500 transition-all p-1.5">
            <textarea
              rows={2}
              placeholder="Ask TraceableAI a question or search knowledge base across all research domains..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e);
                }
              }}
              className="w-full bg-transparent border-0 text-slate-100 text-xs sm:text-sm px-3 py-1.5 focus:outline-none resize-none placeholder-slate-500"
            />

            {/* Input Action Buttons */}
            <div className="flex items-center space-x-1.5 pl-2 pr-1">
              {/* Adhoc Context Toggle Button */}
              <button
                type="button"
                onClick={() => setShowAdhocContext(prev => !prev)}
                className={`p-2 rounded-xl transition-colors border ${
                  showAdhocContext
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
                }`}
                title="Attach Ad-hoc Grounding Snippet"
              >
                <Layers className="w-4 h-4" />
              </button>

              {/* Voice-to-Text Speech Mic Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2.5 rounded-xl transition-all border ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse border-rose-400 shadow-lg shadow-rose-600/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
                }`}
                title="Voice Input (Speech-to-Text)"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
            <span>Searching Across: <strong>All Domains</strong></span>
            <span>Shift + Enter for new line</span>
          </div>
        </form>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.length === 0 ? (
          /* Empty state */
          <div className="max-w-2xl mx-auto my-auto text-center space-y-6 pt-8">
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 shadow-2xl shadow-indigo-500/30 border border-indigo-400/30">
              <Bot className="w-8 h-8 text-white" />
              <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-[#0A0D14]">
                <ShieldAlert className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                CC AI Explainable Reasoning System
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Ask any question across romantic relationship advice, AI ethics, healthcare, or space research.
                CC AI performs <span className="text-blue-300 font-semibold">question breakdown</span>, <span className="text-cyan-300 font-semibold">trusted source search</span>, <span className="text-purple-300 font-semibold">AI response generation</span>, and <span className="text-emerald-300 font-semibold">fact verification</span>.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Try a Sample Grounding Prompt:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(prompt);
                    }}
                    className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-xs text-slate-300 transition-all text-left flex items-start gap-2 shadow-sm group"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 group-hover:text-cyan-300 transition-colors" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages List */
          messages.map((msg) => {
            const isAssistant = msg.role === 'assistant';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 max-w-4xl ${isAssistant ? 'mr-auto' : 'ml-auto justify-end'}`}
              >
                {/* Avatar Icon */}
                {isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 text-white shadow-md border border-indigo-400/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`flex-1 rounded-2xl p-4 sm:p-5 border shadow-xl ${
                    isAssistant
                      ? 'bg-[#0E131F]/90 border-slate-800/90 text-slate-100'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400/30 text-white max-w-2xl'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200">
                        {isAssistant ? 'TraceableAI Engine' : 'User Query'}
                      </span>
                      {isAssistant && msg.modelMeta && (
                        <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-full">
                          {msg.modelMeta.modelName} ({msg.modelMeta.latencyMs}ms)
                        </span>
                      )}
                    </div>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* PII Redaction Warning Pill (If query contained PII) */}
                  {msg.piiDetections && msg.piiDetections.length > 0 && (
                    <div
                      onClick={() => onOpenPiiAudit?.(msg)}
                      className="mb-3 p-2 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center justify-between cursor-pointer hover:bg-rose-900/60 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>
                          <strong>PII Shield Active:</strong> {msg.piiDetections.length} sensitive entity(ies) masked before model query.
                        </span>
                      </div>
                      <span className="underline font-semibold text-[10px] text-rose-200">Audit PII</span>
                    </div>
                  )}

                  {/* Message Body */}
                  {isAssistant ? (
                    <div>
                      {/* Legend explanation for sentence highlights */}
                      <div className="flex flex-wrap items-center gap-3 mb-3 p-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Grounding Legend:</span>
                        <span className="flex items-center gap-1.5 text-emerald-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          ≥70% Grounded Match
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          &lt;70% General Inference
                        </span>
                      </div>

                      {/* Sentence Groundings Render */}
                      <div className="prose prose-invert max-w-none space-y-1.5 text-sm sm:text-base leading-relaxed">
                        {msg.sentenceGroundings && msg.sentenceGroundings.length > 0 ? (
                          msg.sentenceGroundings.map((sg) => (
                            <GroundingSentence
                              key={sg.sentenceIndex}
                              grounding={sg}
                            />
                          ))
                        ) : (
                          <p>{msg.text}</p>
                        )}
                      </div>

                      {/* Collected Context Sources Bar with Clickable Links */}
                      {msg.contextLedger && msg.contextLedger.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80">
                          <span className="text-[11px] font-bold text-slate-400 block mb-1.5 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-blue-400" />
                            Collected Knowledge Base Sources:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {msg.contextLedger.map((c, i) => (
                              c.sourceUrl ? (
                                <a
                                  key={i}
                                  href={c.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-white bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 px-2.5 py-1 rounded-lg transition-all shadow-sm"
                                >
                                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>{c.sourceName} ({c.weightPercentage}%)</span>
                                  <ExternalLink className="w-3 h-3 text-blue-400" />
                                </a>
                              ) : (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{c.sourceName} ({c.weightPercentage}%)</span>
                                </span>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bottom Controls: Feedback Thumbs Up / Down + Copy */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400 font-medium mr-1">Feedback:</span>
                          <button
                            onClick={() => {
                              onFeedback(msg.id, 'up');
                              showToast('Feedback submitted: Grounding Verified 👍');
                            }}
                            className={`p-1.5 rounded-lg transition-colors border ${
                              msg.feedback === 'up'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                                : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border-slate-800'
                            }`}
                            title="Helpful & Factual Grounding"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              onFeedback(msg.id, 'down');
                              showToast('Feedback submitted: Needs Context Tuning 👎');
                            }}
                            className={`p-1.5 rounded-lg transition-colors border ${
                              msg.feedback === 'down'
                                ? 'bg-rose-950 text-rose-300 border-rose-500'
                                : 'bg-slate-900 text-slate-400 hover:text-rose-300 border-slate-800'
                            }`}
                            title="Inaccurate Grounding"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Response</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* User Message Text */
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>

                {!isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-300 border border-slate-700">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            );
          })
        )}

        {/* Loading Indicator when model generating */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3 p-4 bg-slate-900/90 border border-indigo-500/40 rounded-2xl max-w-md shadow-2xl"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-200 flex items-center gap-2">
                TraceableAI Pipeline Active
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              </p>
              <p className="text-[11px] text-slate-400">
                PII Shielding ➔ Context Retrieval ➔ Grounding Verification...
              </p>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
};
