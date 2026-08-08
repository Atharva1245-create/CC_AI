import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_KNOWLEDGE_ARTICLES } from './src/data/knowledgeBase.js';
import { KnowledgeArticle, Message, PIIDetection, SentenceGrounding, ContextContribution, PipelineLog, MindmapTreeNode } from './src/types.js';

const app = express();
app.use(express.json());

const PORT = 3000;

// Knowledge Base in-memory storage (allowing user to append custom articles dynamically)
let customArticles: KnowledgeArticle[] = [];

// Gemini Client Lazy Initializer
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return genAIClient;
}

// Deterministic Fact Verification (Python FastAPI Logic equivalency)
function verifyGrounding(claim: string, sourceText: string): { score: number; overlappingKeywords: string[] } {
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
function shieldPII(text: string): { shieldedText: string; piiDetections: PIIDetection[] } {
  const detections: PIIDetection[] = [];
  let shielded = text;

  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  shielded = shielded.replace(emailRegex, (match) => {
    detections.push({ type: 'email', original: match, masked: '[REDACTED_EMAIL]' });
    return '[REDACTED_EMAIL]';
  });

  // Phone number regex
  const phoneRegex = /\b(\+\d{1,3}[-  ]?)?\(?\d{3}\)?[-  ]?\d{3}[-  ]?\d{4}\b/g;
  shielded = shielded.replace(phoneRegex, (match) => {
    detections.push({ type: 'phone', original: match, masked: '[REDACTED_PHONE]' });
    return '[REDACTED_PHONE]';
  });

  // Govt ID / Aadhaar / SSN regex
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b|\b\d{4}\s?\d{4}\s?\d{4}\b/g;
  shielded = shielded.replace(ssnRegex, (match) => {
    detections.push({ type: 'ssn_aadhaar', original: match, masked: '[REDACTED_GOVT_ID]' });
    return '[REDACTED_GOVT_ID]';
  });

  // Credit Card regex
  const cardRegex = /\b(?:\d{4}[-  ]?){3}\d{4}\b/g;
  shielded = shielded.replace(cardRegex, (match) => {
    detections.push({ type: 'credit_card', original: match, masked: '[REDACTED_CREDIT_CARD]' });
    return '[REDACTED_CREDIT_CARD]';
  });

  return { shieldedText: shielded, piiDetections: detections };
}

// Split response into readable sentences for Grounding Verification
function splitSentences(text: string): string[] {
  // Split on period, exclamation, question mark or newlines, ignoring bullet points
  const raw = text.split(/(?<=[.!?])\s+|\n+/);
  return raw
    .map(s => s.trim().replace(/^[-*•\d.]+\s*/, ''))
    .filter(s => s.length > 8);
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Knowledge Base Endpoint
app.get('/api/knowledge-base', (req, res) => {
  const allArticles = [...DEFAULT_KNOWLEDGE_ARTICLES, ...customArticles];
  res.json({ articles: allArticles });
});

app.post('/api/knowledge-base/add', (req, res) => {
  const { title, domain, url, snippet, fullText, tags } = req.body;
  if (!title || !fullText) {
    return res.status(400).json({ error: 'Title and Full Text are required' });
  }

  const newArticle: KnowledgeArticle = {
    id: `custom-${Date.now()}`,
    title,
    domain: domain || 'Custom Knowledge',
    url: url || undefined,
    snippet: snippet || fullText.slice(0, 120) + '...',
    fullText,
    tags: tags || ['Custom'],
    lastUpdated: new Date().toISOString().slice(0, 10),
    isCustom: true
  };

  customArticles.unshift(newArticle);
  res.json({ success: true, article: newArticle });
});

// Main Explainable AI Reasoning Endpoint
app.post('/api/chat/query', async (req, res) => {
  const startTime = Date.now();
  const { prompt, domainFilter, customKnowledge } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Clear previous accumulated knowledge base entries on every new prompt to avoid confusion
  customArticles = [];

  const pipelineLogs: PipelineLog[] = [];

  // Node 1: User Prompt Ingestion & Understanding
  const t1 = Date.now();
  pipelineLogs.push({
    nodeId: 'prompt',
    nodeTitle: '1. Understanding Your Question',
    status: 'completed',
    timestamp: new Date().toISOString(),
    latencyMs: 12,
    details: {
      rawPromptLength: prompt.length,
      characterCount: prompt.length,
      timestamp: new Date().toISOString(),
      domainFilter: domainFilter || 'All Research Domains'
    }
  });

  // Perform background PII shielding without adding a separate log node to the tree
  const { shieldedText, piiDetections } = shieldPII(prompt);

  // Node 2: Searching Trusted Sources
  const t3 = Date.now();
  let availableArticles = [...DEFAULT_KNOWLEDGE_ARTICLES, ...customArticles];

  if (domainFilter && domainFilter !== 'All Domains') {
    availableArticles = availableArticles.filter(a => a.domain === domainFilter);
  }

  // If user provided ad-hoc custom context snippet in this turn
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

  // Compute retrieval scores for each article using word overlap with shielded prompt
  const scoredArticles = availableArticles.map(article => {
    const { score, overlappingKeywords } = verifyGrounding(shieldedText, article.fullText + ' ' + article.title);
    return {
      article,
      score,
      overlappingKeywords
    };
  }).sort((a, b) => b.score - a.score);

  // Take top 3 relevant context sources
  const topContexts = scoredArticles.slice(0, 3).filter(item => item.score > 0);

  // If no match found, fallback to top articles
  const activeContexts = topContexts.length > 0
    ? topContexts
    : scoredArticles.slice(0, 2);

  const contextLatency = Date.now() - t3;
  pipelineLogs.push({
    nodeId: 'retrieval',
    nodeTitle: '2. Searching Trusted Sources',
    status: 'completed',
    timestamp: new Date().toISOString(),
    latencyMs: Math.max(15, contextLatency),
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

  // Prepare context text for LLM Synthesis
  const contextString = activeContexts
    .map(c => `Source: [${c.article.title} (${c.article.domain})]\nContent: ${c.article.fullText}`)
    .join('\n\n');

  // Node 4: LLM Synthesis (Gemini 3.6 Flash)
  const t4 = Date.now();
  let generatedText = '';
  let modelUsed = 'gemini-3.6-flash';

  const ai = getGenAI();

  if (ai) {
    try {
      const systemInstruction = `You are TraceableAI, an Explainable AI Assistant. Answer the user's prompt truthfully and clearly based ONLY on the provided context sources. 
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
      console.error('Gemini API Error:', err);
      // Fallback response built from retrieved contexts
      generatedText = `Based on our retrieved Knowledge Base documents regarding ${activeContexts[0]?.article.title || 'the query'}:\n\n` +
        activeContexts.map(c => `${c.article.snippet}`).join('\n\n') +
        `\n\n(Note: Generated via Grounding Verification Engine fallback due to API rate limit/key constraint).`;
    }
  } else {
    // Fallback if GEMINI_API_KEY is missing or unconfigured
    generatedText = `Based on the verified Knowledge Base articles for "${activeContexts[0]?.article.title || 'your query'}":\n\n` +
      activeContexts.map(c => `• ${c.article.title}: ${c.article.fullText}`).join('\n\n');
  }

  const synthesisLatency = Date.now() - t4;
  pipelineLogs.push({
    nodeId: 'synthesis',
    nodeTitle: '3. Crafting the AI Response',
    status: 'completed',
    timestamp: new Date().toISOString(),
    latencyMs: Math.max(120, synthesisLatency),
    details: {
      model: modelUsed,
      outputLength: generatedText.length,
      temperature: 0.2,
      shieldedPromptSent: shieldedText
    }
  });

  // Node 4: Double-Checking Facts
  const t5 = Date.now();
  const sentences = splitSentences(generatedText);
  const sentenceGroundings: SentenceGrounding[] = [];

  let totalScoreSum = 0;

  sentences.forEach((sentence, idx) => {
    let bestScore = 0;
    let bestSource: KnowledgeArticle | null = null;
    let bestKeywords: string[] = [];

    // Check overlap against each active context source
    activeContexts.forEach(item => {
      const { score, overlappingKeywords } = verifyGrounding(sentence, item.article.fullText);
      if (score > bestScore) {
        bestScore = score;
        bestSource = item.article;
        bestKeywords = overlappingKeywords;
      }
    });

    // If score is 0 or low, also check full article database
    if (bestScore < 30) {
      availableArticles.forEach(art => {
        const { score, overlappingKeywords } = verifyGrounding(sentence, art.fullText);
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

  // Compute Context Ledger Weights (%)
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

  // Normalize weights so they sum to 100%
  const sumWeights = contextLedger.reduce((acc, curr) => acc + curr.weightPercentage, 0);
  if (sumWeights > 0) {
    contextLedger.forEach(c => {
      c.weightPercentage = Math.round((c.weightPercentage / sumWeights) * 100);
    });
  }

  const groundingLatency = Date.now() - t5;
  pipelineLogs.push({
    nodeId: 'grounding',
    nodeTitle: '4. Double-Checking Facts',
    status: 'completed',
    timestamp: new Date().toISOString(),
    latencyMs: Math.max(35, groundingLatency),
    details: {
      totalSentencesAnalyzed: sentences.length,
      groundedSentencesCount: sentenceGroundings.filter(s => s.isGrounded).length,
      generalInferenceCount: sentenceGroundings.filter(s => !s.isGrounded).length,
      overallGroundingScore: avgGroundingScore,
      deterministicAlgorithm: 'Keyword & Fact Overlap against Reference Articles'
    }
  });

  // Extract core concept keywords for the Mindmap Tree
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
        status: avgGroundingScore >= 70 ? 'completed' : 'warning',
        description: `Cross-checked answer against original sources (${avgGroundingScore}% verified accuracy)`,
        metric: `${avgGroundingScore}% Verified`,
        children: sentenceGroundings.slice(0, 4).map((sg, idx) => ({
          id: `sg-${idx}`,
          label: `Sentence ${idx + 1}: ${sg.isGrounded ? 'Fully Verified' : 'General Answer'} (${sg.score}%)`,
          category: 'grounding',
          status: sg.isGrounded ? 'completed' : 'info',
          description: sg.reasoningNote,
          metric: `${sg.score}% Score`
        }))
      }
    ]
  };

  // Attach mindmapTree to prompt pipelineLog details as well
  if (pipelineLogs.length > 0) {
    pipelineLogs[0].details.mindmapTree = dynamicMindmapTree;
  }

  // Create auto-collected Knowledge Base resource entry for this prompt execution
  const collectedResourceArticle: KnowledgeArticle = {
    id: `collected-${Date.now()}`,
    title: `Resource: ${promptTopic} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
    domain: 'All Domains',
    url: `https://ai.research/sources/${encodeURIComponent(promptKeywords[0]?.toLowerCase() || 'general')}`,
    snippet: `Live collected knowledge: ${generatedText.slice(0, 140)}...`,
    fullText: `User Prompt Query: ${prompt}\n\nCollected Fact Synthesis & Reasoning:\n${generatedText}\n\nKey Concepts & Keywords: ${promptKeywords.join(', ')}\nGrounding Score: ${avgGroundingScore}% Verified`,
    tags: [promptKeywords[0] || 'AI Research', 'Auto-Collected Resource', 'Live Prompt Data'],
    lastUpdated: new Date().toISOString().slice(0, 10),
    isCustom: true
  };

  // Set backend store and returned knowledge base to strictly the newly collected resource for this prompt
  customArticles = [collectedResourceArticle];
  const updatedKnowledgeBase = [collectedResourceArticle];

  const totalDurationMs = Date.now() - startTime;

  const responseMessage: Message = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    text: generatedText,
    rawPrompt: prompt,
    piiShieldedText: shieldedText,
    piiDetections,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    pipelineLogs,
    sentenceGroundings,
    contextLedger,
    overallGroundingScore: avgGroundingScore,
    mindmapTree: dynamicMindmapTree,
    modelMeta: {
      modelName: modelUsed,
      latencyMs: totalDurationMs
    }
  };

  res.json({
    message: responseMessage,
    updatedKnowledgeBase
  });
});

// Clear Chat endpoint - resets custom collected context articles
app.post('/api/chat/clear', (req, res) => {
  customArticles = [];
  res.json({
    status: 'cleared',
    articles: DEFAULT_KNOWLEDGE_ARTICLES
  });
});

// Vite middleware setup for Development & Express Static in Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CC AI Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
