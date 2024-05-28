const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { generateResponse } = require('./openAI');
const { runReplicate } = require('./musicgen');

const app = express();
const port = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(cors());

app.post('/getResponses', async (req, res) => {
  const { diaries } = req.body;
  const results = [];

  try {
    for (const diary of diaries) {
      const result = await generateResponse(diary);
      results.push(result);
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/getMusic', async (req, res) => {
  const { responses } = req.body;
  const results = [];

  try {
    for (const response of responses) {
      const music = await runReplicate(response.musicPrompt);
      results.push({ ...response, musicUrl: music });
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
