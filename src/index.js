import express from 'express';

const app = express();
const PORT = 8000;

// Middleware to parse JSON
app.use(express.json());

// Root GET route
app.get('/', (req, res) => {
  res.send('Welcome to the Sportz server!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});