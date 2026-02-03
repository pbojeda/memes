import app from './app';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  // TODO: Replace with Pino logger in B0.3
  if (process.env.NODE_ENV !== 'test') {
    process.stdout.write(`Server running on port ${PORT}\n`);
  }
});

export default server;
