const { GoogleGenAI, Type } = require('@google/genai');

const getClient = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = 'gemini-2.5-flash';

exports.generateMongoQueryFromPrompt = async (prompt) => {
  const client = getClient();

  // Don't constrain with responseSchema here — the nested query object has
  // dynamic keys (like $gt, $lt, field names) that a fixed schema can't describe.
  // Instead ask for raw JSON and parse it ourselves.
  const systemInstruction = `You are a MongoDB query generator for a CRM system.
Convert the user's natural language request into a valid MongoDB query JSON object.

Customer schema fields:
- name: String
- email: String  
- phone: String
- city: String
- totalSpent: Number (total amount spent)
- lastOrderDate: Date (ISO string, e.g. "2026-01-15T00:00:00.000Z")

Rules:
- Return ONLY a raw JSON object (the query itself), no wrapper, no explanation
- Use MongoDB operators: $gt, $lt, $gte, $lte, $eq, $in, $regex, etc.
- For date comparisons, calculate the date from: ${new Date().toISOString()}
- For "inactive X days", use lastOrderDate $lt (today minus X days)
- If no clear filter, return {}

Examples:
Input: "customers who spent more than 5000"
Output: {"totalSpent": {"$gt": 5000}}

Input: "customers inactive for 60 days"
Output: {"lastOrderDate": {"$lt": "${new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()}"}}

Input: "high spenders from Mumbai"
Output: {"totalSpent": {"$gt": 5000}, "city": {"$regex": "Mumbai", "$options": "i"}}`;

  const result = await client.models.generateContent({
    model: MODEL,
    contents: `${systemInstruction}\n\nUser request: ${prompt}`,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const raw = result.text.trim();
  console.log('[AI] Raw query response:', raw);

  try {
    // Strip markdown code fences if model wraps in ```json ... ```
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    // If model returned { query: {...} } wrapper, unwrap it
    if (parsed.query && typeof parsed.query === 'object') {
      return parsed.query;
    }
    return parsed;
  } catch (err) {
    console.error('[AI] Failed to parse query JSON:', raw);
    throw new Error('Failed to parse AI-generated query');
  }
};

exports.generateCampaignContent = async (goal) => {
  const client = getClient();

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      name:                     { type: Type.STRING, description: 'Campaign Name (short and catchy)' },
      subjectLine:              { type: Type.STRING, description: 'Email/SMS subject line' },
      message:                  { type: Type.STRING, description: 'Personalized message body, use [Name] for placeholder' },
      recommendedChannel:       { type: Type.STRING, description: 'One of: WhatsApp, Email, SMS, RCS' },
      targetSegmentDescription: { type: Type.STRING, description: 'A natural language description of who to target' },
    },
    required: ['name', 'subjectLine', 'message', 'recommendedChannel', 'targetSegmentDescription'],
  };

  const result = await client.models.generateContent({
    model: MODEL,
    contents: `You are an expert marketing AI. Generate a campaign based on the provided goal.\n\nCampaign Goal: ${goal}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const raw = result.text.trim();
  console.log('[AI] Raw campaign response:', raw);

  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[AI] Failed to parse campaign JSON:', raw);
    throw new Error('Failed to parse AI-generated campaign');
  }
};

exports.chatWithData = async (prompt, dataContext) => {
  const client = getClient();

  const result = await client.models.generateContent({
    model: MODEL,
    contents: `You are an AI assistant helping a user understand their CRM data. Answer the user's question concisely based on the following context data: ${JSON.stringify(dataContext)}.\n\nUser Question: ${prompt}`,
  });

  return result.text;
};
