from fastapi import FastAPI, UploadFile, File
import cv2
import numpy as np
import sqlite3
from datetime import datetime
import os
from face_detector import SmartFaceDetector

app = FastAPI(title="Smart Attendance API")
detector = SmartFaceDetector()

DB_PATH = '../data/attendance_records.sqlite'

@app.on_event("startup")
def startup_event():
    """Ensures the database table exists on startup."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            timestamp DATETIME DEFAULT (datetime('now', 'localtime'))
        )
    ''')
    conn.commit()
    conn.close()

def log_attendance(student_id):
    """Logs the attendance record securely with local time."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        local_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute("INSERT INTO attendance (student_id, timestamp) VALUES (?, ?)", (student_id, local_time))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Database error: {e}")
        return False
    
@app.post("/upload-frame/")
async def process_frame(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    try:
        results = detector.recognize(img)
    except Exception as e:
        return {"status": "error", "message": f"AI Engine Error: {str(e)}"}

    if not results:
        return {"status": "failed", "message": "No face detected in frame."}

    best_match = min(results, key=lambda x: x['confidence'])
    
    if best_match['student_id'] != "Unknown":
        matched_id = best_match['student_id']
        log_attendance(matched_id)
        
        # Lookup real name dynamically from SQLite
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM students WHERE student_id = ?", (matched_id,))
        student_record = cursor.fetchone()
        conn.close()
        
        real_name = student_record[0] if student_record else f"Student ID {matched_id}"
        
        return {
            "status": "success", 
            "message": "Attendance recorded.", 
            "student_id": matched_id,
            "student_name": real_name
        }
    else:
        return {"status": "failed", "message": "Face not recognized."}

@app.get("/attendance")
def get_attendance():
    """Fetches the latest attendance logs with a JOIN query for the frontend."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT students.name, attendance.timestamp 
        FROM attendance 
        LEFT JOIN students ON attendance.student_id = students.student_id
        ORDER BY attendance.timestamp DESC
        LIMIT 50
    ''')
    records = cursor.fetchall()
    conn.close()
    
    formatted_records = [{"name": row[0] or "Unknown", "time": row[1]} for row in records]
        
    return {"records": formatted_records}