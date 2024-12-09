import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './api/routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1', apiRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 