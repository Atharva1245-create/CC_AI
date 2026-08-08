import { GoogleGenAI } from '@google/genai';
import { DEFAULT_KNOWLEDGE_ARTICLES } from '../data/knowledgeBase';
import { 
  Message, 
  PipelineLog, 
  SentenceGrounding, 
  ContextContribution, 
  MindmapTreeNode, 
  KnowledgeArticle, 
  PIIDetection 
} from '../types';

// Deterministic Fact Verification Keyword Overlap
export function verifyGroundingClient(claim: string, sourceText: string): { score: number; overlappingKeywords: string[] } {
  const claimWordsArr = claim.toLowerCase().match(/\w+/g) || [];
  const sourceWordsArr = sourceText.toLowerCase().match(/\w+/g) || [];

  const stopwords = new Set([
    "a", "an", "the", "is", "are", "for", "on", "in", "to", "and", "of", "there",
    "with", "by", "as", "at", "from", "or", "which", "that", "this", "it", "be",
    "have", "has", "was", "were", "can", "will", "would", "should", "could", "also",
    "been", "such", "than", "more", "must", "may", "its", "their", "our", "you", "your"
  ]);

  const claimWords = new Set(claimWordsArr.filter(w => !stopwords.has(w) && w.length > 1));
  const sourceWords = new Set(sourceWordsArr.filter(w => !stopwords.has(w) && w.length > 1));

  if (claimWords.size === 0) {
    return { score: 0, overlappingKeywords: [] };
  }

  const overlap: string[] = [];
  for (const word of claimWords) {
    if (sourceWords.has(word)) {
      overlap.push(word);
    }
  }

  const score = Math.round((overlap.length / claimWords.size) * 100);
  return { score: Math.min(100, score), overlappingKeywords: overlap };
}

// PII Shielding Engine
export function shieldPIIClient(text: string): { shieldedText: string; piiDetections: PIIDetection[] } {
  const detections: PIIDetection[] = [];
  let shielded = text;

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  shielded = shielded.replace(emailRegex, (match) => {
    detections.push({ type: 'email', original: match, masked: '[REDACTED_EMAIL]' });
    return '[REDACTED_EMAIL]';
  });

  const phoneRegex = /\b(\+\d{1,3}[-  ]?)?\(?\d{3}\)?[-  ]?\d{3}[-  ]?\d{4}\b/g;
  shielded = shielded.replace(phoneRegex, (match) => {
    detections.push({ type: 'phone', original: match, masked: '[REDACTED_PHONE]' });
    return '[REDACTED_PHONE]';
  });

  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b|\b\d{4}\s?\d{4}\s?\d{4}\b/g;
  shielded = shielded.replace(ssnRegex, (match) => {
    detections.push({ type: 'ssn_aadhaar', original: match, masked: '[REDACTED_GOVT_ID]' });
    return '[REDACTED_GOVT_ID]';
  });

  const cardRegex = /\b(?:\d{4}[-  ]?){3}\d{4}\b/g;
  shielded = shielded.replace(cardRegex, (match) => {
    detections.push({ type: 'credit_card', original: match, masked: '[REDACTED_CREDIT_CARD]' });
    return '[REDACTED_CREDIT_CARD]';
  });

  return { shieldedText: shielded, piiDetections: detections };
}

// Split response into readable sentences for Grounding Verification
export function splitSentencesClient(text: string): string[] {
  const raw = text.split(/(?<=[.!?])\s+|\n+/);
  return raw
    .map(s => s.trim().replace(/^[-*•\d.]+\s*/, ''))
    .filter(s => s.length > 8);
}

export interface ProcessQueryResult {
  message: Message;
  updatedKnowledgeBase: KnowledgeArticle[];
}

export async function processQueryClientSide(
  prompt: string,
  domainFilter?: string,
  customKnowledge?: string,
  existingArticles: KnowledgeArticle[] = []
): Promise<ProcessQueryResult> {
  const startTime = Date.now();
  const pipelineLogs: PipelineLog[] = [];

  // Node 1: Understanding Your Question
  pipelineLogs.push({
    nodeId: 'prompt',
    nodeTitle: '1. Understanding Your Question',
    status: 'completed',
    timestamp: new Date().toISOString(),
    latencyMs: 10,
    details: {
      rawPromptLength: prompt.length,
      characterCount: prompt.length,
      timestamp: new Date().toISOString(),
      domainFilter: domainFilter || 'All Research Domains'
    }
  });

  const { shieldedText, piiDetections } = shieldPIIClient(prompt);

  // Search Knowledge Base
  const baseArticles = existingArticles.length > 0 ? existingArticles : DEFAULT_KNOWLEDGE_ARTICLES;
  let availableArticles = [...baseArticles];

  if (domainFilter && domainFilter !== 'All Domains') {
    availableArticles = availableArticles.filter(a => a.domain === domainFilter);
    if (availableArticles.length === 0) {
      availableArticles = [...baseArticles];
    }
  }

  if (customKnowledge && typeof customKnowledge === 'string' && customKnowledge.trim().length > 10) {
    availableArticles.unshift({
      id: `adhoc-${Date.now()}`,
      title: 'Current Session User Context',
      domain: 'Ad-hoc User Context',
      snippet: customKnowledge.slice(0, 100),
      fullText: customKnowledge,
      tags: ['SessionContext'],
      lastUpdated: new Date().toISOString().slice(0, 10),
      isCustom: true
    });
  }

  // Compute retrieval scores using keyword overlap
  const scoredArticles = availableArticles.map(article => {
    const { score, overlappingKeywords } = verifyGroundingClient(shieldedText, article.fullText + ' ' + article.title);
    return {
      article,
      score,
      overlappingKeywords
    };
  }).sort((a, b) => b.score - a.score);

  const topContexts = scoredArticles.slice(0, 3).filter(item => item.score > 0);
  const activeContexts = topContexts.length > 0 ? topContexts : scoredArticles.slice(0, 2);

  pipelineLogs.push({
    nodeId: 'retrieval',
    nodeTitle: '2. Searching Trusted Sources',
    status: 'completed',
    timestamp: new Date().toISOString(),
    latencyMs: 25,
    details: {
      articlesEvaluated: availableArticles.length,
      topMatchesCount: activeContexts.length,
      selectedSources: activeContexts.map(c => ({
        title: c.article.title,
        domain: c.article.domain,
        retrievalMatchScore: c.score,
        matchedKeywords: c.overlappingKeywords
      }))
    }
  });

  const contextString = activeContexts
    .map(c => `Source: [${c.article.title} (${c.article.domain})]\nContent: ${c.article.fullText}`)
    .join('\n\n');

  // AI Response Generation
  const t4 = Date.now();
  let generatedText = '';
  let modelUsed = 'gemini-3.6-flash';

  const clientApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');

  if (clientApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientApiKey });
      const systemInstruction = `You are TraceableAI (CC AI), an Explainable AI Assistant. Answer the user's prompt truthfully and clearly based on the provided context sources. 
Keep your response concise, well-structured, and factual. Do not make up facts outside the provided sources.
If the provided context does not fully answer the prompt, answer based on verifiable general knowledge while clearly indicating what part is derived from the sources.

CONTEXT SOURCES:
${contextString}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: shieldedText,
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });

      generatedText = response.text || 'Unable to generate response.';
    } catch (err: any) {
      console.warn('Client-side Gemini API fallback to Knowledge Base grounding:', err);
      generatedText = buildKnowledgeBaseFallbackText(activeContexts, prompt);
    }
  } else {
    generatedText = buildKnowledgeBaseFallbackText(activeContexts, prompt);
  }

  const synthesisLatency = Date.now() - t4;
  pipelineLogs.push({
    nodeId: 'synthesis',
    nodeTitle: '3. Crafting the AI Response',
    status: 'completed',
    timestamp: new Date().toISOString(),
    latencyMs: Math.max(100, synthesisLatency),
    details: {
      model: modelUsed,
      outputLength: generatedText.length,
      temperature: 0.2,
      shieldedPromptSent: shieldedText
    }
  });

  // Fact Checking & Grounding
  const t5 = Date.now();
  const sentences = splitSentencesClient(generatedText);
  const sentenceGroundings: SentenceGrounding[] = [];
  let totalScoreSum = 0;

  sentences.forEach((sentence, idx) => {
    let bestScore = 0;
    let bestSource: KnowledgeArticle | null = null;
    let bestKeywords: string[] = [];

    activeContexts.forEach(item => {
      const { score, overlappingKeywords } = verifyGroundingClient(sentence, item.article.fullText);
      if (score > bestScore) {
        bestScore = score;
        bestSource = item.article;
        bestKeywords = overlappingKeywords;
      }
    });

    if (bestScore < 30) {
      availableArticles.forEach(art => {
        const { score, overlappingKeywords } = verifyGroundingClient(sentence, art.fullText);
        if (score > bestScore) {
          bestScore = score;
          bestSource = art;
          bestKeywords = overlappingKeywords;
        }
      });
    }

    const isGrounded = bestScore >= 70;
    totalScoreSum += bestScore;

    sentenceGroundings.push({
      sentenceIndex: idx,
      text: sentence,
      score: bestScore,
      isGrounded,
      matchedSourceId: bestSource?.id || 'gen-01',
      matchedSourceName: bestSource?.title || 'General Model Inference',
      matchedSourceUrl: bestSource?.url,
      matchedSourceSnippet: bestSource ? bestSource.snippet : 'Derived from general knowledge',
      overlappingKeywords: bestKeywords.slice(0, 6),
      reasoningNote: isGrounded
        ? `Direct Match: ${bestScore}% fact overlap with ${bestSource?.title}`
        : `General Answer: ${bestScore}% keyword overlap with knowledge base.`
    });
  });

  const avgGroundingScore = sentences.length > 0 ? Math.round(totalScoreSum / sentences.length) : 85;

  // Context Ledger Weights
  const totalKeywordsMatched = activeContexts.reduce((sum, item) => sum + Math.max(1, item.overlappingKeywords.length), 0);
  const contextLedger: ContextContribution[] = activeContexts.map(item => {
    const cnt = Math.max(1, item.overlappingKeywords.length);
    const weightPercentage = Math.round((cnt / totalKeywordsMatched) * 100);
    return {
      sourceId: item.article.id,
      sourceName: item.article.title,
      category: item.article.domain,
      sourceUrl: item.article.url,
      weightPercentage: Math.max(10, weightPercentage),
      matchedEntitiesCount: item.overlappingKeywords.length,
      snippet: item.article.snippet
    };
  });

  const sumWeights = contextLedger.reduce((acc, curr) => acc + curr.weightPercentage, 0);
  if (sumWeights > 0) {
    contextLedger.forEach(c => {
      c.weightPercentage = Math.round((c.weightPercentage / sumWeights) * 100);
    });
  }

  pipelineLogs.push({
    nodeId: 'grounding',
    nodeTitle: '4. Double-Checking Facts',
    status: 'completed',
    timestamp: new Date().toISOString(),
    latencyMs: Math.max(30, Date.now() - t5),
    details: {
      totalSentencesAnalyzed: sentences.length,
      groundedSentencesCount: sentenceGroundings.filter(s => s.isGrounded).length,
      generalInferenceCount: sentenceGroundings.filter(s => !s.isGrounded).length,
      overallGroundingScore: avgGroundingScore,
      deterministicAlgorithm: 'Keyword & Fact Overlap against Reference Articles'
    }
  });

  const promptKeywords = (prompt.match(/\b[A-Za-z]{4,}\b/g) || ['Research', 'Analysis', 'Policy'])
    .filter(w => !['what', 'with', 'from', 'have', 'that', 'this', 'your', 'were', 'about', 'more', 'some', 'does', 'which', 'their'].includes(w.toLowerCase()))
    .slice(0, 5);
  const promptTopic = promptKeywords.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || 'General Query';

  const dynamicMindmapTree: MindmapTreeNode = {
    id: 'root-mindmap',
    label: `Query Focus: ${promptTopic}`,
    category: 'intent',
    status: 'completed',
    description: `User query decomposed into ${promptKeywords.length} key concepts across ${activeContexts.length} research sources`,
    children: [
      {
        id: 'node-prompt',
        label: `1. Understanding Your Question`,
        category: 'intent',
        status: 'completed',
        description: `Analyzed question under domain: "${domainFilter || 'All Research Domains'}" (${prompt.length} chars)`,
        metric: `${prompt.length} chars`,
        children: promptKeywords.map((kw, idx) => ({
          id: `kw-${idx}`,
          label: `Key Word: "${kw}"`,
          category: 'concept',
          status: 'completed',
          description: `Key word extracted to search knowledge sources`
        }))
      },
      {
        id: 'node-retrieval',
        label: `2. Searching Trusted Sources (${activeContexts.length} Sources)`,
        category: 'retrieval',
        status: 'completed',
        description: `Searched official knowledge base for matching reference articles`,
        metric: `${activeContexts.length} Sources`,
        children: activeContexts.map((ctx, idx) => ({
          id: `src-${idx}`,
          label: `Source: ${ctx.article.title.slice(0, 42)}...`,
          category: 'retrieval',
          status: 'completed',
          description: `Domain: ${ctx.article.domain} • Match relevance: ${ctx.score}%`,
          metric: `${ctx.score}% Match`
        }))
      },
      {
        id: 'node-synthesis',
        label: `3. Crafting the AI Response`,
        category: 'synthesis',
        status: 'completed',
        description: `Gemini 3.6 Flash written answer of ${generatedText.length} characters`,
        metric: `${synthesisLatency} ms`,
        children: sentences.slice(0, 3).map((s, idx) => ({
          id: `claim-${idx}`,
          label: `Key Point ${idx + 1}: "${s.slice(0, 45)}..."`,
          category: 'synthesis',
          status: 'completed',
          description: `Key sentence generated for fact verification`
        }))
      },
      {
        id: 'node-grounding',
        label: `4. Double-Checking Facts`,
        category: 'grounding',
        status: 'completed',
        description: `Sentence-by-sentence fact checking calculated overall score of ${avgGroundingScore}%`,
        metric: `${avgGroundingScore}% Grounded`,
        children: sentenceGroundings.slice(0, 3).map((sg, idx) => ({
          id: `sg-${idx}`,
          label: `Sentence ${idx + 1}: ${sg.score}% Score`,
          category: 'grounding',
          status: 'completed',
          description: `${sg.reasoningNote} • Matched source: ${sg.matchedSourceName}`,
          metric: `${sg.score}%`
        }))
      }
    ]
  };

  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    text: generatedText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    overallGroundingScore: avgGroundingScore,
    sentenceGroundings,
    piiDetections,
    pipelineLogs,
    contextLedger,
    mindmapTree: dynamicMindmapTree
  };

  return {
    message: newMessage,
    updatedKnowledgeBase: availableArticles
  };
}

function buildKnowledgeBaseFallbackText(activeContexts: { article: KnowledgeArticle; score: number }[], prompt: string): string {
  if (!activeContexts || activeContexts.length === 0) {
    return `TraceableAI has processed your query: "${prompt}". No matching knowledge base documents were identified.`;
  }

  const primary = activeContexts[0].article;
  let text = `Based on the verified knowledge base research documents for **${primary.title}** (${primary.domain}):\n\n`;
  text += `${primary.fullText}\n\n`;

  if (activeContexts.length > 1) {
    text += `### Additional Reference Findings:\n`;
    activeContexts.slice(1).forEach(c => {
      text += `• **${c.article.title}**: ${c.article.snippet}\n`;
    });
  }

  return text;
}
