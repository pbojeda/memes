import express, { Application } from 'express';
import requestLogger from './middleware/requestLogger';

const app: Application = express();

// Middleware
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;
