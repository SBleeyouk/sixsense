#!/bin/sh

# python-backend 폴더로 이동하여 Flask 서버 시작
cd python-backend
gunicorn app:app &

# server 폴더로 이동하여 Node 서버 시작
cd ../server
npm start &  # This will run 'node server.js' as defined in the package.json

# client 폴더로 이동하여 빌드된 React 앱 서빙
cd ../client
serve -s build