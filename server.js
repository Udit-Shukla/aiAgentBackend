import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compareRoute from './routes/compare.js';
import generateInsightsRoute from './routes/generateInsights.js';
import chatsRoute from './routes/chats.js';
const app = express();

// CORS configuration
const corsOptions = {
  origin: ['https://a-iagents-uditshuklas-projects.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/compare-stocks', compareRoute);
app.use('/api/generate-insights', generateInsightsRoute);
app.use('/api/chat', chatsRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8000;

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Error starting server:', err);
  }
  process.exit(1);
});
