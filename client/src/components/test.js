import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Header from './header';
import './test.css';

import n1 from '../ui/n1.svg';
import n2 from '../ui/n2.svg';
import n3 from '../ui/n3.svg';
import rotate from '../ui/rotate.svg';
import rotate2 from '../ui/rotate2.svg';
import rotate3 from '../ui/rotate3.svg';
import arrow from '../ui/rotateArrow.svg';
import r1 from '../ui/r1.svg';

const TestIntro = ({ goToStep1, disabledButtons, onButtonClick }) => {
    const buttons = [
        'Happy', 'Sad', 'Excited', 'Angry', 'Surprised', 
        'Happy', 'Sad', 'Excited', 'Angry', 'Surprised', 
        'Happy', 'Sad', 'Neutral'
    ];

    const story = '점심시간에는 공원에서 친구들과 뛰어 놀았다. 친구들과 산책도 하고 공원에서 산책하는 강아지들도 예쁘게 쓰다듬어주어 칭찬을 받았다. 너무 즐거웠다.';

    const handleGenerateImage = async (index) => {
        onButtonClick(index); 
        try {
            const response = await axios.post('http://localhost:8000/getTest', { story });
            const { results, trueFeeling, falseFeelings, trueBehavior, falseBehaviors } = response.data;
            console.log('Received images:', results); // 디버깅을 위해 응답 로그 추가
            goToStep1(results, { trueFeeling, falseFeelings, trueBehavior, falseBehaviors});
        } catch (error) {
            console.error('Error generating image:', error);
        }
    };

    return (
      <div className='test'>
        <div className='headerdiv'>
           <Header />
        </div>
        <div className='introCon'>
            <div>
              <h1 className='introTitle'>
                  오늘은 지난 한 주 동안 학습한 감정어를<br/>알맞게 사용할 수 있는지 확인해보는 시간이에요!
              </h1>
              <p className='introSub'>감정어 버튼을 눌러 테스트를 진행해주세요!</p>
            </div>
            <div className='buttonContainer'>
                <div className='buttonRow'>
                    {buttons.slice(0, 4).map((buttonText, index) => (
                        <button
                            key={index}
                            className={`emotionButton ${buttonText.toLowerCase()}`}
                            onClick={() => handleGenerateImage(index)}
                            disabled={disabledButtons.includes(index)}
                            style={{ opacity: disabledButtons.includes(index) ? 0.2 : 1 }}
                        >
                            {buttonText}
                        </button>
                    ))}
                </div>
                <div className='buttonRow'>
                    {buttons.slice(4, 9).map((buttonText, index) => (
                        <button
                            key={index}
                            className={`emotionButton ${buttonText.toLowerCase()}`}
                            onClick={() => handleGenerateImage(index + 4)}
                            disabled={disabledButtons.includes(index + 4)}
                            style={{ opacity: disabledButtons.includes(index + 4) ? 0.2 : 1 }}
                        >
                            {buttonText}
                        </button>
                    ))}
                </div>
                <div className='buttonRow'>
                    {buttons.slice(9).map((buttonText, index) => (
                        <button
                            key={index}
                            className={`emotionButton ${buttonText.toLowerCase()}`}
                            onClick={() => handleGenerateImage(index + 9)}
                            disabled={disabledButtons.includes(index + 9)}
                            style={{ opacity: disabledButtons.includes(index + 9) ? 0.2 : 1 }}
                        >
                            {buttonText}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    </div>
    );
};

const Step1 = ({ images = [], emotions, goToStep2 }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (index) => {
      setSelectedImage(images[index]);
  };

    useEffect(() => {
        const rotatingImage = document.getElementById('rotatingImage');
        
        setTimeout(() => {
            rotatingImage.style.animation = 'none';
            rotatingImage.style.transform = 'rotate(0deg)';
        }, 3000);
    }, []);

    return (

      <div className="testC">
      <div className='headerdiv'>
        <Header />
      </div>
      <div className='stepCon'>
        <img src={n1} className="num"/>
        <h1 className='quest'>다음 상황이랑 제일 잘 어울리는 그림 일기를 선택해보세요!</h1>
        <p className='story'>점심시간에는 공원에서 친구들과 뛰어 놀았다. 친구들과 산책도 하고 공원에서 산책하는 강아지들도 예쁘게 쓰다듬어주어 칭찬을 받았다. 너무 즐거웠다.</p>
        <div className='imgCon'>
              {images.map((image, index) => (
                  <img 
                    key={index}
                    src={image.imageUrl} 
                    alt={`Generated ${index}`}
                    className={selectedImage === index ? 'active' : ''}
                    onClick={() => handleImageClick(index)}
                    style={selectedImage === index ? { border: '2px solid rgba(75, 53, 39, 1)' } : {}}
                  />
              ))}
        </div>
        <div className='btnCon'> 
          <button className="nextButton" onClick={() => goToStep2(emotions, selectedImage)}>다음 단계 >> </button>
        </div>
        <img id="rotatingImage" src={rotate}/>
        <img id="rotatingArrow" src={arrow}/>
      </div>
    </div>


    );
};

const Step2 = ( { emotions, selectedImage, goToStep3 } ) => {
  const [selectedText, setSelectedText] = useState(null);
  const [shuffledTexts] = useState([...emotions.falseFeelings, emotions.trueFeeling].sort(() => 0.5 - Math.random()));


    useEffect(() => {
        const rotatingImage = document.getElementById('rotatingImage');
        
        setTimeout(() => {
            rotatingImage.style.animation = 'none';
            rotatingImage.style.transform = 'rotate(0deg)';
        }, 3000);
    }, []);

    const handleTextClick = (index) => {
        setSelectedText(index);
    };

  return (
    <div className="testC">
      <div className='headerdiv'>
        <Header />
      </div>
      <div className='stepCon'>
        <img src={n2} className="num"/>
        <h1 className='quest'>그림 속 아이는 지금 기분이 어떤 것 같아 보이나요?</h1>
        <div className='textCon'>
            {shuffledTexts.map((text, index) => (
                <div
                    key={index}
                    className={`textItem ${selectedText === index ? 'active' : ''}`}
                    onClick={() => handleTextClick(index)}
                >
                    {text}
                </div>
            ))}
        </div>
        <div className='qimg'>
          <img src={selectedImage.imageUrl} alt="Selected" />
        </div>
        <div className='btnCon'> 
          <button className="nextButton" onClick={ () => goToStep3(emotions)}>다음 단계 >> </button>
        </div>
        <img id="rotatingImage" src={rotate2}/>
        <img id="rotatingArrow" src={arrow}/>
      </div>
    </div>
  );
};

const Step3 = ({ emotions, goToResult }) => {
  const [selectedText, setSelectedText] = useState(null);
  const [shuffledBehaviors] = useState([...emotions.falseBehaviors, emotions.trueBehavior].sort(() => 0.5 - Math.random()));

  
  useEffect(() => {
      const rotatingImage = document.getElementById('rotatingImage');
      
      setTimeout(() => {
          rotatingImage.style.animation = 'none';
          rotatingImage.style.transform = 'rotate(0deg)';
      }, 3000);
  }, []);

  const handleTextClick = (index) => {
      setSelectedText(index);
  };

return (
  <div className="testC">
    <div className='headerdiv'>
      <Header />
    </div>
    <div className='stepCon'>
      <img src={n3} className="num"/>
      <h1 className='quest'>이런 상황에는 어떻게 반응하면 좋을까요?</h1>
      <p className='story'>점심시간에는 공원에서 친구들과 뛰어 놀았다. 친구들과 산책도 하고 공원에서 산책하는 강아지들도 예쁘게 쓰다듬어주어 칭찬을 받았다. 너무 즐거웠다.</p>
      <div className='imgCon'>
          {shuffledBehaviors.map((text, index) => (
            <div
              key={index}
              className={`textItem2 ${selectedText === index ? 'active' : ''}`}
              onClick={() => handleTextClick(index)}
            >
              {text}
            </div>
          ))}
      </div>
      <div className='btnCon'> 
        <button className="nextButton" onClick={goToResult}>다음 단계 >> </button>
      </div>
      <img id="rotatingImage" src={rotate3}/>
      <img id="rotatingArrow" src={arrow}/>
    </div>
  </div>
);
};

const Result = ({goToIntro}) => {
  return (
    <div className='resultCon'>
      <div className='headerdiv'>
        <Header />
      </div>
      <div className='stepCon'>
        <div className='scoreCon'>
          <div className="circle"></div>
          <div className="line"></div>
          <div className="circle"></div>
          <div className="line"></div>
          <div className="circle"></div>
        </div>
        <h1 className='resultTitle'>처음부터 차근차근!</h1>
        <p className='story'>점심시간에는 공원에서 친구들과 뛰어 놀았다. 친구들과 산책도 하고 공원에서 산책하는 강아지들도 예쁘게 쓰다듬어주어 칭찬을 받았다. 너무 즐거웠다.</p>
      </div>
      <div className='resultimgCon'>
        <img className='resultImg' src={r1}/>
        <button className="resultButton" onClick={goToIntro}>다음 테스트 진행하러 가기 </button>
      </div>
    </div>
  );

}

const Test = () => {
    const [page, setPage] = useState('intro');
    const [images, setImages] = useState([]);
    const [emotions, setEmotions] = useState({});
    const [disabledButtons, setDisabledButtons] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    const goToStep1 = (images, emotions) => {
        setImages(images);
        setEmotions(emotions);
        setPage('step1');
    };

    const goToStep2 = (emotions, selectedImage) => {
        setEmotions(emotions);
        setSelectedImage(selectedImage);
        setPage('step2');
    };

    const goToStep3 = (emotions) => {
      setPage('step3');
      setEmotions(emotions);
    };

    const goToResult = () => {
      setPage('result');
    }

    const goToIntro = () => {
      setPage('intro');
    }

    const handleButtonClick = (index) => {
      setDisabledButtons((prevDisabledButtons) => [...prevDisabledButtons, index]);
    };

    return (
        <div className="test">
            {page === 'intro' && 
            <TestIntro 
              goToStep1={goToStep1} 
              disabledButtons={disabledButtons}
              onButtonClick={handleButtonClick}
            />}
            {page === 'step1' && <Step1 images={images} emotions={emotions} goToStep2={goToStep2}/>}
            {page === 'step2' && <Step2 emotions={emotions} selectedImage={selectedImage} goToStep3={goToStep3} />}
            {page === 'step3' && <Step3 emotions={emotions} goToResult={goToResult} />}
            {page === 'result' && <Result goToIntro={goToIntro} />}
        </div>
    );
};

export default Test;










