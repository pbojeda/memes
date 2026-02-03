import express, { Application } from 'express';
import requestLogger from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Middleware
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling (must be last)
app.use(errorHandler);

export default app;
