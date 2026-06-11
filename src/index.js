import express from 'express';
import http from 'http';
import { matchesRouter } from './routes/matches.js';
import { attachWebSocketServer } from './ws/server.js';
import { securityMiddleware } from './arcjet.js';
import { commentaryRouter } from './routes/commentary.js';

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);

// Middleware to parse JSON
app.use(express.json());

// Root GET route
app.get('/', (req, res) => {
  res.send('Welcome to the Sportz server!');
});

app.use(securityMiddleware());

app.use('/matches', matchesRouter);
app.use('/matches/:id/commentary', commentaryRouter);

const { broadcastMatchCreated, broadcastCommentary } =
  attachWebSocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

// Start the server
server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

  console.log(`Server is running on ${baseUrl}`);
  console.log(
    `WebSocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`,
  );
});
