import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compareRoute from './routes/compare.js';
import generateInsightsRoute from './routes/generateInsights.js';
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/compare-stocks', compareRoute);
app.use('/api/generate-insights', generateInsightsRoute);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8000;

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Error starting server:', err);
  }
  process.exit(1);
});
