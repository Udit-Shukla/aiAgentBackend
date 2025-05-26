// utils/chunk.js
export function chunkArray(array, size = 100) {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }
  
  // routes/insightRoute.js
  import express from 'express';
  import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
  import { AzureKeyCredential } from "@azure/core-auth";
  import { chunkArray } from '../utils/chunk.js';
  
  const router = express.Router();
  
  const endpoint = "https://models.github.ai/inference";
  const model = "openai/gpt-4.1";
  const token = process.env["GITHUB_TOKEN"];
  
  async function getInsightFromChunk(type, dataChunk) {
    const client = ModelClient(endpoint, new AzureKeyCredential(token));
  
    const prompt = `Here are ${type} SKUs:
  ${JSON.stringify(dataChunk, null, 2)}
  \nPlease summarize trends, notable cost changes, and any patterns.`;
  
    const response = await client.path("/chat/completions").post({
      body: {
        model,
        temperature: 0.7,
        top_p: 1,
        messages: [
          { role: "system", content: "You are a financial insight generator for SKU changes." },
          { role: "user", content: prompt }
        ],
      },
    });
  
    if (isUnexpected(response)) throw response.body.error;
    return response.body.choices[0].message.content;
  }
  
  async function aggregateInsights(insights) {
    const client = ModelClient(endpoint, new AzureKeyCredential(token));
  
    const summaryPrompt = `Combine the following insights into a professional summary:
  ${insights.join("\n\n")}
  
  Return an HTML report with the following sections:
  - Overview
  - Major Cost Drops
  - Top New Additions
  - Key Risks or Opportunities
  - Recommendations
  
  Use <span style='color:green'> for positive, <span style='color:red'> for negative.`;
  
    const response = await client.path("/chat/completions").post({
      body: {
        model,
        temperature: 0.7,
        top_p: 1,
        messages: [
          { role: "system", content: "You are a financial summary assistant." },
          { role: "user", content: summaryPrompt }
        ],
      },
    });
  
    if (isUnexpected(response)) throw response.body.error;
    return response.body.choices[0].message.content;
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
  