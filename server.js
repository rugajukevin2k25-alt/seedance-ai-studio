import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { analyzeImage, buildPrompt, sniffType, visionConfigured } from './lib/prompt.js';
import { videoConfigured, startVideo } from './lib/video.js';

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));
app.use(express.static('public'));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }); // memory only, never written to disk

app.get('/api/config', (_q, r) => r.json({ vision: visionConfigured(), video: videoConfigured() }));

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
  const type = sniffType(req.file.buffer);
  if (!type) return res.status(415).json({ error: 'Only JPG, PNG or WEBP images are allowed.' });
  if (!visionConfigured()) return res.status(501).json({ error: 'AI analysis is not configured. Describe the image manually.' });
  try { res.json(await analyzeImage(req.file.buffer, type)); }
  catch (e) { res.status(502).json({ error: 'Image analysis failed. Try again or describe the image manually.' }); }
});

app.post('/api/prompt', (req, res) => {
  const { analysis = {}, style = 'cinematic', seed = 0 } = req.body || {};
  const clean = Object.fromEntries(['subject', 'setting', 'lighting', 'composition', 'style'].map(k => [k, String(analysis[k] || '').slice(0, 200)]));
  if (!clean.subject.trim()) return res.status(400).json({ error: 'Add a subject description first.' });
  res.json({ prompt: buildPrompt(clean, String(style), Number(seed) | 0) });
});

app.post('/api/video', upload.single('image'), async (req, res) => {
  if (!videoConfigured()) return res.status(501).json({ error: 'Video generation is not configured on this server (paid feature).' });
  try { res.json(await startVideo({ image: req.file?.buffer, prompt: req.body?.prompt })); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

app.use((err, _q, res, _n) => res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 500).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : 'Server error.' }));
app.listen(process.env.PORT || 3000, () => console.log('Seedance AI Studio running'));
