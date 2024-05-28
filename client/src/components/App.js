import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import Header from './header';
import FaceTracking from './FaceTracking';

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
  const [showTraining, setShowTraining] = useState(false);
  const [today, setToday] = useState('');
  const audioRef = useRef(null);

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

      // Trigger music generation after displaying initial responses
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
    setShowTraining(true);
  };

  const handleStopTraining = () => {
    setShowTraining(false);
    setPage('input');
  };

  return (
    <div className="App">
      <Header />
      <div className="sub-title">
        <h2 className="date">{today}</h2>
        <h3>날씨 <span role="img" aria-label="sunny">☀️</span></h3>
      </div>
      {page === 'input' && (
        <>
          <div className="diary-boxes">
            {diaries.map((diary, index) => (
              <div key={index} className="diary-box">
                <p>{diary}</p>
                <button onClick={() => handleDeleteDiary(index)}>삭제</button>
              </div>
            ))}
          </div>
          <div className="input-section">
            <textarea
              value={diaryInput}
              onChange={(e) => setDiaryInput(e.target.value)}
              placeholder="지원이의 하루를 작성해주세요."
            />
            <button onClick={handleAddDiary}>추가하기</button>
          </div>
          <button className="next-button" onClick={handleNext} disabled={diaries.length === 0}>작성 완료</button>
        </>
      )}

      {page === 'loading' && (
        <div>지원이의 그림 일기를 생성 중입니다.</div>
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
          <button className="next-button" onClick={handleTraining}>오늘의 훈련 시작</button>
        </div>
      )}

      {page === 'training' && showTraining && (
        <div className="training-section">
          <p>{responses[currentIndex].summary} 이때 <span className="feeling">{responses[currentIndex].feeling}</span> 느낌이 들었겠다! <br></br>함께 그 감정을 표현해볼까?</p>
          <div className = "music-playing">
            <FaceTracking musicResponses={musicResponses} currentIndex={currentIndex} />
            <button className="next-button" onClick={handleStopTraining}>오늘의 훈련 끝내기</button>
          </div>
        </div>
      )}

      {error && <div>Error: {error}</div>}
    </div>
  );
}

export default App;
