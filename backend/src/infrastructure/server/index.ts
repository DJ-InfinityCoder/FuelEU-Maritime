// import app from './expressApp.js';

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });

// src/infrastructure/server/index.ts
import app from './expressApp';

const server = app;

// No need for app.listen() in Vercel (since it's serverless)
export default server;
