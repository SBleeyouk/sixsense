# build.sh
#!/bin/sh

# Navigate to the client and build the React app
cd client
npm install
npm run build

# Navigate to the server and install dependencies
cd ../server
npm install

# Navigate to the backend and install dependencies
cd ../python-backend
pip install -r requirements.txt

cd ..

chmod +x build.sh