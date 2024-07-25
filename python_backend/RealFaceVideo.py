import cv2
import mediapipe as mp
import numpy as np
from scipy.spatial import procrustes
import os
import time
from threading import Event

class RealFaceVideo:
    def __init__(self, video_path, socketio, stop_event):
        # Convert relative path to absolute path
        if not os.path.isabs(video_path):
            video_path = os.path.abspath(video_path)
        self.video_path = video_path
        self.socketio = socketio
        self.stop_event = stop_event
        self.start_time = None  # Initialize start_time here

        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(static_image_mode=False,
                                                    max_num_faces=2,
                                                    min_detection_confidence=0.5,
                                                    min_tracking_confidence=0.5)

        self.mp_drawing = mp.solutions.drawing_utils
        self.drawing_spec = self.mp_drawing.DrawingSpec(thickness=1, circle_radius=1)

        self.cap = cv2.VideoCapture(0)
        self.video_cap = cv2.VideoCapture(video_path)

        self.LEFT_EYE_INDICES = [33, 133, 144, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
        self.RIGHT_EYE_INDICES = [362, 263, 387, 386, 385, 384, 382, 381, 380, 374, 373, 390, 249, 466]

        self.socketio.on_event('stop_video', self.stop_video)

    def stop_video(self, data):
        self.stop_event.set()

    def preprocess_eye(self, eye_image):
        if len(eye_image.shape) == 3:
            eye_image = cv2.cvtColor(eye_image, cv2.COLOR_BGR2GRAY)
        eye_image = cv2.GaussianBlur(eye_image, (7, 7), 0)
        return eye_image

    def detect_pupil(self, eye_image):
        _, thresh = cv2.threshold(eye_image, 50, 255, cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        if len(contours) == 0:
            return None, None, None
        max_contour = max(contours, key=cv2.contourArea)
        ((x, y), radius) = cv2.minEnclosingCircle(max_contour)
        return int(x), int(y), int(radius)

    def get_landmarks(self, face_landmarks, image_shape):
        return np.array([[lm.x * image_shape[1], lm.y * image_shape[0]] for lm in face_landmarks.landmark])
#
    def process_video(self):
        while self.cap.isOpened() and self.video_cap.isOpened():
            if self.stop_event.is_set():
                print("Stop event set, breaking the loop.")
                break

            success, image = self.cap.read()
            success_video, video_frame = self.video_cap.read()

            if not success or not success_video:
                break

            # Flip the image from the webcam
            image = cv2.flip(image, 1)

            # Process webcam image
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image_rgb.flags.writeable = False
            results_webcam = self.face_mesh.process(image_rgb)
            image_rgb.flags.writeable = True
            image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)

            # Process video frame
            video_frame_rgb = cv2.cvtColor(video_frame, cv2.COLOR_BGR2RGB)
            video_frame_rgb.flags.writeable = False
            results_video = self.face_mesh.process(video_frame_rgb)
            video_frame_rgb.flags.writeable = True
            video_frame = cv2.cvtColor(video_frame_rgb, cv2.COLOR_RGB2BGR)

            face_data = []
            monitor_view_status = "Not looking at monitor"
            disparity = 0.0

            if results_webcam.multi_face_landmarks:
                left_gaze_direction = ""
                right_gaze_direction = ""

                for face_landmarks in results_webcam.multi_face_landmarks:
                    landmarks = self.get_landmarks(face_landmarks, image.shape)
                    face_data.append(landmarks)
                    self.mp_drawing.draw_landmarks(
                        image=image,
                        landmark_list=face_landmarks,
                        connections=self.mp_face_mesh.FACEMESH_TESSELATION,
                        landmark_drawing_spec=self.drawing_spec,
                        connection_drawing_spec=self.drawing_spec)

                    left_eye_landmarks = [(int(face_landmarks.landmark[i].x * image.shape[1]),
                                        int(face_landmarks.landmark[i].y * image.shape[0])) for i in self.LEFT_EYE_INDICES]
                    right_eye_landmarks = [(int(face_landmarks.landmark[i].x * image.shape[1]),
                                            int(face_landmarks.landmark[i].y * image.shape[0])) for i in self.RIGHT_EYE_INDICES]

                    left_eye_np = np.array(left_eye_landmarks)
                    right_eye_np = np.array(right_eye_landmarks)

                    left_eye_rect = cv2.boundingRect(left_eye_np)
                    right_eye_rect = cv2.boundingRect(right_eye_np)

                    lx, ly, lw, lh = left_eye_rect
                    rx, ry, rw, rh = right_eye_rect

                    if lw > 0 and lh > 0:
                        left_eye_roi = image[ly:ly + lh, lx:lx + lw]
                        if left_eye_roi.size > 0:
                            left_eye_gray = self.preprocess_eye(left_eye_roi)

                            try:
                                pupil_x_l, pupil_y_l, pupil_radius_l = self.detect_pupil(left_eye_gray)
                                if pupil_x_l is not None and pupil_y_l is not None and pupil_radius_l is not None:
                                    cv2.circle(left_eye_roi, (pupil_x_l, pupil_y_l), pupil_radius_l, (0, 255, 0), 2)
                                    cv2.circle(left_eye_roi, (pupil_x_l, pupil_y_l), 2, (0, 0, 255), 3)

                                    if pupil_x_l < lw / 3.0:
                                        left_gaze_direction = "Left"
                                    elif pupil_x_l > 2.0 * lw / 3.0:
                                        left_gaze_direction = "Right"
                                    else:
                                        left_gaze_direction = "Center"

                                    if pupil_y_l < lh / 3.0:
                                        left_gaze_direction += " Center"
                                    elif pupil_y_l > 2.0 * lh / 3.0:
                                        left_gaze_direction += " Center"
                                    else:
                                        left_gaze_direction += " Center"

                                    cv2.putText(image, f'Left Eye Gaze: {left_gaze_direction}', (lx, ly - 10), cv2.FONT_HERSHEY_SIMPLEX,
                                                0.5, (36, 255, 12), 2)
                            except:
                                left_gaze_direction = "Unknown"

                    if rw > 0 and rh > 0:
                        right_eye_roi = image[ry:ry + rh, rx:rx + rw]
                        if right_eye_roi.size > 0:
                            right_eye_gray = self.preprocess_eye(right_eye_roi)

                            try:
                                pupil_x_r, pupil_y_r, pupil_radius_r = self.detect_pupil(right_eye_gray)
                                if pupil_x_r is not None and pupil_y_r is not None and pupil_radius_r is not None:
                                    cv2.circle(right_eye_roi, (pupil_x_r, pupil_y_r), pupil_radius_r, (0, 255, 0), 2)
                                    cv2.circle(right_eye_roi, (pupil_x_r, pupil_y_r), 2, (0, 0, 255), 3)

                                    if pupil_x_r < rw / 3.0:
                                        right_gaze_direction = "Left"
                                    elif pupil_x_r > 2.0 * rw / 3.0:
                                        right_gaze_direction = "Right"
                                    else:
                                        right_gaze_direction = "Center"

                                    if pupil_y_r < rh / 3.0:
                                        right_gaze_direction += " Center"
                                    elif pupil_y_r > 2.0 * rh / 3.0:
                                        right_gaze_direction += " Center"
                                    else:
                                        right_gaze_direction += " Center"

                                    cv2.putText(image, f'Right Eye Gaze: {right_gaze_direction}', (rx, ry - 10), cv2.FONT_HERSHEY_SIMPLEX,
                                                0.5, (36, 255, 12), 2)
                            except:
                                right_gaze_direction = "Unknown"

                if left_gaze_direction == "Center Center" and right_gaze_direction == "Center Center":
                    monitor_view_status = "Looking at monitor"

            if results_video.multi_face_landmarks:
                for face_landmarks in results_video.multi_face_landmarks:
                                    landmarks = self.get_landmarks(face_landmarks, video_frame.shape)
                                    face_data.append(landmarks)
                                    self.mp_drawing.draw_landmarks(
                                        image=video_frame,
                                        landmark_list=face_landmarks,
                                        connections=self.mp_face_mesh.FACEMESH_TESSELATION,
                                        landmark_drawing_spec=self.drawing_spec,
                                        connection_drawing_spec=self.drawing_spec)

            if len(face_data) == 2:
                _, _, disparity = procrustes(face_data[0], face_data[1])
                disparity_value = disparity * 1000
                cv2.putText(image, f'Disparity: {disparity_value:.10f}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

                result = {
                    "disparity": disparity_value,
                    "monitor_view_status": monitor_view_status
                }
                print(result)
                self.socketio.emit('video_processed', result)

                if cv2.waitKey(5) & 0xFF == 27:
                    break