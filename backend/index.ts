import { VercelRequest, VercelResponse } from '@vercel/node';
import app from './src/infrastructure/server/expressApp';

// Export the Express app to be handled by Vercel's serverless environment
export default (req: VercelRequest, res: VercelResponse) => {
  app(req, res); // Delegate the request to the Express app
};
