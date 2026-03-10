const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'scores.json');

function getScores() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function saveScores(scores) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(scores, null, 2));
}

// Get top 20 scores
app.get('/api/scores', (req, res) => {
  res.json(getScores().slice(0, 20));
});

// Submit a score
app.post('/api/scores', (req, res) => {
  const { name, score } = req.body;
  if (!name || !Number.isFinite(score) || score < 0 || score > 99999) {
    return res.status(400).json({ error: 'Invalid score data' });
  }

  const scores = getScores();
  const cleanName = String(name).toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 10) || 'ANON';

  // Keep only the highest score per player
  const existing = scores.findIndex(s => s.name === cleanName);
  if (existing !== -1) {
    if (scores[existing].score >= score) {
      return res.json({ ok: true, message: 'Existing score is higher' });
    }
    scores.splice(existing, 1);
  }

  scores.push({ name: cleanName, score: Math.floor(score), date: new Date().toISOString() });
  scores.sort((a, b) => b.score - a.score);
  saveScores(scores.slice(0, 200));

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gridlock Leaderboard API running on port ${PORT}`));
