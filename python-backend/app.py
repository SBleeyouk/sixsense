from flask import Flask, request, jsonify
from flask_cors import CORS
import RealFaceVideo  # Ensure this is your script with the necessary functions

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

@app.route('/api/process', methods=['POST'])
def process_data():
    data = request.json
    # Call the relevant function from your RealFaceVideo script
    result = RealFaceVideo.process_video(data)  # Replace with your actual function call
    response = {"message": "Data processed successfully", "result": result}
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)