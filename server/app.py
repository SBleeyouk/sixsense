from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from RealFaceVideo import RealFaceVideo  # Ensure this is your script with the necessary class
import os
import traceback

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@app.route('/api/process', methods=['POST'])
def process_data():
    data = request.json
    print('Received data:', data)  # Log the received data
    feeling = data.get('feeling')  # Get the emotion tag from the request
    if not feeling:
        return jsonify({"error": "No feeling provided"}), 400

    # Determine the video path based on the feeling
    video_mapping = {
        "happiness": "happiness.mp4"
    }

    video_filename = video_mapping.get(feeling.lower())
    if not video_filename:
        return jsonify({"error": "No matching video for the provided feeling"}), 400

    video_path = os.path.join(os.path.dirname(__file__), "videos", video_filename)
    print(f'Video path determined: {video_path}')

    if not os.path.exists(video_path):
        return jsonify({"error": f"Video file not found: {video_path}"}), 400

    try:
        # Instantiate the RealFaceVideo class and call the process_video method
        real_face_video = RealFaceVideo(video_path, socketio)
        socketio.start_background_task(target=real_face_video.process_video)
        response = {"message": "Video processing started"}
        return jsonify(response)
    except Exception as e:
        print('Error while processing video:', str(e))  # Log the error
        traceback.print_exc()  # Print the full traceback for debugging
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)  # Use socketio.run() instead of app.run()