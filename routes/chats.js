import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Simple keyword-based classifier
function classifyQuestion(question) {
  const dataKeywords = [
    'which sku', 'top', 'highest', 'lowest', 'list', 'show', 'cost increase', 'cost decrease', 'added', 'removed', 'changed', 'percent', 'value', 'details', 'specific', 'how many', 'count', 'name', 'sku', 'price', 'cost', 'trend', 'history'
  ];
  const lower = question.toLowerCase();
  return dataKeywords.some(k => lower.includes(k)) ? 'data' : 'general';
}

function getRelevantData(question, dataSummary) {
  const lower = question.toLowerCase();

  // Detect if question is about a specific SKU (e.g., contains 'sku' and an identifier)
  const skuMatch = lower.match(/sku\s*([a-zA-Z0-9\-_]+)/);
  if (skuMatch) {
    const skuId = skuMatch[1].toLowerCase();
    // Search in changed, added, and removed
    const changed = (dataSummary.changed || []).find(c => (c.sku || '').toLowerCase() === skuId);
    const added = (dataSummary.added || []).find(a => (a.sku || '').toLowerCase() === skuId);
    // For removed, it may be a list of strings or objects
    let removed = null;
    if (Array.isArray(dataSummary.removed)) {
      removed = dataSummary.removed.find(r => {
        if (typeof r === 'string') return r.toLowerCase() === skuId;
        if (typeof r === 'object' && r.sku) return r.sku.toLowerCase() === skuId;
        return false;
      });
    }
    return { sku: skuId, changed, added, removed };
  }

  if (lower.includes('highest') && lower.includes('cost')) {
    return {
      changed: (dataSummary.changed || [])
        .filter(c => typeof c.costChange === 'number')
        .sort((a, b) => b.costChange - a.costChange)
        .slice(0, 10)
    };
  }
  if (lower.includes('added')) {
    return { added: (dataSummary.added || []).slice(0, 10) };
  }
  if (lower.includes('removed')) {
    return { removed: (dataSummary.removed || []).slice(0, 10) };
  }
  // Default: return summary only
  return { summary: dataSummary.summary };
}

router.post('/', async (req, res) => {
  try {
    const { question, insight, dataSummary } = req.body;
    if (!question || !insight || !dataSummary) {
      return res.status(400).json({ error: 'Missing question, insight, or dataSummary' });
    }

    const type = classifyQuestion(question);
    let prompt = '';
    if (type === 'general') {
      prompt = `Here is the current insight (HTML):\n${insight}\nThe user asks: "${question}"\nPlease answer in a clear, business-focused way.`;
    } else {
      const relevantData = getRelevantData(question, dataSummary);
      prompt = `Here is the current insight (HTML):\n${insight}\nHere is the relevant data (JSON):\n${JSON.stringify(relevantData, null, 2)}\nThe user asks: "${question}"\nPlease answer in a clear, business-focused way.`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.3,
      system: "You are a business data assistant. Answer user questions about stock comparison insights and data.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    res.json({ answer: message.content[0].text });
  } catch (err) {
    console.error("Chat failed:", err);
    res.status(500).json({ error: "Failed to process chat request" });
  }
});

export default router;
