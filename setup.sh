# setup.sh
#!/bin/sh

# Navigate to the backend and start Flask
cd python-backend
gunicorn app:app &

# Navigate to the server and start the Node server
cd ../server
node server.js &

chmod +x setup.sh