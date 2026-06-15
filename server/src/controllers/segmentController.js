const Customer = require('../models/Customer');
const { generateMongoQueryFromPrompt } = require('../services/aiService');
const { sanitizeQuery } = require('../utils/querySanitizer');

exports.buildSegment = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    // Try Gemini if key is set
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key') {
      try {
        const query = await generateMongoQueryFromPrompt(prompt);
        const safeQuery = sanitizeQuery(query);
        const customers = await Customer.find(safeQuery);
        return res.json({
          segmentName: `Segment: ${prompt}`,
          query: safeQuery,
          audienceCount: customers.length,
        });
      } catch (aiErr) {
        console.warn('[AI] Gemini failed, using fallback:', aiErr.message);
        // Fall through to heuristic fallback below
      }
    }

    // Fallback — keyword-based heuristic parser
    const lowerPrompt = prompt.toLowerCase();
    let dummyQuery = {};

    if (lowerPrompt.includes('spent') || lowerPrompt.includes('spend') || lowerPrompt.includes('value')) {
      const amountMatch = lowerPrompt.match(/\d+/);
      const amount = amountMatch ? parseInt(amountMatch[0]) : 5000;
      if (lowerPrompt.includes('less') || lowerPrompt.includes('under') || lowerPrompt.includes('below')) {
        dummyQuery.totalSpent = { $lt: amount };
      } else {
        dummyQuery.totalSpent = { $gt: amount };
      }
    }
    if (lowerPrompt.includes('from') || lowerPrompt.includes('city')) {
      const cityMatch = lowerPrompt.match(/(?:from|in|city)\s+([a-z]+)/i);
      if (cityMatch) dummyQuery.city = { $regex: cityMatch[1], $options: 'i' };
    }
    if (lowerPrompt.includes('inactive') || lowerPrompt.includes("haven't") || lowerPrompt.includes('days')) {
      const daysMatch = lowerPrompt.match(/(\d+)\s*days/);
      const days = daysMatch ? parseInt(daysMatch[1]) : 60;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      dummyQuery.lastOrderDate = { $lt: cutoff };
    }

    const customers = await Customer.find(dummyQuery);
    return res.json({
      segmentName: `Segment: ${prompt}`,
      query: dummyQuery,
      audienceCount: customers.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
