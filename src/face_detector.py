import cv2
import numpy as np
import os

class SmartFaceDetector:
    def __init__(self):
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        self.face_cascade = cv2.CascadeClassifier('models/haarcascade_frontalface_default.xml')
        
    def train_model(self, data_dir='data/raw_student_faces/'):
        faces = []
        student_ids = []
        
        for root, dirs, files in os.walk(data_dir):
            for file in files:
                if file.endswith("jpg") or file.endswith("png"):
                    path = os.path.join(root, file)
                    
                    # Read image in grayscale
                    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
                    # Extract student ID from the folder name (must be integers)
                    student_id = int(os.path.basename(root))
                    
                    # Detect the face to ensure accurate training crops
                    detected_faces = self.face_cascade.detectMultiScale(img, scaleFactor=1.2, minNeighbors=5)
                    for (x, y, w, h) in detected_faces:
                        faces.append(img[y:y+h, x:x+w])
                        student_ids.append(student_id)
                        
        # Train and save the model
        self.recognizer.train(faces, np.array(student_ids))
        self.recognizer.write('models/face_encodings.yml')
        print("Training complete. Model saved to models/face_encodings.yml")

    def recognize(self, image_array):
        # Load the trained model
        self.recognizer.read('models/face_encodings.yml')
        
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5)
        
        results = []
        for (x, y, w, h) in faces:
            student_id, confidence = self.recognizer.predict(gray[y:y+h, x:x+w])
            
            if confidence < 75:
                results.append({"student_id": student_id, "confidence": confidence})
            else:
                results.append({"student_id": "Unknown", "confidence": confidence})
                
        return results

if __name__ == "__main__":
    detector = SmartFaceDetector()
