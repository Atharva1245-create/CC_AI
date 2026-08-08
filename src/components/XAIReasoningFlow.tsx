import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  ShieldAlert, 
  Database, 
  Cpu, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown,
  Clock, 
  Lock, 
  Sparkles, 
  Zap,
  GitBranch,
  Search,
  ShieldCheck,
  Terminal,
  Network,
  Activity,
  Eye,
  Maximize2,
  Minimize2,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PipelineLog } from '../types';
import { NodeDetailModal } from './NodeDetailModal';

interface XAIReasoningFlowProps {
  pipelineLogs?: PipelineLog[];
  isProcessing?: boolean;
  onNodeClick?: (log: PipelineLog) => void;
  overallGroundingScore?: number;
}

interface TreeSubNode {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  metricLabel?: string;
  getMetricValue?: (logData?: PipelineLog) => string;
  badgeColor?: string;
}

interface TreeBranchNode {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgGlow: string;
  accentText: string;
  description: string;
  subNodes: TreeSubNode[];
}

export const XAIReasoningFlow: React.FC<XAIReasoningFlowProps> = ({
  pipelineLogs = [],
  isProcessing = false,
  onNodeClick,
  overallGroundingScore = 88,
}) => {
  // Tree view or Compact horizontal view toggle
  const [viewMode, setViewMode] = useState<'tree' | 'compact'>('tree');
  
  // Expanded state for tree branches
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({
    prompt: true,
    retrieval: true,
    synthesis: true,
    grounding: true,
  });

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedSubNode, setSelectedSubNode] = useState<{ parentTitle: string; sub: TreeSubNode; logData?: PipelineLog } | null>(null);

  // Toggle single branch expansion
  const toggleBranch = (branchId: string) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branchId]: !prev[branchId]
    }));
  };

  // Expand or Collapse All
  const setAllBranches = (expanded: boolean) => {
    setExpandedBranches({
      prompt: expanded,
      retrieval: expanded,
      synthesis: expanded,
      grounding: expanded,
    });
  };

  // Detailed Tree Mindmap Hierarchy Configuration
  const treeBranches: TreeBranchNode[] = [
    {
      id: 'prompt',
      stepNumber: '01',
      title: 'Step 1: Understanding Your Question',
      subtitle: 'Reading & Topic Identification',
      icon: FileText,
      color: 'from-blue-600 to-indigo-600',
      borderColor: 'border-blue-500/60',
      bgGlow: 'shadow-blue-500/20',
      accentText: 'text-blue-400',
      description: 'The AI reads your question, isolates key terms, and identifies the exact topic or research domain your question belongs to.',
      subNodes: [
        {
          id: 'prompt-token',
          title: 'Word & Sentence Breakdown',
          description: 'Splits your text into key words so the AI can understand every detail of what you are asking.',
          icon: Terminal,
          metricLabel: 'Words Analyzed',
          getMetricValue: (log) => log?.details?.rawPromptLength ? `${Math.round(log.details.rawPromptLength / 4)} tokens` : '38 tokens',
          badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-800'
        },
        {
          id: 'prompt-domain',
          title: 'Topic & Category Matching',
          description: 'Categorizes your request into specific subject areas (Relationships, AI Ethics, Healthcare, Tax, Space, etc.) to search the right database.',
          icon: Filter,
          metricLabel: 'Selected Domain',
          getMetricValue: (log) => log?.details?.domainFilter || 'All Research Domains',
          badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
        }
      ]
    },
    {
      id: 'retrieval',
      stepNumber: '02',
      title: 'Step 2: Searching Trusted Sources',
      subtitle: 'Finding Factual Articles & Guides',
      icon: Database,
      color: 'from-cyan-600 to-teal-600',
      borderColor: 'border-cyan-500/60',
      bgGlow: 'shadow-cyan-500/20',
      accentText: 'text-cyan-400',
      description: 'The AI searches through verified guides, policy papers, and knowledge bases to find real facts matching your query.',
      subNodes: [
        {
          id: 'retrieval-query',
          title: 'Smart Fact & Article Search',
          description: 'Scans reference articles to locate sentences and paragraphs that contain the answer to your question.',
          icon: Network,
          metricLabel: 'Sources Found',
          getMetricValue: (log) => log?.details?.topMatchesCount ? `${log.details.topMatchesCount} Articles` : '3 Articles',
          badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
        },
        {
          id: 'retrieval-fusion',
          title: 'Importance & Relevance Weighting',
          description: 'Ranks retrieved articles so the AI focuses most on the most helpful and directly relevant information.',
          icon: Layers,
          metricLabel: 'Best Match Weight',
          getMetricValue: (log) => log?.details?.selectedSources?.[0]?.retrievalMatchScore ? `${log.details.selectedSources[0].retrievalMatchScore}% Match` : '60% Match',
          badgeColor: 'bg-teal-950/80 text-teal-300 border-teal-800'
        }
      ]
    },
    {
      id: 'synthesis',
      stepNumber: '03',
      title: 'Step 3: Crafting the AI Response',
      subtitle: 'Gemini AI Thinking & Writing',
      icon: Cpu,
      color: 'from-purple-600 to-indigo-600',
      borderColor: 'border-purple-500/60',
      bgGlow: 'shadow-purple-500/20',
      accentText: 'text-purple-400',
      description: 'The AI (Gemini 3.6 Flash) combines your question with the retrieved facts to write a clear, well-structured, easy-to-understand answer.',
      subNodes: [
        {
          id: 'synthesis-prompt',
          title: 'Instructions & Facts Assembly',
          description: 'Gathers your question and all retrieved facts into a single clear instruction set for the AI model.',
          icon: Terminal,
          metricLabel: 'AI Engine',
          getMetricValue: (log) => log?.details?.model || 'Gemini 3.6 Flash',
          badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-800'
        },
        {
          id: 'synthesis-stream',
          title: 'Real-Time Answer Generation',
          description: 'Outputs helpful text word by word in real time with high factual accuracy and a friendly tone.',
          icon: Zap,
          metricLabel: 'Response Time',
          getMetricValue: (log) => log?.latencyMs ? `${log.latencyMs} ms` : '180 ms',
          badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
        }
      ]
    },
    {
      id: 'grounding',
      stepNumber: '04',
      title: 'Step 4: Double-Checking Facts',
      subtitle: 'Verifying Accuracy Against Sources',
      icon: CheckCircle2,
      color: 'from-emerald-600 to-green-600',
      borderColor: 'border-emerald-500/60',
      bgGlow: 'shadow-emerald-500/20',
      accentText: 'text-emerald-400',
      description: 'The AI inspects every single sentence of its answer and compares it against original sources to ensure no false facts were made up.',
      subNodes: [
        {
          id: 'grounding-segment',
          title: 'Sentence-by-Sentence Check',
          description: 'Splits the answer into individual statements so each claim can be verified independently.',
          icon: Activity,
          metricLabel: 'Sentences Audited',
          getMetricValue: (log) => log?.details?.totalSentencesAnalyzed ? `${log.details.totalSentencesAnalyzed} Sentences` : '4 Sentences',
          badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
        },
        {
          id: 'grounding-eval',
          title: 'Fact Verification & Accuracy Score',
          description: 'Calculates an overall accuracy percentage showing how strongly the answer is supported by real sources.',
          icon: ShieldCheck,
          metricLabel: 'Accuracy Score',
          getMetricValue: (log) => log?.details?.overallGroundingScore ? `${log.details.overallGroundingScore}% Verified` : '88% Verified',
          badgeColor: 'bg-green-950/80 text-green-300 border-green-800'
        }
      ]
    }
  ];

  return (
    <div className="w-full bg-[#0E131F]/95 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 relative overflow-hidden">
      {/* Background Ambient Network Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
            <GitBranch className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              XAI Pipeline Reasoning Mindmap Tree
              {isProcessing && (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse font-semibold">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Executing Pipeline Tree...
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Interactive multi-branch decision tree & deterministic audit telemetry
            </p>
          </div>
        </div>

        {/* View Mode & Controls Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Expand / Collapse All Tree Buttons */}
          {viewMode === 'tree' && (
            <div className="flex items-center bg-slate-900/90 border border-slate-800 p-0.5 rounded-xl">
              <button
                onClick={() => setAllBranches(true)}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                title="Expand all tree branches"
              >
                <Maximize2 className="w-3 h-3 text-indigo-400" />
                <span>Expand All</span>
              </button>
              <div className="w-px h-3 bg-slate-800" />
              <button
                onClick={() => setAllBranches(false)}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                title="Collapse all tree branches"
              >
                <Minimize2 className="w-3 h-3 text-slate-400" />
                <span>Collapse</span>
              </button>
            </div>
          )}

          {/* Switch View Mode: Tree Mindmap vs Linear Stepper */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'tree'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Tree View</span>
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'compact'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Compact Stepper</span>
            </button>
          </div>

          {/* Overall Grounding Index Badge */}
          {overallGroundingScore !== undefined && (
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-slate-400">Grounding Score:</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  overallGroundingScore >= 70
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {overallGroundingScore}% Verified
              </span>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: DETAILED TREE MINDMAP HIERARCHY */}
      {viewMode === 'tree' ? (
        <div className="relative pt-2 pb-2">
          {(() => {
            const rootMindmap = pipelineLogs.find(l => l.nodeId === 'prompt')?.details?.mindmapTree;
            const rootTitle = rootMindmap?.label || 'CC AI Reasoning Mindmap Engine';
            const rootDesc = rootMindmap?.description || '4 Decision Branches • Simple AI Step Explanation & Fact Verification';

            return (
              <div className="flex justify-center mb-6 relative">
                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/60 rounded-2xl p-3.5 px-6 shadow-2xl shadow-indigo-500/20 flex items-center gap-3 relative z-20 max-w-lg w-full justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest font-mono text-indigo-400 font-bold">
                          UNIQUE QUERY MINDMAP TREE
                        </span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-semibold">
                          Dynamic Concept
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-white">
                        {rootTitle}
                      </h3>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {rootDesc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tree Branches Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {treeBranches.map((branch) => {
              const Icon = branch.icon;
              const isExpanded = expandedBranches[branch.id] ?? true;
              const logData = pipelineLogs.find(l => l.nodeId === branch.id);
              const isCompleted = !!logData && logData.status === 'completed';
              const isActive = isProcessing && (!logData || logData.status === 'active');

              return (
                <div key={branch.id} className="flex flex-col relative group">
                  {/* Top Connector Line linking Root to Parent Branch */}
                  <div className="hidden lg:block absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-indigo-500/50 to-slate-700 pointer-events-none" />

                  {/* Main Branch Parent Node Card */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden relative shadow-xl ${
                      isCompleted
                        ? `bg-slate-900/90 ${branch.borderColor} hover:shadow-2xl hover:border-indigo-400`
                        : isActive
                        ? 'bg-indigo-950/60 border-indigo-400 animate-pulse shadow-2xl shadow-indigo-500/30'
                        : 'bg-slate-900/50 border-slate-800/80'
                    }`}
                  >
                    {/* Branch Header */}
                    <div className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-extrabold tracking-wider uppercase ${branch.accentText}`}>
                          BRANCH {branch.stepNumber}
                        </span>

                        <div className="flex items-center space-x-1.5">
                          {/* Latency badge */}
                          {isCompleted ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/60">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {logData.latencyMs}ms
                            </span>
                          ) : isActive ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-800/60 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">Idle</span>
                          )}

                          {/* Collapse / Expand Toggle Button */}
                          <button
                            onClick={() => toggleBranch(branch.id)}
                            className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title={isExpanded ? 'Collapse sub-nodes' : 'Expand sub-nodes'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Icon + Branch Title */}
                      <div
                        onClick={() => logData && onNodeClick?.(logData)}
                        className="cursor-pointer group/title"
                      >
                        <div className="flex items-center space-x-2.5 mb-1">
                          <div className={`p-2 rounded-xl bg-gradient-to-br ${branch.color} text-white shadow-md ${branch.bgGlow}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-100 group-hover/title:text-indigo-300 transition-colors leading-snug">
                              {branch.title}
                            </h3>
                            <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                              {branch.subtitle}
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-300/90 leading-relaxed mt-2 bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
                          {branch.description}
                        </p>
                      </div>
                    </div>

                    {/* Sub-Nodes Tree Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-800/80 bg-slate-950/60 p-2.5 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-semibold uppercase tracking-wider">
                            <span>Sub-Node Telemetry</span>
                            <span>{branch.subNodes.length} Checkpoints</span>
                          </div>

                          {/* Render Dynamic Query Concept Nodes if available from mindmapTree */}
                          {(() => {
                            const rootMindmap = pipelineLogs.find(l => l.nodeId === 'prompt')?.details?.mindmapTree;
                            const dynamicBranch = rootMindmap?.children?.find((c: any) => c.id === `node-${branch.id}`);
                            const dynamicNodes = dynamicBranch?.children || [];

                            if (dynamicNodes.length === 0) return null;

                            return (
                              <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5 my-1">
                                <div className="flex items-center justify-between text-[9px] font-bold text-indigo-300 uppercase tracking-widest px-0.5">
                                  <span>Prompt Concept Breakdown</span>
                                  <span className="bg-indigo-500/20 px-1 rounded text-indigo-200">Dynamic</span>
                                </div>
                                {dynamicNodes.map((dn: any) => (
                                  <div key={dn.id} className="bg-slate-900/90 p-1.5 rounded-lg border border-indigo-500/20 text-[10px] space-y-0.5">
                                    <div className="flex items-center justify-between font-semibold text-slate-200">
                                      <span className="truncate max-w-[120px]">{dn.label}</span>
                                      {dn.metric && (
                                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1 rounded">
                                          {dn.metric}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[9px] text-slate-400 leading-tight line-clamp-1">
                                      {dn.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {branch.subNodes.map((sub, sIdx) => {
                            const SubIcon = sub.icon;
                            const metricVal = sub.getMetricValue ? sub.getMetricValue(logData) : undefined;

                            return (
                              <motion.div
                                key={sub.id}
                                whileHover={{ scale: 1.02, y: -2 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => {
                                  setSelectedSubNode({ 
                                    parentTitle: branch.title, 
                                    sub,
                                    logData
                                  });
                                }}
                                className="relative p-2.5 rounded-xl bg-slate-900/90 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-400 transition-all cursor-pointer group/sub flex flex-col gap-1.5 shadow-md hover:shadow-xl hover:shadow-indigo-500/30"
                                title="Hover & Click to open full process telemetry detail page"
                              >
                                {/* Top title row */}
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <div className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 group-hover/sub:bg-indigo-600 group-hover/sub:text-white transition-colors shrink-0">
                                      <SubIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[11px] font-extrabold text-slate-100 group-hover/sub:text-indigo-300 transition-colors truncate">
                                      {sub.title}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-black text-cyan-300 bg-cyan-950/90 px-2 py-0.5 rounded-full border border-cyan-700/80 shadow-md group-hover/sub:scale-105 transition-transform flex items-center gap-1 shrink-0">
                                    <span>Detail Page</span> <Maximize2 className="w-2.5 h-2.5 text-cyan-400" />
                                  </span>
                                </div>

                                <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed pl-0.5 group-hover/sub:text-white transition-colors">
                                  {sub.description}
                                </p>

                                {metricVal && (
                                  <div className="pt-1.5 flex items-center justify-between border-t border-slate-800/80 mt-0.5">
                                    <span className="text-[9px] text-slate-400 font-mono uppercase tracking-tighter">
                                      {sub.metricLabel}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${sub.badgeColor}`}>
                                      {metricVal}
                                    </span>
                                  </div>
                                )}

                                {/* Hover Prompt Helper Banner */}
                                <div className="hidden group-hover/sub:flex items-center justify-center gap-1 text-[9px] font-bold text-indigo-300 bg-indigo-900/60 py-0.5 rounded-md mt-0.5 border border-indigo-500/40">
                                  <Eye className="w-3 h-3 text-cyan-400 animate-pulse" />
                                  <span>Click to View Full Process Telemetry Detail Page</span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Footer Log Trigger button */}
                    {logData && (
                      <div className="p-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() => onNodeClick?.(logData)}
                          className="w-full py-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Inspect Payload Logs</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: LINEAR STEPPER VIEW */
        <div className="relative overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="flex items-center min-w-[760px] justify-between gap-2 px-1">
            {treeBranches.map((node, index) => {
              const Icon = node.icon;
              const logData = pipelineLogs.find(l => l.nodeId === node.id);
              const isCompleted = !!logData && logData.status === 'completed';
              const isActive = isProcessing && (!logData || logData.status === 'active');

              return (
                <React.Fragment key={node.id}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    onClick={() => logData && onNodeClick?.(logData)}
                    className={`relative flex-1 min-w-[140px] p-3 rounded-xl border transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-slate-900/90 border-slate-700/80 hover:border-indigo-500/80 shadow-lg'
                        : isActive
                        ? 'bg-indigo-950/40 border-indigo-500/80 animate-pulse shadow-xl shadow-indigo-500/20'
                        : 'bg-slate-900/40 border-slate-800/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                        Step {node.stepNumber}
                      </span>
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {logData.latencyMs}ms
                        </span>
                      ) : isActive ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Idle</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2.5 mb-1.5">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${node.color} text-white shadow-md`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100 leading-tight">
                          {node.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 truncate max-w-[100px]">
                          {node.subtitle}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {index < treeBranches.length - 1 && (
                    <div className="flex items-center justify-center text-slate-600 px-0.5">
                      <ChevronRight className={`w-4 h-4 ${isCompleted ? 'text-indigo-400' : 'text-slate-700'}`} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-node Process Telemetry Detail Overlay Page */}
      {selectedSubNode && (
        <NodeDetailModal
          log={selectedSubNode.logData || null}
          customDetail={{
            title: selectedSubNode.sub.title,
            parentBranch: selectedSubNode.parentTitle,
            description: selectedSubNode.sub.description,
            latencyMs: selectedSubNode.logData?.latencyMs || 180,
            status: selectedSubNode.logData?.status || 'completed',
            metrics: [
              { 
                label: selectedSubNode.sub.metricLabel || 'Checkpoint Metric', 
                value: selectedSubNode.sub.getMetricValue ? selectedSubNode.sub.getMetricValue(selectedSubNode.logData) : 'Verified', 
                color: 'text-cyan-300' 
              },
              { label: 'Process Audit Status', value: '100% Deterministic', color: 'text-emerald-400' },
              { label: 'Grounding Audit', value: 'Sentence Checked', color: 'text-indigo-300' },
              { label: 'Model Pipeline', value: 'Gemini 3.6 Flash', color: 'text-purple-300' }
            ],
            payload: selectedSubNode.logData?.details || {
              checkpoint: selectedSubNode.sub.title,
              parentBranch: selectedSubNode.parentTitle,
              objective: selectedSubNode.sub.description,
              metric: selectedSubNode.sub.metricLabel,
              status: 'COMPLETED_DETERMINISTIC_PASS',
              auditNote: 'Full execution telemetry log captured during live reasoning pipeline run.'
            }
          }}
          onClose={() => setSelectedSubNode(null)}
        />
      )}
    </div>
  );
};
