from fastapi import FastAPI, UploadFile, File
import cv2
import numpy as np
import sqlite3
import os
import csv
from face_detector import SmartFaceDetector 

app = FastAPI(title="Smart Attendance API")
detector = SmartFaceDetector()

DB_PATH = '../data/attendance_records.sqlite'
CSV_PATH = '../data/students.csv'

# Dictionary to hold the ID-to-Name mapping in memory
student_mapping = {}

@app.on_event("startup")
def startup_event():
    """Loads student data and ensures the database table exists on startup."""
    # Load CSV mapping to translate integer folder IDs to real names
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                student_mapping[int(row['folder_id'])] = row['name']
    else:
        print("⚠️ Warning: students.csv not found in data folder.")

    # Setup Database Table automatically
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
    """Logs the attendance record securely into SQLite using parameterized queries."""
    try:
        conn = sqlite3.connect(DB_PATH)
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
        
        # Lookup the real name from the CSV data
        real_name = student_mapping.get(matched_id, f"Student ID {matched_id}")
        
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
    """Fetches the latest attendance logs and maps IDs to real names for the frontend."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT student_id, timestamp 
        FROM attendance 
        ORDER BY timestamp DESC
        LIMIT 50
    ''')
    records = cursor.fetchall()
    conn.close()
    
    # Use Python to map the integer ID back to the real string name using the CSV dictionary
    formatted_records = []
    for row in records:
        student_id = row[0]
        timestamp = row[1]
        real_name = student_mapping.get(student_id, f"Unknown ID ({student_id})")
        formatted_records.append({"name": real_name, "time": timestamp})
        
    return {"records": formatted_records}