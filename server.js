require('dotenv').config();
const express = require('express');
const cors = require('cors');
const envRoutes = require('./routes/envRoutes');
const path = require('path');
const bodyParser = require('body-parser');
const { saveEnvFile, getEnvFile } = require('./utils/fileHandler');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/env', envRoutes);

// API to get env file
app.get('/api/env/:project', async (req, res) => {
  const content = await getEnvFile(req.params.project);
  if (content === null) return res.status(404).send('Not found');
  res.send(content);
});

// API to save env file
app.post('/api/env/:project', async (req, res) => {
  await saveEnvFile(req.params.project, req.body.content || '');
  res.sendStatus(200);
});

// List available env files
app.get('/api/env', (req, res) => {
  const storeDir = path.join(__dirname, '.env_store');
  if (!fs.existsSync(storeDir)) return res.json([]);
  const files = fs.readdirSync(storeDir)
    .filter(f => f.endsWith('.env'))
    .map(f => f.replace(/\.env$/, ''));
  res.json(files);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 .env sync server running on port ${PORT}`);
});
