export interface PIIDetection {
  type: 'email' | 'phone' | 'ssn_aadhaar' | 'credit_card' | 'ip_address';
  original: string;
  masked: string;
}

export interface SentenceGrounding {
  sentenceIndex: number;
  text: string;
  score: number; // 0 - 100
  isGrounded: boolean; // score >= 70
  matchedSourceId?: string;
  matchedSourceName?: string;
  matchedSourceUrl?: string;
  matchedSourceSnippet?: string;
  overlappingKeywords: string[];
  reasoningNote: string;
}

export interface ContextContribution {
  sourceId: string;
  sourceName: string;
  category: string;
  sourceUrl?: string;
  weightPercentage: number;
  matchedEntitiesCount: number;
  snippet: string;
}

export interface MindmapTreeNode {
  id: string;
  label: string;
  category: 'intent' | 'pii' | 'retrieval' | 'synthesis' | 'grounding' | 'concept' | 'source' | 'claim';
  status: 'completed' | 'warning' | 'info';
  description: string;
  metric?: string;
  children?: MindmapTreeNode[];
}

export interface PipelineLog {
  nodeId: 'prompt' | 'retrieval' | 'synthesis' | 'grounding' | 'pii';
  nodeTitle: string;
  status: 'idle' | 'active' | 'completed' | 'error';
  timestamp: string;
  latencyMs: number;
  details: Record<string, any>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  rawPrompt?: string;
  piiShieldedText?: string;
  piiDetections?: PIIDetection[];
  timestamp: string;
  pipelineLogs?: PipelineLog[];
  sentenceGroundings?: SentenceGrounding[];
  contextLedger?: ContextContribution[];
  overallGroundingScore?: number;
  mindmapTree?: MindmapTreeNode;
  modelMeta?: {
    modelName: string;
    latencyMs: number;
    totalTokens?: number;
  };
  feedback?: 'up' | 'down';
  feedbackNote?: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  domain: string;
  url?: string;
  snippet: string;
  fullText: string;
  tags: string[];
  lastUpdated: string;
  isCustom?: boolean;
}

export interface SavedSession {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
  knowledgeArticles: KnowledgeArticle[];
  groundingScore?: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: string;
  isAuthenticated: boolean;
}
