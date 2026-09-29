const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = 5000;
const server = app.listen(port, () => {
  console.log('Minimal server listening on', port);
  console.log('Address:', server.address());
});