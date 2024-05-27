import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Header from './header';
import diarybg from './diary-box.png';
import circle from './circle.png';

function App() {
  const [diaryInput, setDiaryInput] = useState('');
  const [diaries, setDiaries] = useState([]);
  const [responses, setResponses] = useState([]);
  const [musicResponses, setMusicResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState('input');
  const [today, setToday] = useState('');

  useEffect(() => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    setToday(formattedDate);
  }, []);

  const handleAddDiary = () => {
    if (diaryInput.trim()) {
      setDiaries([...diaries, diaryInput.trim()]);
      setDiaryInput('');
    }
  };

  const handleDeleteDiary = (index) => {
    setDiaries(diaries.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    setLoading(true);
    setError(null);
    setPage('loading');

    try {
      const response = await axios.post('http://localhost:5000/getResponses', { diaries });
      setResponses(response.data);
      setLoading(false);
      setPage('results');

      setMusicLoading(true);
      const musicResponse = await axios.post('http://localhost:5000/getMusic', { responses: response.data });
      setMusicResponses(musicResponse.data);
      setMusicLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
      setPage('input');
    }
  };

  const handlePrevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? responses.length - 1 : prevIndex - 1));
  };

  const handleNextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex === responses.length - 1 ? 0 : prevIndex + 1));
  };

  const handleTraining = () => {
    setPage('training');
    loadScript('./script.js');

    if (musicResponses[currentIndex]) {
      const audio = new Audio(musicResponses[currentIndex].musicUrl);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const loadScript = (src) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.body.appendChild(script);
    script.onload = () => console.log('Script loaded successfully.');
    script.onerror = () => console.error('Script failed to load.');
  };

  return (
    <div className="App">
      <Header /> {}
      <div class = "sub-title">
        <h2 class='date'>{today}</h2>
        <h3>날씨 <span role="img" aria-label="sunny">☀️</span></h3>
      </div>
      {page === 'input' && (
        <>
          <div className="diary-boxes">
            {diaries.map((diary, index) => (
              <div key={index} className="diary-box" style={{ backgroundImage: `url(${diarybg})` }}>
                <p>{diary}</p>
                <button onClick={() => handleDeleteDiary(index)}>Delete</button>
              </div>
            ))}
          </div>
          <div className="input-section">
            <textarea
              value={diaryInput}
              onChange={(e) => setDiaryInput(e.target.value)}
              placeholder="오늘 민수에게 일어난 일을 알려주세요."
            />
            <button onClick={handleAddDiary}>추가하기</button>
          </div>
          <button className="next-button" onClick={handleNext} disabled={diaries.length === 0}>일기 작성 완료</button>
        </>
      )}

      {page === 'loading' && (
        <div>민수의 그림 일기를 생성 중입니다.</div>
      )}

      {page === 'results' && responses.length > 0 && (
        <div className="carousel">
          <button className="carousel-arrow left" onClick={handlePrevImage}>❮</button>
          <div className="carousel-content">
            <div className="carousel-image">
              <img src={responses[currentIndex].imageUrl} alt="Generated" />
            </div>
            <div className="carousel-text">
              <h2>Summary:</h2>
              <p>{responses[currentIndex].summary}</p>
              <h2>Feeling:</h2>
              <p>{responses[currentIndex].feeling}</p>
            </div>
          </div>
          <button className="carousel-arrow right" onClick={handleNextImage}>❯</button>
          <div className="carousel-nav">
            {responses.map((_, index) => (
              <button
                key={index}
                className={index === currentIndex ? 'active' : ''}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
          <button className="next-button" onClick={handleTraining}>오늘의 감정 훈련 시작</button>
        </div>
      )}

      {page === 'training' && (
        <div className="training-section">
          <h2>Training Page</h2>
          <div id="training-container"></div>
          <video id="video" style={{ display: 'none' }}></video>
        </div>
      )}

      {error && <div>Error: {error}</div>}
    </div>
  );
}

export default App;
