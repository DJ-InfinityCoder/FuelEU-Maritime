import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/infrastructure/server/expressApp';

export default (req: VercelRequest, res: VercelResponse) => {
  // Make sure to pass the request and response objects to the express app
  app(req, res);
};
