const express = require('express');
const router = express.Router();
const { saveEnvFile, getEnvFile } = require('../utils/fileHandler');
const authMiddleware = require('../middleware/auth');

// Upload an env file
router.post('/:project', authMiddleware, async (req, res) => {
  const { project } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'No env content provided' });

  await saveEnvFile(project, content);
  res.json({ success: true });
});

// Download an env file
router.get('/:project', authMiddleware, async (req, res) => {
  const { project } = req.params;
  const content = await getEnvFile(project);
  if (!content) return res.status(404).json({ error: 'Not found' });

  res.json({ content });
});

module.exports = router;
