// src/infrastructure/server/expressApp.ts
import express from 'express';
import cors from 'cors';
import routes from '../../adapters/inbound/http/routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', (req, res) => {
  res.send('Welcome to the FuelEU Backend API');
});

app.use('/api', routes);

export default app;
