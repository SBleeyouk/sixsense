require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { generateResponse } = require('./openAI');
const { generateTest } = require('./openAITest');
const { runReplicate } = require('./musicgen');

const app = express();
//const API_URL = process.env.API_URL || 'http://localhost:5000';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());
app.options('*', cors());

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

app.post('/getTest', async (req, res) => {
  const { story } = req.body;

  try {
    const results = await generateTest(story);
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
    const response = await axios.post('http://localhost:5000/process', req.body);  // Ensure this URL matches your Flask server URL
    //const response = await axios.post(`${API_URL}/process`, req.body); 
    console.log('Response from Flask server:', response.data);  // Log the response data to the console
    res.json(response.data);
  } catch (error) {
    console.error('Error while processing video:', error.message);  // Log the error message to the console
    res.status(500).json({ error: error.message });
  }
});

app.post('/stopVideoProcessing', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:5000/stop');  // Ensure this URL matches your Flask server URL for stopping
    //const response = await axios.post(`${API_URL}/stop`);
    console.log('Response from Flask server (stop):', response.data);  // Log the response data to the console
    res.json(response.data);
  } catch (error) {
    console.error('Error while stopping video processing:', error.message);  // Log the error message to the console
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});