#!/bin/sh

# 루트 디렉토리에서 Python 패키지 설치
pip3 install -r requirements.txt

# client 폴더로 이동하여 React 앱 빌드
cd client
npm install
npm run build

# server 폴더로 이동하여 의존성 설치
cd ../server
npm install

# python_backend 폴더로 이동하여 Flask 서버 시작
cd ../python_backend
gunicorn app:app &

# server 폴더로 이동하여 Node 서버 시작
cd ../server
npm start &

# client 폴더로 이동하여 빌드된 React 앱 서빙
cd ../client
npx serve -s build