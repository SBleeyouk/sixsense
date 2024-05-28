import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import Header from './header';
import FaceTracking from './FaceTracking';
import loadingImg from '../ui/loading.gif';
import weather from '../ui/sun.png';
import buttonIcon from '../ui/arrow.svg';
import buttonIcon2 from '../ui/complete.svg';
import deleteIcon from '../ui/delete.svg';
import AudioVisualizer from './audioVisualizer';

function App() {
  const [diaryInput, setDiaryInput] = useState('');
  const [diaries, setDiaries] = useState([]);
  const [responses, setResponses] = useState([]);
  const [musicResponses, setMusicResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState('intro');
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
      const response = await axios.post('http://localhost:8000/getResponses', { diaries });
      setResponses(response.data);
      setLoading(false);
      setPage('results');

      // Trigger music generation after displaying initial responses
      setMusicLoading(true);
      const musicResponse = await axios.post('http://localhost:8000/getMusic', { responses: response.data });
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
    setPage('final-result');
  };

  useEffect(() => {
    if (page === 'final-result' && musicResponses.length > 0) {
      const audio = audioRef.current;
      audio.src = musicResponses[currentIndex].musicUrl;
      audio.play();
    }
  }, [page, currentIndex, musicResponses]);

  return (
    <>
    <div className='headerdiv'>
    <Header />
    </div>
    
    <div className="App">
    {page === 'intro' && ( // 첫 페이지
        <div className="intro-page">
          <h1>환영합니다!</h1>
          <p>오늘의 일기를 작성하고 감정을 표현해보세요.</p>
          <button className="start-button" onClick={() => setPage('input')}>시작하기</button>
        </div>
      )}
      {page === 'input' && (
        <>
          <div className="sub-title">
            <h2 className="date">{today}</h2>
            <div className="weatherbox">
              <h3>날씨</h3>
              <img src={weather} alt="sunny" className="weather"/>
            </div>
          </div>
          <div className="diary-boxes">
            {diaries.map((diary, index) => (
              <div key={index} className="diary-box">
                <p>{diary}</p>
                <button onClick={() => handleDeleteDiary(index)}><img src={deleteIcon} alt="삭제" className="deleteIcon"/></button>
              </div>
            ))}
          </div>
          <div className="input-section">
            <textarea
              value={diaryInput}
              onChange={(e) => setDiaryInput(e.target.value)}
              placeholder="지수의 하루를 작성해주세요."
            />
            <button className="add-button" onClick={handleAddDiary}><img src={buttonIcon} alt="추가하기" className="addIcon"/></button>
            <button className="next-button" onClick={handleNext} disabled={diaries.length === 0}><img src={buttonIcon2} alt="작성완료" className="completeIcon"/></button>
          </div>
        </>
      )}

      {page === 'loading' && (
        <div className='loadingDiv'>
          <img className='load-div' src={loadingImg} alt="Loading..." />
        </div>
      )}

      {page === 'results' && responses.length > 0 && (
        <div className="carousel">
          <div className="sub-title">
            <h2 className="date">{today}</h2>
            <div className="weatherbox">
              <h3>날씨</h3>
              <img src={weather} alt="sunny" className="weather"/>
            </div>
          </div>
          <button className="carousel-arrow left" onClick={handlePrevImage}>❮</button>
          <div className="carousel-content">
            <div className="carousel-image">
              <img src={responses[currentIndex].imageUrl} alt="Generated" />
            </div>
            <div className="carousel-text">
              <p>{responses[currentIndex].summary}</p>
              <p>오늘의 감정어: {responses[currentIndex].feeling}</p>
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
          <p>{responses[currentIndex].summary} 이때 <span className="feeling">{responses[currentIndex].feeling}</span> 느낌이 들었겠다! <br /><br></br>함께 그 감정을 표현해볼까?</p>
          <div className="music-playing">
            <FaceTracking musicResponses={musicResponses} currentIndex={currentIndex} handleStopTraining={handleStopTraining} />
            <div className = 'audioVisual'>
              <AudioVisualizer audioSrc={musicResponses[currentIndex]?.musicUrl} />
            </div>
          </div>
        </div>
      )}

      {page === 'final-result' && responses.length > 0 && (
        <div className="carousel">
          <button className="carousel-arrow left" onClick={handlePrevImage}>❮</button>
          <div className="carousel-content">
            <div className="carousel-image">
              <img src={responses[currentIndex].imageUrl} alt="Generated" />
            </div>
            <div className="carousel-text">
              <p>{responses[currentIndex].summary}</p>
              <p>오늘의 감정어: {responses[currentIndex].feeling}</p>
              <audio ref={audioRef} src={musicResponses[currentIndex]?.musicUrl} />
            </div>
            <div className = 'audioVisual-2'>
              <AudioVisualizer audioSrc={musicResponses[currentIndex]?.musicUrl} />
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
        </div>
      )}

      {error && <div>Error: {error}</div>}
    </div>
  </>
  );
}

export default App;
