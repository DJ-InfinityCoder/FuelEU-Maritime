import { VercelRequest, VercelResponse } from '@vercel/node';
import app from './src/infrastructure/server/expressApp';

export default async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  // Handle the request in the express app
  return new Promise<void>((resolve, reject) => {
    app(req, res); // Delegate the request to Express
    res.on('finish', () => resolve());  // Resolve when the response is sent
    res.on('error', (err) => reject(err));  // Reject on error
  });
};
