import React, { useEffect, useRef } from 'react';

const AudioVisualizer = ({ audioSrc }) => {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');

    const handleAudioSetup = async () => {
        if (audioSrc) {
          audio.src = audioSrc;
          audio.crossOrigin = "anonymous";
          audio.loop = true;
          await audio.play();
      
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContextRef.current.destination);
            analyser.fftSize = 2048; // Higher resolution for smoother line
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;
          }
      
          const draw = () => {
            if (!analyserRef.current || !dataArrayRef.current) return;
          
            animationRef.current = requestAnimationFrame(draw);
          
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          
            canvasCtx.lineWidth = 12;
            const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#FFE68F');
            gradient.addColorStop(1, '#FFDF38');
            canvasCtx.strokeStyle = gradient;
          
            canvasCtx.beginPath();
            const sliceWidth = canvas.width / (dataArrayRef.current.length / 4); // Scale the slice width for better spread
            let x = 0;
          
            const segmentLength = Math.floor(dataArrayRef.current.length / 4); // Length of each 2-second segment
            const start = Math.floor((audio.currentTime % 4) * segmentLength); // Start index for the current 2-second segment
          
            for (let i = 0; i < segmentLength; i++) {
              const index = (start + i) % dataArrayRef.current.length;
              const v = dataArrayRef.current[index] / 128.0;
              const y = (v * canvas.height)/8;
          
              if (i === 0) {
                canvasCtx.moveTo(x, y);
              } else {
                const prevX = x - sliceWidth;
                const prevY = (dataArrayRef.current[index - 1] / 128.0) * (canvas.height / 2);
                const cp1X = prevX + sliceWidth / 2;
                const cp1Y = prevY;
                const cp2X = x - sliceWidth / 2;
                const cp2Y = y;
                canvasCtx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, x, y);
              }
          
              x += sliceWidth*16;
            }
          
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
          };
          draw();
        }
      };      

    handleAudioSetup();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioSrc]);

  return (
    <div>
      <canvas ref={canvasRef} width="1000" height="800"></canvas> {/* Adjusted to match FaceTracking.js */}
      <audio ref={audioRef} />
    </div>
  );
};

export default AudioVisualizer;