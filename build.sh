#!/bin/sh

# client 폴더로 이동하여 React 앱 빌드
cd client
npm install
npm run build

# server 폴더로 이동하여 의존성 설치
cd ../server
npm install

# python-backend 폴더로 이동하여 의존성 설치
cd ../python-backend
pip install -r requirements.txt

cd ..