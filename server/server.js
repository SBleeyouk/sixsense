const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');  // Add axios for making HTTP requests
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

// New route to forward requests to the Flask server
app.post('/processVideo', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:5002/api/process', req.body);  // Ensure this URL matches your Flask server URL
    console.log('Response from Flask server:', response.data);  // Log the response data to the console
    res.json(response.data);
  } catch (error) {
    console.error('Error while processing video:', error.message);  // Log the error message to the console
    res.status(500).json({ error: error.message });
  }
});

app.post('/stopVideoProcessing', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:5002/api/stop');  // Ensure this URL matches your Flask server URL for stopping
    console.log('Response from Flask server (stop):', response.data);  // Log the response data to the console
    res.json(response.data);
  } catch (error) {
    console.error('Error while stopping video processing:', error.message);  // Log the error message to the console
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});