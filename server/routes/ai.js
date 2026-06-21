// routes/ai.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ============ GROQ API for Chat ============
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Massive keyword‑based Q&A for ladies' fashion & duplicate jewellery e‑commerce
const keywordResponses = [
  // Dresses
  { keywords: ['dress', 'gown', 'lehenga', 'anarkali', 'saree', 'ethnic', 'western'], 
    response: "👗 We have a wide collection of dresses: party gowns, casual dresses, wedding lehengas, anarkali suits, and more. Which occasion are you shopping for?" },
  { keywords: ['size', 'fitting', 'measurement'], 
    response: "📏 Our size chart (XS-XXL) is available on each product page. For custom measurements, please contact our support team." },
  { keywords: ['fabric', 'material', 'silk', 'cotton', 'georgette', 'chiffon'], 
    response: "🧵 Our dresses are made from premium fabrics: pure silk, soft cotton, georgette, chiffon, and net. Each product page lists the material composition." },
  { keywords: ['color', 'shade', 'tone'], 
    response: "🎨 We offer dresses in every color – from classic reds and navies to pastels and vibrant jewel tones. Use the color filter to find your perfect shade!" },
  { keywords: ['return', 'exchange', 'refund'], 
    response: "🔄 We offer easy 7‑day returns & exchanges for unused items. Please check our Return Policy page for details." },
  { keywords: ['delivery', 'shipping', 'track'], 
    response: "🚚 We ship worldwide within 5‑7 business days. You'll receive a tracking link via email once your order is dispatched." },
  { keywords: ['price', 'cost', 'budget', 'affordable'], 
    response: "💰 Our prices range from ₹1,000 to ₹15,000. We also have frequent sales and discounts – check the 'Offers' section!" },
  
  // Jewellery (duplicate / artificial)
  { keywords: ['jewellery', 'jewelry', 'necklace', 'earrings', 'bangles', 'ring', 'set'], 
    response: "💍 Our jewellery collection includes necklaces, earrings, bangles, rings, and complete bridal sets – all high‑quality artificial/duplicate jewellery at affordable prices." },
  { keywords: ['artificial', 'duplicate', 'imitation', 'costume', 'fashion jewellery'], 
    response: "✨ Yes, we specialise in premium artificial/duplicate jewellery that looks exactly like real gold/diamond. Perfect for weddings, parties, and daily wear!" },
  { keywords: ['gold', 'silver', 'rhodium', 'plated'], 
    response: "🔶 Our jewellery is made with high‑quality alloy and plated with gold/silver/rhodium for a lasting shine. Hypoallergenic and skin‑friendly." },
  { keywords: ['stone', 'kundan', 'polki', 'meenakari', 'american diamond'], 
    response: "💎 We offer Kundan, Polki, Meenakari, and American diamond sets. Each piece is handcrafted with attention to detail." },
  { keywords: ['bridal', 'wedding', 'engagement', 'party wear'], 
    response: "👰 Our bridal and party wear jewellery sets are bestsellers! Heavy kundan sets, chokers, matha patti, and more – perfect for your special day." },
  { keywords: ['tarnish', 'rust', 'quality'], 
    response: "🛡️ Our jewellery is anti‑tarnish and waterproof. With proper care, it stays shiny for years. We offer a 6‑month warranty against manufacturing defects." },
  
  // General shopping
  { keywords: ['payment', 'cod', 'card', 'upi', 'razorpay'], 
    response: "💳 We accept all payment methods: Credit/Debit cards, UPI, NetBanking, Cash on Delivery (COD), and Razorpay. Your transactions are 100% secure." },
  { keywords: ['discount', 'coupon', 'offer', 'sale'], 
    response: "🏷️ Use code 'WELCOME10' for 10% off your first order. Also check our 'Sale' section for up to 50% off on selected items!" },
  { keywords: ['contact', 'support', 'help', 'customer care'], 
    response: "📞 Our customer care is available 9 AM – 9 PM IST. Email: support@dagfashion.com | Phone: +91-XXXXXXXXXX" },
  { keywords: ['thank', 'thanks', 'good', 'great', 'awesome'], 
    response: "😊 You're welcome! Happy shopping with DAG Fashion. If you need anything else, just ask!" },
  { keywords: ['hi', 'hello', 'hey', 'namaste'], 
    response: "👋 Hello! Welcome to DAG Fashion – your one‑stop shop for trendy dresses and stunning artificial jewellery. How can I help you today?" }
];

// Helper: keyword matching
function getKeywordResponse(message) {
  const lowerMsg = message.toLowerCase();
  for (const item of keywordResponses) {
    if (item.keywords.some(kw => lowerMsg.includes(kw))) {
      console.debug(`🔑 Keyword matched: ${item.keywords.join(', ')}`);
      return item.response;
    }
  }
  return null;
}

// Groq API call with fallback
async function callGroqChat(messages) {
  if (!GROQ_API_KEY) {
    console.warn('GROQ_API_KEY missing – using keyword fallback');
    return null;
  }

  try {
    console.debug('Calling Groq API...');
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error(`Groq API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content;
    console.debug(' Groq response received');
    return reply;
  } catch (error) {
    console.error(' Groq call failed:', error.message);
    return null;
  }
}

// ============ TEST ENDPOINT ============
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'AI Chat Service Ready (Groq + Keyword Fallback)',
    groqConfigured: !!GROQ_API_KEY,
    keywordCount: keywordResponses.length
  });
});

// ============ CHAT ENDPOINT (only text) ============
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    console.log(` User message: "${message?.substring(0, 80)}"`);

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    // First try keyword matching
    let reply = getKeywordResponse(message);
    if (reply) {
      console.log(' Using keyword‑based response');
      return res.json({
        success: true,
        response: reply,
        source: 'keyword',
        timestamp: new Date().toISOString()
      });
    }

    // If no keyword match, try Groq (if available)
    const systemInstruction = `You are DAG Assistant, a helpful fashion shopping assistant for ladies' dresses and artificial/duplicate jewellery. 
Answer questions about products, sizing, returns, payments, and styling. Be friendly, concise, and helpful. 
If asked about real gold/diamond, politely explain we sell high‑quality artificial jewellery that looks identical. 
Current date: ${new Date().toLocaleDateString()}.`;

    const messages = [
      { role: 'system', content: systemInstruction },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const groqReply = await callGroqChat(messages);
    if (groqReply) {
      console.log(' Using Groq API response');
      return res.json({
        success: true,
        response: groqReply,
        source: 'groq',
        timestamp: new Date().toISOString()
      });
    }

    // Ultimate fallback (should not happen if keyword coverage is good)
    console.warn(' No keyword match and Groq failed – using generic fallback');
    return res.json({
      success: true,
      response: "I'm here to help with dresses and jewellery! Could you please rephrase your question? You can ask about products, sizes, colors, returns, or discounts.",
      source: 'fallback',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(' Chat endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      response: "Sorry, I'm having trouble right now. Please try again later."
    });
  }
});

export default router;