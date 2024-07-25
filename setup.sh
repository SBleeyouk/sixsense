#!/bin/bash

# Python 가상 환경 설정
echo "Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Flask 종속성 설치
echo "Installing Flask dependencies..."
pip install -r python_backend/requirements.txt

# Node.js 종속성 설치
echo "Installing Node.js dependencies..."
cd server
npm install
cd ..

# Flask 서버 실행
echo "Starting Flask server..."
nohup python python_backend/app.py &

# Node.js 서버 실행
cd server
echo "Starting Node.js server..."
nohup node server.js &

cd ../client
echo "Starting React development server..."
npm run dev

echo "Setup complete. Servers are running."