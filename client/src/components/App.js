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


import c1 from '../ui/exciting.png';
import c2 from '../ui/angry.png';
import c3 from '../ui/surprised.png';
import c4 from '../ui/embarassed.png';
import c5 from '../ui/sad.png';
import c6 from '../ui/exciting.png';
import c7 from '../ui/angry.png';
import c8 from '../ui/surprised.png';
import c9 from '../ui/embarassed.png';
import c10 from '../ui/sad.png';
import c11 from '../ui/exciting.png';
import c12 from '../ui/main.png';
import c13 from '../ui/all.png';
import c14 from '../ui/all.png';

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

  const gap = 60; // 간격
  const screenWidth = window.innerWidth;
  const itemWidth = (screenWidth - 4 * gap) / 4;
  const initialOffset = screenWidth / 2 - (itemWidth + gap) * 6.75; // 12번 요소가 중앙에 오도록 설정
  

  const [carouselOffset, setCarouselOffset] = useState(initialOffset);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const imageUrls = [
    c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14
  ];

  useEffect(() => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    setToday(formattedDate);
  }, []);

  
  const handleDragStart = (e) => {
    setDragStartX(e.clientX);
    setDragging(true);
  };
  
  const handleDragEnd = () => {
    setDragging(false);
  };
  
  const handleDrag = (e) => {
    if (!dragging) return;
    const dragDistance = e.clientX - dragStartX;
  
    setCarouselOffset((prevOffset) => prevOffset + dragDistance);
    setDragStartX(e.clientX);
  };
  
  const handlePrevCarousel = () => {
    setCarouselOffset((prevOffset) => prevOffset + itemWidth + gap);
  };
  
  const handleNextCarousel = () => {
    setCarouselOffset((prevOffset) => prevOffset - itemWidth - gap);
  };

  const handleStartClick = () => {
    setPage('input');
  };
  

  const handleViewPreviousDiaries = () => {
    setPage('page1');
  };
  
  const handleViewLearningOutcomes = () => {
    setPage('page2');
  };


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
      {page === 'intro' && (
        <div className="intro-page">
          <h1>오늘 하루는 어땠나요?!</h1>
          <div 
            className="carousel-container" 
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onMouseMove={handleDrag}
          >
            <button className="carousel-arrow left" onClick={handlePrevCarousel}>❮</button>
            <div className="carousel-content" style={{ transform: `translateX(${carouselOffset}px)` }}>
              {[...Array(14).keys()].map((_, index) => (
                <div 
                  key={index} 
                  className="carousel-item"
                  style={{ 
                    width: index + 1 === 12 ? `${itemWidth * 1.2}px` : `${itemWidth}px`, 
                    height: index + 1 === 12 ? `${itemWidth * 1.2}px` : `${itemWidth}px` 
                  }} // Adjust margin and width
                  onClick={index + 1 === 12 ? handleStartClick : undefined} // 12번 요소 클릭 시 페이지 전환
                >
                  <div 
                    className={`circle ${index + 1 === 12 ? 'pulse' : ''}`}
                    style={{ 
                      width: index + 1 === 12 ? `${itemWidth * 1.2}px` : `${itemWidth}px`, 
                      height: index + 1 === 12 ? `${itemWidth * 1.2}px` : `${itemWidth}px`,
                      backgroundImage: `url(${imageUrls[index]})`, 
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: (index + 1 === 13 || index + 1 === 14) ? '2px dashed #000' : '2px solid #000',
                      pointerEvents: (index + 1 === 13 || index + 1 === 14) ? 'none' : 'cursor' 
                    }}
                  >
                    {index + 1 === 12 && (
                      <div className="overlay">
                        <button className="overlay-button" onClick={handleStartClick}>작성하기</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="carousel-arrow right" onClick={handleNextCarousel}>❯</button>

            <div className="button-container">
            <button className="view-button" onClick={handleViewPreviousDiaries}>이전 일기 보러가기</button>
            <button className="view-button" onClick={handleViewLearningOutcomes}>학습 성과 보러가기</button>
          </div>
          </div>
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
          <div className="carousel-content">
          {responses.length > 1 && (
            <div className="carousel-preview left">
              <img src={responses[(currentIndex - 1 + responses.length) % responses.length].imageUrl} alt="Previous" />
            </div>
          )}
          <div className="carousel-image">
            <img src={responses[currentIndex].imageUrl} alt="Generated" />
          </div>
          {responses.length > 2 && (
            <div className="carousel-preview right">
              <img src={responses[(currentIndex + 1) % responses.length].imageUrl} alt="Next" />
            </div>
          )}
          <div className="result-textarea">
            <button className="carousel-arrow left" onClick={handlePrevImage}>❮</button>
            <div className="carousel-text">
              <div className="carousel-nav">
                {responses.map((_, index) => (
                  <button id="carousel-btn"
                    key={index}
                    className={index === currentIndex ? 'active' : ''}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
              <div className="feeling-tag">
                <h2>오늘의 감정어:</h2>
                <p>{responses[currentIndex].feeling}</p>
              </div>
              <p>{responses[currentIndex].summary}</p>
            </div>
            <button className="carousel-arrow right" onClick={handleNextImage}>❯</button>
          </div>
        </div>
          <button className="view-button" onClick={handleTraining}>오늘의 훈련 시작</button>
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
