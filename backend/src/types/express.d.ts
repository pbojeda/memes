import { TokenPayload } from '../application/services/tokenService';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
