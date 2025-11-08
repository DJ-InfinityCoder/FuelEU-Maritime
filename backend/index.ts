import { VercelRequest, VercelResponse } from '@vercel/node';
import app from './src/infrastructure/server/expressApp';

export default (req: VercelRequest, res: VercelResponse) => {
  app(req, res); // Delegate the request to Express
};
