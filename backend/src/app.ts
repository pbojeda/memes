import express, { Application } from 'express';
import cors from 'cors';
import requestLogger from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', routes);

// Error handling (must be last)
app.use(errorHandler);

export default app;
