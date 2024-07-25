import cv2
import torch
import numpy as np
from torchvision import transforms
from FaceLandmarks.lib.config.defaults import _C as cfg
from FaceLandmarks.lib.models.hrnet import get_face_alignment_net
from scipy.spatial import procrustes
from FaceExpressions.Vit_ResNet_Modified import ViT
import os
import socketio

class RealFaceVideo:
    def __init__(self, video_path, socketio, stop_event):
        if not os.path.isabs(video_path):
            video_path = os.path.abspath(video_path)
        self.video_path = video_path
        self.socketio = socketio
        self.stop_event = stop_event

        self.cap = cv2.VideoCapture(0)
        self.video_cap = cv2.VideoCapture(video_path)

        self.LEFT_EYE_INDICES = list(range(60, 68))
        self.RIGHT_EYE_INDICES = list(range(68, 76))

        # HRNet model setup
        self.cfg = cfg
        self.config_file = 'FaceLandmarks/experiments/wflw/face_alignment_wflw_hrnet_w18.yaml'
        self.cfg.defrost()
        self.cfg.merge_from_file(self.config_file)
        self.cfg.freeze()
        self.model = get_face_alignment_net(self.cfg)
        self.hrnet_checkpoint = 'FaceLandmarks/hrnetv2_trained/HR18-WFLW.pth'

        self.device = torch.device("cpu")

        self.load_model()

        self.socketio.on('stop_video', self.stop_video)

        # Expression recognition model setup
        self.expr_model_path = 'FaceExpressions/best_vit_model_New.pth'  # 학습된 모델 경로
        self.expr_model = self.load_expression_model(self.expr_model_path, self.device)
        self.expressions = ['anger', 'disgust', 'fear', 'happiness', 'neutral', 'sadness', 'surprise']

        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    def load_model(self):
        try:
            checkpoint = torch.load(self.hrnet_checkpoint, map_location=self.device)
        except Exception as e:
            print(f"Error loading checkpoint: {e}")
            exit(1)

        if isinstance(checkpoint, dict):
            if 'state_dict' in checkpoint:
                state_dict = checkpoint['state_dict']
            else:
                state_dict = checkpoint

            if isinstance(state_dict, torch.nn.parallel.DataParallel):
                state_dict = state_dict.module.state_dict()

            self.model.load_state_dict(state_dict)
        else:
            raise ValueError("Checkpoint is not a dictionary or does not contain 'state_dict'")

        self.model.to(self.device)
        self.model.eval()

    def load_expression_model(self, model_path, device):
        model = ViT(img_size=128, patch_size=8, in_chans=1, num_classes=7, embed_dim=768, depth=12, num_heads=12)
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.to(device)
        model.eval()
        return model

    def preprocess_image(self, image):
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.4762, 0.4325, 0.4080], std=[0.2680, 0.2558, 0.2546])
        ])
        return transform(image).unsqueeze(0).to(self.device)

    def postprocess_landmarks(self, output, image_shape):
        height, width = image_shape
        output = output.squeeze(0).cpu().numpy()
        num_landmarks = output.shape[0]

        landmarks = []
        for i in range(num_landmarks):
            heatmap = output[i]
            _, conf, _, point = cv2.minMaxLoc(heatmap)
            x, y = point
            x = x * width / heatmap.shape[1]
            y = y * height / heatmap.shape[0]
            landmarks.append((int(x), int(y)))

        return np.array(landmarks)

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

    def recognize_expression(self, face):
        face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)  # 흑백으로 바꾸기
        face = cv2.resize(face, (128, 128))
        transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.ToTensor(),
            #transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        face = transform(face).unsqueeze(0).to(self.device)
        with torch.no_grad():
            output = self.expr_model(face)
        _, pred = torch.max(output, 1)
        return self.expressions[pred.item()]

    def stop_video(self, data):
        self.stop_event.set()

    def process_video(self):
        while self.cap.isOpened() and self.video_cap.isOpened():
            if self.stop_event.is_set():
                print("Stop event set, breaking the loop.")
                break

            success, image = self.cap.read()
            success_video, video_frame = self.video_cap.read()

            if not success:
                break

            if not success_video:
                self.video_cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                success_video, video_frame = self.video_cap.read()
                if not success_video:
                    break

            image = cv2.flip(image, 1)

            face_data = []
            face_data_video = []
            monitor_view_status = "Not looking at monitor"
            disparity = 0.0

            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)

            gray_video = cv2.cvtColor(video_frame, cv2.COLOR_BGR2GRAY)
            faces_video = self.face_cascade.detectMultiScale(gray_video, 1.3, 5)

            for (x, y, w, h) in faces:
                face = image[y:y + h, x:x + w]
                rgb_face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                input_tensor = self.preprocess_image(rgb_face)

                with torch.no_grad():
                    output = self.model(input_tensor)

                landmarks = self.postprocess_landmarks(output, face.shape[:2])
                face_data.append(landmarks)

                for (lx, ly) in landmarks:
                    cv2.circle(image, (x + lx, y + ly), 2, (0, 255, 0), -1)

                left_eye_landmarks = landmarks[self.LEFT_EYE_INDICES[0]:self.LEFT_EYE_INDICES[-1] + 1]
                right_eye_landmarks = landmarks[self.RIGHT_EYE_INDICES[0]:self.RIGHT_EYE_INDICES[-1] + 1]

                left_eye_np = np.array(left_eye_landmarks)
                right_eye_np = np.array(right_eye_landmarks)

                left_eye_rect = cv2.boundingRect(left_eye_np)
                right_eye_rect = cv2.boundingRect(right_eye_np)

                lx, ly, lw, lh = left_eye_rect
                rx, ry, rw, rh = right_eye_rect
                
                left_gaze_direction = "Unknown"  # 초기화
                right_gaze_direction = "Unknown"  # 초기화

                if lw > 0 and lh > 0:
                    left_eye_roi = image[y + ly:y + ly + lh, x + lx:x + lx + lw]
                    if left_eye_roi.size > 0:
                        left_eye_gray = self.preprocess_eye(left_eye_roi)
                        pupil_x_l, pupil_y_l, pupil_radius_l = self.detect_pupil(left_eye_gray)
                        if pupil_x_l is not None and pupil_y_l is not None and pupil_radius_l is not None:
                            cv2.circle(left_eye_roi, (pupil_x_l, pupil_y_l), pupil_radius_l, (0, 255, 0), 2)
                            cv2.circle(left_eye_roi, (pupil_x_l, pupil_y_l), 2, (0, 0, 255), 3)
                            left_gaze_direction = "Center"
                            if pupil_x_l < lw / 3.0:
                                left_gaze_direction = "Left"
                            elif pupil_x_l > 2.0 * lw / 3.0:
                                left_gaze_direction = "Right"
                            if pupil_y_l < lh / 3.0:
                                left_gaze_direction += " Up"
                            elif pupil_y_l > 2.0 * lh / 3.0:
                                left_gaze_direction += " Down"
                            cv2.putText(image, f'Left Eye Gaze: {left_gaze_direction}', (x + lx, y + ly - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (36, 255, 12), 2)

                if rw > 0 and rh > 0:
                    right_eye_roi = image[y + ry:y + ry + rh, x + rx:x + rx + rw]
                    if right_eye_roi.size > 0:
                        right_eye_gray = self.preprocess_eye(right_eye_roi)
                        pupil_x_r, pupil_y_r, pupil_radius_r = self.detect_pupil(right_eye_gray)
                        if pupil_x_r is not None and pupil_y_r is not None and pupil_radius_r is not None:
                            cv2.circle(right_eye_roi, (pupil_x_r, pupil_y_r), pupil_radius_r, (0, 255, 0), 2)
                            cv2.circle(right_eye_roi, (pupil_x_r, pupil_y_r), 2, (0, 0, 255), 3)
                            right_gaze_direction = "Center"
                            if pupil_x_r < rw / 3.0:
                                right_gaze_direction = "Left"
                            elif pupil_x_r > 2.0 * rw / 3.0:
                                right_gaze_direction = "Right"
                            if pupil_y_r < rh / 3.0:
                                right_gaze_direction += " Up"
                            elif pupil_y_r > 2.0 * rh / 3.0:
                                right_gaze_direction += " Down"
                            cv2.putText(image, f'Right Eye Gaze: {right_gaze_direction}', (x + rx, y + ry - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (36, 255, 12), 2)

                if left_gaze_direction == "Center" and right_gaze_direction == "Center":
                    monitor_view_status = "Looking at monitor"

                # 표정 인식
                expression = self.recognize_expression(face)
                cv2.putText(image, expression, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 0, 0), 2)

            for (x, y, w, h) in faces_video:
                face_video = video_frame[y:y + h, x:x + w]
                rgb_face_video = cv2.cvtColor(face_video, cv2.COLOR_BGR2RGB)
                input_tensor_video = self.preprocess_image(rgb_face_video)

                with torch.no_grad():
                    output_video = self.model(input_tensor_video)

                landmarks_video = self.postprocess_landmarks(output_video, face_video.shape[:2])
                face_data_video.append(landmarks_video)

                for (lx, ly) in landmarks_video:
                    cv2.circle(video_frame, (x + lx, y + ly), 2, (0, 255, 0), -1)

            if len(face_data) == 1 and len(face_data_video) == 1:
                relevant_indices = list(range(33, 51)) + list(range(60, 97))
                face_data_relevant = np.array([face_data[0][i] for i in relevant_indices])
                face_data_video_relevant = np.array([face_data_video[0][i] for i in relevant_indices])

                _, _, disparity = procrustes(face_data_relevant, face_data_video_relevant)
                disparity_value = disparity * 1000

                result = {
                    "disparity": disparity_value,
                    "monitor_view_status": monitor_view_status,
                    "expression": expression
                }
                print(result)
                self.socketio.emit('video_processed', result)

            #cv2.imshow('Facial Landmark Detection', image)
            #cv2.imshow('Video Frame', video_frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        #self.cap.release()
        #self.video_cap.release()
        #cv2.destroyAllWindows()


"""
# 얼굴 검출기 로드 (Haar Cascade 사용)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# 소켓 설정
sio = socketio.Client()

@sio.event
def connect():
    print('Connection established')

@sio.event
def disconnect():
    print('Disconnected from server')

# 소켓 연결
sio.connect('http://localhost:5000')

real_face_video = RealFaceVideo('/Users/jy954/PycharmProjects/FaceLandmarks/HRNet-Facial-Landmark-Detection/memoji.mp4', sio)  # 비디오 파일 경로 입력
real_face_video.process_video()

# 소켓 연결 종료
sio.disconnect()

"""
