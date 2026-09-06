import cv2
import numpy as np
import os

class SmartFaceDetector:
    def __init__(self):
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        # FIXED: Added '../' so it looks up one level from the src folder
        cascade_path = '../models/haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        if self.face_cascade.empty():
            print(f"⚠️ Error: Could not load cascade classifier at {cascade_path}")
        
    def train_model(self, data_dir='../data/raw_student_faces/'):
        faces = []
        student_ids = []
        
        print(f"Scanning directory: {data_dir}")
        for root, dirs, files in os.walk(data_dir):
            for file in files:
                # FIXED: Added .jpeg to support your WhatsApp image downloads
                if file.lower().endswith(('.jpg', '.png', '.jpeg')):
                    path = os.path.join(root, file)
                    
                    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
                    if img is None:
                        continue
                        
                    try:
                        # Ensures the folder name is an integer (1, 2, 3...)
                        student_id = int(os.path.basename(root))
                    except ValueError:
                        continue
                    
                    detected_faces = self.face_cascade.detectMultiScale(img, scaleFactor=1.2, minNeighbors=5)
                    for (x, y, w, h) in detected_faces:
                        faces.append(img[y:y+h, x:x+w])
                        student_ids.append(student_id)
                        
        if not faces:
            print("❌ No faces found to train on.")
            return

        print(f"Training on {len(faces)} valid faces...")
        self.recognizer.train(faces, np.array(student_ids))
        
        # FIXED: Added '../' to save in the correct directory
        self.recognizer.write('../models/face_encodings.yml')
        print("✅ Training complete. Model saved to ../models/face_encodings.yml")

    def recognize(self, image_array):
        try:
            # FIXED: Added '../' for the read path
            self.recognizer.read('../models/face_encodings.yml')
        except Exception as e:
            print(f"Error loading model: {e}")
            return []
        
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5)
        
        results = []
        for (x, y, w, h) in faces:
            student_id, confidence = self.recognizer.predict(gray[y:y+h, x:x+w])
            
            # For OpenCV LBPH, lower confidence is better (0 is a perfect match)
            if confidence < 75:
                results.append({"student_id": student_id, "confidence": confidence})
            else:
                results.append({"student_id": "Unknown", "confidence": confidence})
                
        return results

if __name__ == "__main__":
    detector = SmartFaceDetector()
    detector.train_model()