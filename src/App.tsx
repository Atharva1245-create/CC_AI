import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { XAIReasoningFlow } from './components/XAIReasoningFlow';
import { ChatInterface } from './components/ChatInterface';
import { ContextLedgerPanel } from './components/ContextLedgerPanel';
import { NodeDetailModal } from './components/NodeDetailModal';
import { PIIAuditModal } from './components/PIIAuditModal';
import { AuthModal } from './components/AuthModal';
import { SavedSessionsModal } from './components/SavedSessionsModal';
import { Message, KnowledgeArticle, PipelineLog, UserProfile, ContextContribution, SavedSession } from './types';
import { DEFAULT_KNOWLEDGE_ARTICLES } from './data/knowledgeBase';
import { processQueryClientSide } from './utils/clientQueryEngine';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showReasoningFlow, setShowReasoningFlow] = useState<boolean>(true);
  const [showContextLedger, setShowContextLedger] = useState<boolean>(true);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([]);
  const [activeDomain, setActiveDomain] = useState<string>('All Domains');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Saved Chat Sessions History state
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
    try {
      const stored = localStorage.getItem('cc_ai_saved_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Modals state
  const [selectedNodeLog, setSelectedNodeLog] = useState<PipelineLog | null>(null);
  const [selectedPiiMessage, setSelectedPiiMessage] = useState<Message | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(true);

  // User auth state
  const [user, setUser] = useState<UserProfile>({
    name: 'Auditor',
    email: '',
    avatar: '',
    role: 'CC AI Auditor',
    isAuthenticated: false,
  });

  // Save sessions to localStorage when updated
  useEffect(() => {
    try {
      localStorage.setItem('cc_ai_saved_sessions', JSON.stringify(savedSessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage:', e);
    }
  }, [savedSessions]);

  // Fetch latest Knowledge Base from backend on mount
  useEffect(() => {
    fetch('/api/knowledge-base')
      .then(res => {
        if (!res.ok) throw new Error('Backend route not available');
        return res.json();
      })
      .then(data => {
        if (data.articles && Array.isArray(data.articles)) {
          setKnowledgeArticles(data.articles);
        } else {
          setKnowledgeArticles(DEFAULT_KNOWLEDGE_ARTICLES);
        }
      })
      .catch(err => {
        console.warn('Backend KB route unavailable (e.g. Netlify deployment). Loading default knowledge base:', err);
        setKnowledgeArticles(DEFAULT_KNOWLEDGE_ARTICLES);
      });
  }, []);

  // Latest pipeline logs and context ledger from the most recent message
  const latestMessage = messages.slice().reverse().find(m => m.role === 'assistant');
  const activePipelineLogs = latestMessage?.pipelineLogs || [];
  const activeContextLedger = latestMessage?.contextLedger || [];
  const overallGroundingScore = latestMessage?.overallGroundingScore;

  // Clear Chat handler: Saves active session to History, then clears chat AND context ledger
  const handleClearChat = async () => {
    if (messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const sessionTitle = firstUserMsg 
        ? firstUserMsg.text.slice(0, 60) + (firstUserMsg.text.length > 60 ? '...' : '')
        : 'Saved Query Session';

      const lastAssistantMsg = messages.slice().reverse().find(m => m.role === 'assistant');

      const newSession: SavedSession = {
        id: `session-${Date.now()}`,
        title: sessionTitle,
        timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        messages: [...messages],
        knowledgeArticles: [...knowledgeArticles],
        groundingScore: lastAssistantMsg?.overallGroundingScore
      };

      setSavedSessions(prev => [newSession, ...prev]);
    }

    // Clear active chat state
    setMessages([]);

    // Clear context ledger and knowledge articles completely
    setKnowledgeArticles([]);

    // Call backend to clear server-side custom articles
    try {
      await fetch('/api/chat/clear', { method: 'POST' });
    } catch (err) {
      console.error('Failed to clear backend articles:', err);
    }
  };

  // Restore a saved session back into the active workspace
  const handleRestoreSession = (session: SavedSession) => {
    setMessages(session.messages);
    if (session.knowledgeArticles && session.knowledgeArticles.length > 0) {
      setKnowledgeArticles(session.knowledgeArticles);
    }
    setShowHistoryModal(false);
  };

  // Delete a saved session from history
  const handleDeleteSession = (sessionId: string) => {
    setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  // Clear all saved sessions
  const handleClearAllSessions = () => {
    setSavedSessions([]);
  };

  // Toggle user login modal
  const handleToggleAuth = () => {
    if (user.isAuthenticated) {
      setUser(prev => ({
        ...prev,
        isAuthenticated: false
      }));
      setShowAuthModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  // Sign in success callback
  const handleSignInSuccess = (userData: { email: string; name: string }) => {
    setUser({
      name: userData.name,
      email: userData.email,
      avatar: '',
      role: 'CC AI Auditor',
      isAuthenticated: true
    });
  };

  // Send Query to CC AI Backend
  const handleSendMessage = async (promptText: string, customKnowledge?: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    // Instantly wipe knowledge base data for the new prompt to avoid confusion
    setKnowledgeArticles([]);

    try {
      let data: any = null;

      try {
        const res = await fetch('/api/chat/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            domainFilter: activeDomain,
            customKnowledge
          })
        });

        if (res.ok) {
          data = await res.json();
        } else {
          console.warn(`Express backend returned HTTP ${res.status}. Switching to client-side CC AI reasoning engine...`);
        }
      } catch (networkErr) {
        console.warn('Backend server route not reachable (e.g. Netlify static hosting). Running client-side CC AI reasoning engine...');
      }

      // If backend server responded with valid data
      if (data && data.message) {
        setMessages(prev => [...prev, data.message]);
        if (data.updatedKnowledgeBase && Array.isArray(data.updatedKnowledgeBase)) {
          setKnowledgeArticles(data.updatedKnowledgeBase);
        }
      } else {
        // Fallback: Run seamless client-side CC AI reasoning pipeline
        const clientResult = await processQueryClientSide(promptText, activeDomain, customKnowledge, DEFAULT_KNOWLEDGE_ARTICLES);
        setMessages(prev => [...prev, clientResult.message]);
        setKnowledgeArticles(clientResult.updatedKnowledgeBase);
      }
    } catch (err: any) {
      console.error('Error processing query:', err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `An error occurred while processing your query with CC AI engine: ${err.message || 'Please check input.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        overallGroundingScore: 0
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add Custom Article Handler
  const handleAddCustomArticle = async (articleData: { title: string; domain: string; snippet: string; fullText: string; tags: string[] }) => {
    try {
      const res = await fetch('/api/knowledge-base/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      });
      const data = await res.json();
      if (data.article) {
        setKnowledgeArticles(prev => [data.article, ...prev]);
      }
    } catch (err) {
      console.error('Failed to save article to backend:', err);
    }
  };

  // Feedback handler
  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, feedback: type } : m))
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0D14] text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Aura Highlights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header Bar */}
        <Header
          onClearChat={handleClearChat}
          onOpenHistory={() => setShowHistoryModal(true)}
          savedSessionsCount={savedSessions.length}
          showReasoningFlow={showReasoningFlow}
          setShowReasoningFlow={setShowReasoningFlow}
          showContextLedger={showContextLedger}
          setShowContextLedger={setShowContextLedger}
          user={user}
          onToggleAuth={handleToggleAuth}
          activeDomain={activeDomain}
          setActiveDomain={setActiveDomain}
        />

        {/* Main Body Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 flex flex-col gap-6 overflow-hidden">
          {/* Top Section (UPSIDE): Chat Interface & Context Ledger with Search Bar */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-[500px] overflow-hidden">
            {/* Main Chat Interface */}
            <div className="flex-1 flex flex-col min-w-0 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl bg-[#0A0D14]/80 backdrop-blur-md">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                onFeedback={handleFeedback}
                onOpenPiiAudit={(msg) => setSelectedPiiMessage(msg)}
                activeDomain={activeDomain}
              />
            </div>

            {/* Context Ledger & Grounding Panel (Right Drawer / Column) */}
            {showContextLedger && (
              <div className="w-full lg:w-96 flex flex-col shrink-0 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
                <ContextLedgerPanel
                  contextLedger={activeContextLedger}
                  knowledgeArticles={knowledgeArticles}
                  onAddCustomArticle={handleAddCustomArticle}
                  onClose={() => setShowContextLedger(false)}
                  activeDomain={activeDomain}
                  setActiveDomain={setActiveDomain}
                />
              </div>
            )}
          </div>

          {/* Bottom Section (DOWNSIDE): Visual Reasoning Mindmap Flowchart (Only visible when user provides a prompt) */}
          {showReasoningFlow && (messages.length > 0 || isProcessing) && (
            <div className="border border-slate-800/80 rounded-2xl p-4 bg-[#0A0D14]/90 shadow-2xl">
              <XAIReasoningFlow
                pipelineLogs={activePipelineLogs}
                isProcessing={isProcessing}
                onNodeClick={(log) => setSelectedNodeLog(log)}
                overallGroundingScore={overallGroundingScore}
              />
            </div>
          )}
        </main>
      </div>

      {/* Telemetry Log Modal */}
      <NodeDetailModal
        log={selectedNodeLog}
        onClose={() => setSelectedNodeLog(null)}
      />

      {/* PII Audit Modal */}
      <PIIAuditModal
        message={selectedPiiMessage}
        onClose={() => setSelectedPiiMessage(null)}
      />

      {/* User Sign In Modal Dialog */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignInSuccess={handleSignInSuccess}
      />

      {/* Saved Chat Sessions History Modal */}
      <SavedSessionsModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        savedSessions={savedSessions}
        onRestoreSession={handleRestoreSession}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
      />
    </div>
  );
}
