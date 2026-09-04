from fastapi import FastAPI, UploadFile, File
import cv2
import numpy as np
import sqlite3
import os
from src.face_detector import SmartFaceDetector

app = FastAPI(title="Smart Attendance API")
detector = SmartFaceDetector()

def log_attendance(student_id):
    """Logs the timestamp into the SQLite database."""
    try:
        conn = sqlite3.connect('data/attendance_records.sqlite')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO attendance (student_id) VALUES (?)", (student_id,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Database error: {e}")
        return False

@app.post("/upload-frame/")
async def process_frame(file: UploadFile = File(...)):
    # Read the incoming image file from the mobile app
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    try:
        results = detector.recognize(img)
    except cv2.error:
        # Mock response for testing the mobile app before training the AI
        print("Model not trained yet. Returning mock success data.")
        results = [{"student_id": 1, "confidence": 45.0}]

    if not results:
        return {"status": "failed", "message": "No face detected in frame."}

    # Grab the best match (lowest confidence score in LBPH)
    best_match = min(results, key=lambda x: x['confidence'])
    
    if best_match['student_id'] != "Unknown":
        log_attendance(best_match['student_id'])
        return {
            "status": "success", 
            "message": "Attendance recorded.", 
            "student_id": best_match['student_id']
        }
    else:
        return {"status": "failed", "message": "Face not recognized."}

@app.get("/attendance")
def get_attendance():
    """Fetches the latest attendance logs with student names to display on the mobile app."""
    conn = sqlite3.connect('data/attendance_records.sqlite')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT students.name, attendance.timestamp 
        FROM attendance 
        JOIN students ON attendance.student_id = students.student_id
        ORDER BY attendance.timestamp DESC
    ''')
    records = cursor.fetchall()
    conn.close()
    
    return {"records": [{"name": row[0], "time": row[1]} for row in records]}