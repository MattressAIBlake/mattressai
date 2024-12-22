import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/config/:merchantId', (req, res) => {
  const { merchantId } = req.params;
  
  const merchantConfig = {
    id: merchantId,
    name: 'MattressAI',
    branding: {
      colors: {
        primary: '#2563eb',
        secondary: '#1e40af',
        background: '#ffffff',
        text: '#000000'
      },
      fonts: {
        primary: 'Inter',
        secondary: 'system-ui'
      },
      logo: null
    },
    chatConfig: {
      masterPrompt: 'I am a helpful AI assistant for mattress recommendations.',
      temperature: 0.7,
      welcomeMessage: "Welcome! How can I help you find the perfect mattress today?",
      maxTokens: 2000,
      model: 'gpt-3.5-turbo'
    }
  };

  res.json(merchantConfig);
});

app.get('/api/messages/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  res.json({
    messages: [],
    sessionId
  });
});

app.post('/api/messages', (req, res) => {
  const message = req.body;
  res.status(200).json({ success: true, message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 