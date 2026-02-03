import { env } from './config';
import app from './app';
import logger from './lib/logger';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
});

export default server;
