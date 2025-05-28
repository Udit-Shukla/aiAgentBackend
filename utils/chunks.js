// utils/chunk.js
export function chunkArray(array, size = 100) {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }
  
  // routes/insightRoute.js
  import express from 'express';
  import Anthropic from '@anthropic-ai/sdk';
  import { chunkArray } from '../utils/chunk.js';
  
  const router = express.Router();
  
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  
  async function getInsightFromChunk(type, dataChunk) {
    const prompt = `Here are ${type} SKUs:
  ${JSON.stringify(dataChunk, null, 2)}
  \nPlease summarize trends, notable cost changes, and any patterns.`;
  
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.7,
      system: "You are a financial insight generator for SKU changes.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
  
    return message.content[0].text;
  }
  
  async function aggregateInsights(insights) {
    const summaryPrompt = `Combine the following insights into a professional summary:
  ${insights.join("\n\n")}
  
  Return an HTML report with the following sections:
  - Overview
  - Major Cost Drops
  - Top New Additions
  - Key Risks or Opportunities
  - Recommendations
  
  Use <span style='color:green'> for positive, <span style='color:red'> for negative.`;
  
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.7,
      system: "You are a financial summary assistant.",
      messages: [
        {
          role: 'user',
          content: summaryPrompt
        }
      ]
    });
  
    return message.content[0].text;
  }
  
  router.post('/insight', async (req, res) => {
    try {
      const { summary, changed, added, removed } = req.body;
  
      const chunkedChanged = chunkArray(changed, 100);
      const chunkedAdded = chunkArray(added, 100);
      const chunkedRemoved = chunkArray(removed, 100);
  
      const insights = [];
  
      for (const chunk of chunkedChanged) {
        insights.push(await getInsightFromChunk("changed", chunk));
      }
      for (const chunk of chunkedAdded) {
        insights.push(await getInsightFromChunk("added", chunk));
      }
      for (const chunk of chunkedRemoved) {
        insights.push(await getInsightFromChunk("removed", chunk));
      }
  
      const finalInsight = await aggregateInsights(insights);
      res.json({ insight: finalInsight });
    } catch (err) {
      console.error("Insight generation failed:", err);
      res.status(500).json({ error: "Failed to generate insight" });
    }
  });
  
  export default router;
  