from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from FaceLandmarks_FaceExpressions_WebCam import RealFaceVideo  # Ensure this is your script with the necessary class
import os
import traceback
from threading import Event

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")

stop_event = Event()  # Global stop event

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@app.route('/process', methods=['POST'])
def process_data():
    global stop_event
    stop_event.clear()  # Clear the stop event before starting

    data = request.json
    feeling = data.get('feeling')
    if not feeling:
        return jsonify({"error": "No feeling provided"}), 400

    video_mapping = {
        "anger": "anger.mp4",
        "disgust": "disgust.mp4",
        "fear": "fear.mp4",
        "happiness": "happiness.mp4",
        "neutral": "neutral.mp4",
        "sadness": "sadness.mp4",
        "surprise": "surprise.mp4"
    }

    video_filename = video_mapping.get(feeling.lower())
    if not video_filename:
        return jsonify({"error": "No matching video for the provided feeling"}), 400

    video_path = os.path.join(os.path.dirname(__file__), "videos", video_filename)
    print(f'Video path determined: {video_path}')

    if not os.path.exists(video_path):
        return jsonify({"error": f"Video file not found: {video_path}"}), 404

    try:
        real_face_video = RealFaceVideo(video_path, socketio, stop_event)
        socketio.start_background_task(target=real_face_video.process_video)
        response = {"message": "Video processing started"}
        print(video_path)
        return jsonify(response)
    except Exception as e:
        print('Error while processing video:', str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/stop', methods=['POST'])
def stop_video_processing():
    global stop_event
    stop_event.set()  # Set the stop event to stop the video processing
    response = {"message": "Video processing stopped"}
    return jsonify(response)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, debug=True, port=port)