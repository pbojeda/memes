import app from './app';
import logger from './lib/logger';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});

export default server;
