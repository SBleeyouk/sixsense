import React, { useState, useEffect, useRef } from 'react';
//import axios from 'axios';
import axiosInstance from '../api/axiosInstance.js';
import './App.css';
import Header from './header';
import Test from './test';
import FaceTracking from './FaceTracking';
import loadingImg from '../ui/loading.gif';
import weather from '../ui/sun.png';
import buttonIcon from '../ui/arrow.svg';
import buttonIcon2 from '../ui/complete.svg';
import deleteIcon from '../ui/delete.svg';
import AudioVisualizer from './audioVisualizer';
import io from 'socket.io-client';
import ReactPlayer from 'react-player';

import c1 from '../ui/d1.png';
import c2 from '../ui/d2.png';
import c3 from '../ui/d1.png';
import c4 from '../ui/d2.png';
import c5 from '../ui/d1.png';
import c6 from '../ui/d2.png';
import c7 from '../ui/d1.png';
import c8 from '../ui/d2.png';
import c9 from '../ui/d1.png';
import c10 from '../ui/d2.png';
import c11 from '../ui/d1.png';
import c12 from '../ui/main.png';
import c13 from '../ui/all.png';
import c14 from '../ui/all.png';
import outcomeImg from '../ui/outcome.svg';

let accumulatedTime = 0; // 전역 변수로 설정

function App() {
  const [showTest, setShowTest] = useState(false);
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
  const [videoUrl, setVideoUrl] = useState('');
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const [disparity, setDisparity] = useState(0);
  const [expression, setExpression] = useState('Neutral');

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

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    //socketRef.current = io('http://localhost:5000'); // Connect to the WebSocket server
    const socketUrl = process.env.REACT_APP_SOCKET_URL;
    socketRef.current = io(socketUrl);
    // Listen for disparity updates
    socketRef.current.on('video_processed', (data) => {
      setDisparity(data.disparity);
      setExpression(data.expression);
    });

    return () => {
      // Clean up the socket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
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
    setPage('outcome');
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
      const response = await axiosInstance.post('/getResponses', { diaries });
  
      if (response.status === 200) {
        console.log('Response from getResponses:', response.data);
        if (Array.isArray(response.data)) {
          setResponses(response.data);
        } else {
          throw new Error('API response is not an array');
        }
        setLoading(false);
        setPage('results');
  
        setMusicLoading(true);
        const musicResponse = await axiosInstance.post('/getMusic', { responses: response.data });
  
        if (musicResponse.status === 200) {
          console.log('Response from getMusic:', musicResponse.data);
          if (Array.isArray(musicResponse.data)) {
            setMusicResponses(musicResponse.data);
          } else {
            throw new Error('API response is not an array');
          }
          setMusicLoading(false);
        } else {
          throw new Error('Music API response status not 200');
        }
      } else {
        throw new Error('Responses API response status not 200');
      }
    } catch (error) {
      console.error('Error occurred:', error.message);
      setError(error.message);
      setLoading(false);
      setMusicLoading(false);
      setPage('input');
    }
  };

  const handlePrevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? responses.length - 1 : prevIndex - 1));
  };

  const handleNextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex === responses.length - 1 ? 0 : prevIndex + 1));
  };

  const handleTraining = async () => {
    setPage('training');
    setShowTraining(true);

    try {
      const feeling = responses[currentIndex].emotion;
      //const response = await axios.post('http://localhost:8000/processVideo', { feeling });
      const response = await axiosInstance.post('/processVideo', { feeling });
      console.log('Response from processVideo API:', response.data);
    } catch (error) {
      console.error('Error while calling processVideo API:', error.message);
    }
  };

  useEffect(() => {
    let interval;

    if (disparity !== null) {
      interval = setInterval(() => {
        if (disparity < 15 && responses[currentIndex]?.emotion === expression) {
          accumulatedTime += 1;
          console.log(`Accumulated Time: ${accumulatedTime}`); // Log the accumulated time
        }
        if (accumulatedTime >= 100) {
          clearInterval(interval);
          setPage('final-result');
          if (socketRef.current) {
            socketRef.current.emit('stop_video', { message: 'Stop video processing' });
          }
        }
      }, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [disparity, expression, currentIndex, responses]);


  const handleStopTraining = () => {
    setShowTraining(false);
    setPage('final-result');
    //axios.post('http://localhost:8000/stopVideoProcessing')
    axiosInstance.post('/stopVideoProcessing')
    .then(response => {
      console.log('Video processing stopped:', response.data);
    })
    .catch(error => {
      console.error('Error stopping video processing:', error.message);
    });
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  useEffect(() => {
    if (page === 'training') {
      handleTraining();
    } 
  }, [page]);

  useEffect(() => {
    if (page === 'training' && responses[currentIndex]?.emotion) {
      const videoSrc = `/videos/${responses[currentIndex].emotion}.mp4`;
      console.log('Setting video URL to:', videoSrc); 
      setVideoUrl(videoSrc);
    }
  }, [page, currentIndex, responses]);

  useEffect(() => {
    if (page === 'final-result' && musicResponses.length > 0) {
      const audio = audioRef.current;
      audio.src = musicResponses[currentIndex].musicUrl;
      audio.play();
      const sendDataToServer = async (data) => {
        try {
          //const response = await axiosInstance.post('http://localhost:8000/processVideo', data);
          const response = await axiosInstance.post('/processVideo', data);
          console.log(response.data);
        } catch (error) {
          console.error('Error sending data:', error);
        }
      };
      
      // Example usage
      const data = { key: 'value' };
      sendDataToServer(data);
    }
  }, [page, currentIndex, musicResponses]);

  if (showTest) {
    return <Test />;
  }

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
                      border: (index + 1 === 13 || index + 1 === 14) ? '2px solid #4B3527' : '2px solid #4B3527',
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
            <button className="view-button" onClick={setShowTest}>테스트 시작하기</button>
            <button className="view-button" onClick={handleViewLearningOutcomes}>학습 성과 보러가기</button>
          </div>
          </div>
        </div>
      )}

{page === 'outcome' && (
        <>
        <div className='titleCon'>
          <h1 className='resultTitle'>지난 주에는 속상한 일이 많았구나?</h1>
          <p className='story'>모든 감정어가 골고루 잘 학습되고 있네!
          하지만 아직 놀라움이나 두려움 관련 단어들을 조금 어려워하는 거 같으니
          다음주에는 놀라움과 두려움 관련 감정어를 더 많이 학습하면 좋을 거 같아!</p>
        </div>
        <div className='outcomeimgCon'>
          <img className='outcomeImg' src={outcomeImg}/>

        </div>
          
        </>
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
        <>
        <div className="sub-title">
          <h2 className="date">{today}</h2>
          <div className="weatherbox">
            <h3>날씨</h3>
            <img src={weather} alt="sunny" className="weather"/>
          </div>
        </div>
        <div className="carousel">
          <div className="carousel-content">

          <div className='carousel-box'>
          {Array.isArray(responses) && responses.length > 1 && (
            <div className="carousel-preview left">
              <img src={responses[(currentIndex - 1 + responses.length) % responses.length].imageUrl} alt="Previous" />
            </div>
          )}

            
            <div className="carousel-image">
              <img src={responses[currentIndex].imageUrl} alt="Generated" />
            </div>
            {Array.isArray(responses) && responses.length > 2 && (
              <div className="carousel-preview right">
                <img src={responses[(currentIndex + 1) % responses.length].imageUrl} alt="Next" />
              </div>
            )}
          </div>
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
              <p>{responses[currentIndex].summary}</p>
              <div className="feeling-tag">
                <h2>오늘의 감정어:</h2>
                <p>{responses[currentIndex].feeling}</p>
              </div>
              
            </div>
            <button className="carousel-arrow right" onClick={handleNextImage}>❯</button>
          </div>
        </div>
          <button className="view-button" onClick={handleTraining}>오늘의 훈련 시작</button>
        </div>
        </>
      )}

      {page === 'training' && showTraining && (
        <div className="training-section">
        <p>{responses[currentIndex].summary} 이때 <span className="feeling">{responses[currentIndex].feeling}</span> 느낌이 들었겠다! <br /><br></br>함께 그 감정을 표현해볼까?</p>
        <video className='teacher-video' width='320' height='240' controls>
              <source src={videoUrl} type='video/mp4'></source>
              <h1>비디오</h1>
            </video>
        <div className="music-playing">
          <FaceTracking 
          musicResponses={musicResponses}
          currentIndex={currentIndex}
          handleStopTraining={handleStopTraining}  
          disparity={disparity}/>
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
          {Array.isArray(responses) && responses.map((response, index) => (
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
