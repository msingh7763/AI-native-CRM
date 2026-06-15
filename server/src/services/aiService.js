const { GoogleGenAI, Type } = require('@google/genai');

const getClient = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = 'gemini-3.5-flash';

exports.generateMongoQueryFromPrompt = async (prompt) => {
  const client = getClient();

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.OBJECT,
        description: 'A valid MongoDB query object for the Customer schema.',
      },
    },
    required: ['query'],
  };

  const systemInstruction = `You translate natural language marketing audience segment requests into valid MongoDB queries for Mongoose.
Schema Context:
Customer { name: String, email: String, phone: String, city: String, totalSpent: Number, lastOrderDate: Date (ISO String) }
Example input: "Customers who spent more than 5000 and haven't ordered in 60 days"
Example output: {"query": {"totalSpent": {"$gt": 5000}, "lastOrderDate": {"$lt": "2024-04-12T00:00:00.000Z"}}}
Current Date for reference: ${new Date().toISOString()}`;

  const result = await client.models.generateContent({
    model: MODEL,
    contents: `${systemInstruction}\n\nUser request: ${prompt}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  try {
    const data = JSON.parse(result.text);
    return data.query;
  } catch (err) {
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

  try {
    return JSON.parse(result.text);
  } catch (err) {
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
