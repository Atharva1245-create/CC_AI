import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Plus, 
  Layers, 
  FileText, 
  Tag, 
  CheckCircle, 
  PieChart, 
  Sparkles,
  Search,
  BookOpen,
  Filter,
  ExternalLink,
  Globe
} from 'lucide-react';
import { ContextContribution, KnowledgeArticle } from '../types';

interface ContextLedgerPanelProps {
  contextLedger?: ContextContribution[];
  knowledgeArticles: KnowledgeArticle[];
  onAddCustomArticle: (article: { title: string; domain: string; url?: string; snippet: string; fullText: string; tags: string[] }) => void;
  onClose?: () => void;
  activeDomain: string;
  setActiveDomain: (domain: string) => void;
}

export const ContextLedgerPanel: React.FC<ContextLedgerPanelProps> = ({
  contextLedger = [],
  knowledgeArticles = [],
  onAddCustomArticle,
  onClose,
  activeDomain,
  setActiveDomain,
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'explorer' | 'add'>('ledger');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for adding custom KB article
  const [customTitle, setCustomTitle] = useState('');
  const [customDomain, setCustomDomain] = useState('Custom Policy DB');
  const [customUrl, setCustomUrl] = useState('');
  const [customText, setCustomText] = useState('');
  const [customTags, setCustomTags] = useState('custom, user-defined');
  const [addSuccess, setAddSuccess] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customText) return;

    onAddCustomArticle({
      title: customTitle,
      domain: customDomain,
      url: customUrl.trim() || undefined,
      snippet: customText.slice(0, 120) + '...',
      fullText: customText,
      tags: customTags.split(',').map(t => t.trim())
    });

    setCustomTitle('');
    setCustomUrl('');
    setCustomText('');
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 3000);
    setActiveTab('explorer');
  };

  const filteredArticles = knowledgeArticles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.fullText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-[#0A0D14]/95 border-l border-slate-800/80 backdrop-blur-2xl text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Context Ledger & Source Weights</h2>
            <p className="text-xs text-slate-400">Knowledge fusion breakdown & document repository</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 bg-slate-950/60 px-4 pt-2 gap-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'ledger'
              ? 'border-blue-500 text-blue-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Active Query Weights ({contextLedger.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('explorer')}
          className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'explorer'
              ? 'border-blue-500 text-blue-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Knowledge Base ({knowledgeArticles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-colors border-b-2 ${
            activeTab === 'add'
              ? 'border-blue-500 text-blue-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Context</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            {contextLedger.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <Database className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No active query context ledger yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Send a prompt in the chat to see real-time source weight breakdown percentages (e.g. NSP Portal: 60%, Buddy4Study: 40%).
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Grounding Source Attribution
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Source weight percentages reflect the entity/keyword relevance contributed by each knowledge base chunk during LLM synthesis.
                  </p>
                </div>

                {/* Progress Bars for Source Contributions */}
                <div className="space-y-3">
                  {contextLedger.map((item, idx) => {
                    const colors = [
                      { bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500/30' },
                      { bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/30' },
                      { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
                    ];
                    const colorScheme = colors[idx % colors.length];

                    return (
                      <div
                        key={item.sourceId || idx}
                        className="p-3.5 bg-slate-900/90 border border-slate-800/90 rounded-2xl space-y-2 shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            {item.sourceName}
                          </span>
                          <span className={`text-sm font-extrabold ${colorScheme.text}`}>
                            {item.weightPercentage}%
                          </span>
                        </div>

                        {/* Progress bar container */}
                        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.weightPercentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full ${colorScheme.bg}`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                            {item.category}
                          </span>
                          <span>{item.matchedEntitiesCount} entities matched</span>
                        </div>

                        <p className="text-xs text-slate-400 bg-slate-950/50 p-2 rounded-lg italic border border-slate-800/50 line-clamp-2">
                          "{item.snippet}"
                        </p>

                        {item.sourceUrl && (
                          <div className="pt-1 flex justify-end">
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors bg-blue-950/40 border border-blue-800/50 px-2.5 py-1 rounded-lg"
                            >
                              <Globe className="w-3 h-3 text-blue-400" />
                              <span>View Source Document</span>
                              <ExternalLink className="w-3 h-3 text-blue-400" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'explorer' && (
          <div className="space-y-3">
            {/* Search and Domain Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search articles & rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Articles List */}
            <div className="space-y-3">
              {filteredArticles.map((art) => (
                <div
                  key={art.id}
                  className="p-3.5 bg-slate-900/80 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-colors space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      {art.title}
                    </h3>
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {art.domain}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    {art.fullText}
                  </p>

                  {/* Clickable Source Link */}
                  {art.url ? (
                    <div className="flex items-center justify-between pt-0.5 border-t border-slate-800/60">
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/80 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        <span>Official Source Link</span>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      </a>
                      <span className="text-[10px] text-slate-500">Updated: {art.lastUpdated}</span>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-0.5 border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-500">Updated: {art.lastUpdated}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 pt-1">
                    {art.tags.map((t, i) => (
                      <span key={i} className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <form onSubmit={handleAddSubmit} className="space-y-4 p-1">
            <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl text-xs text-indigo-200 space-y-1">
              <span className="font-bold block text-indigo-300">Add Custom Knowledge Context</span>
              <p className="text-slate-300">
                Incorporate custom policy documents, guidelines, or rules to test the XAI Grounding Engine in real time.
              </p>
            </div>

            {addSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Custom knowledge article added successfully!
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., State Research Grant Guidelines 2026"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Source Document URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://official-portal.gov.in/guidelines.pdf"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Domain Category
              </label>
              <select
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Custom Policy DB">Custom Policy DB</option>
                <option value="Scholarships & National Portals">Scholarships & National Portals</option>
                <option value="Buddy4Study DB">Buddy4Study Grants</option>
                <option value="Healthcare Policy DB">Healthcare Policy DB</option>
                <option value="Financial & Tax Compliance">Financial & Tax Compliance</option>
                <option value="AI Ethics & Governance">AI Ethics & Governance</option>
                <option value="Bioinformatics & Clinical Research">Bioinformatics & Clinical Research</option>
                <option value="Climate Science & Clean Tech">Climate Science & Clean Tech</option>
                <option value="Quantum Computing & Security">Quantum Computing & Security</option>
                <option value="Space & Satellite Tech">Space & Satellite Tech</option>
                <option value="Romantic Relationships & Couples Psychology">Romantic Relationships & Couples Psychology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Document Text / Rules *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Paste the full factual content or policy text here..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="Research, Grants, HigherEd"
                value={customTags}
                onChange={(e) => setCustomTags(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all"
            >
              Save to Knowledge Base
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
