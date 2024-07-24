#!/bin/sh

# python-backend 폴더로 이동하여 Flask 서버 시작
cd python-backend
pip3 install -r requirements.txt
gunicorn app:app &

# server 폴더로 이동하여 Node 서버 시작
cd ../server
npm install
npm start &

# client 폴더로 이동하여 빌드된 React 앱 서빙
cd ../client
npm install
npm run build
serve -s build