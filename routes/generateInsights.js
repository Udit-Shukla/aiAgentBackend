import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const generateInsightFromChunk = async (changedChunk, addedChunk, removedChunk) => {
  const topChanged = changedChunk
    .sort((a, b) => Math.abs(b.costChange) - Math.abs(a.costChange))
    .slice(0, 10)
    .map(c => `<li><strong>${c.sku}</strong>: $${c.oldCost} → $${c.newCost} (<span style=\"color:red\">${c.costPercent}%</span>)</li>`) 
    .join('');

  const topAdded = addedChunk
    .filter(a => a.cost !== undefined && a.cost !== null)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10)
    .map(a => `<li><strong>${a.sku}</strong>: $${a.cost}</li>`)
    .join('');

  const topRemoved = removedChunk
    .slice(0, 10)
    .map(sku => `<li><strong>${sku}</strong></li>`) 
    .join('');

  const prompt = `
Return this information in HTML format using <h3> for section titles and <ul><li> for lists.
Avoid strategy or general advice. Keep it precise, numeric, and business-useful.

<h3>Significant Cost Changes</h3>
<ul>
${topChanged}
</ul>

<h3>High-Value and Entry-Level SKUs Added</h3>
<ul>
${topAdded}
</ul>

<h3>Notable Removed SKUs</h3>
<ul>
${topRemoved}
</ul>
`.trim();

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    temperature: 0.3,
    system: "You summarize product data changes in clean, business-focused HTML.",
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  return message.content[0].text;
};

const generateFinalInsight = async (insights) => {
  const finalPrompt = `
You are an AI summarizer. Merge the following HTML chunks into one clean report using:
<h2> for section titles and <ul><li> for key insights. No strategy, only what's in the data.

Chunks:
---
${insights.join('\n---\n')}
`.trim();

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    temperature: 0.3,
    system: "You merge HTML insight chunks into final summaries.",
    messages: [
      {
        role: 'user',
        content: finalPrompt
      }
    ]
  });

  return message.content[0].text;
};

router.post('/', async (req, res) => {
  try {
    const { summary, changed, added, removed } = req.body;

    const chunkSize = 100;
    const changedChunks = chunkArray(changed, chunkSize);
    const addedChunks = chunkArray(added, chunkSize);
    const removedChunks = chunkArray(removed, chunkSize);

    const insights = [];

    for (let i = 0; i < Math.max(changedChunks.length, addedChunks.length, removedChunks.length); i++) {
      const changedChunk = changedChunks[i] || [];
      const addedChunk = addedChunks[i] || [];
      const removedChunk = removedChunks[i] || [];

      const chunkInsight = await generateInsightFromChunk(changedChunk, addedChunk, removedChunk);
      insights.push(chunkInsight);
    }

    const finalInsight = await generateFinalInsight(insights);
    const cleanedInsight = finalInsight.replace(/```html|```/g, '').trim();
    
    res.json({ insight: cleanedInsight });

  } catch (err) {
    console.error("Insight generation failed:", err);
    res.status(500).json({ error: "Failed to generate insight" });
  }
});

export default router;