import { VercelRequest, VercelResponse } from '@vercel/node';
import app from './src/infrastructure/server/expressApp';

export default async (req: VercelRequest, res: VercelResponse) => {
  // Run the Express app handler here
  return new Promise((resolve, reject) => {
    app(req, res); // Call Express handler
    res.on('finish', () => resolve()); // Ensure to resolve after response is finished
    res.on('error', reject);  // Reject if there is an error
  });
};
