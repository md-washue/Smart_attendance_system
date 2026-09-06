import os
import sqlite3
import csv
import numpy as np
from face_detector import SmartFaceDetector 

DB_PATH = '../data/attendance_records.sqlite'
FACES_DIR = '../data/raw_student_faces/'
CSV_PATH = '../data/students.csv'

def run_batch_registration():
    detector = SmartFaceDetector()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registered_students (
            student_id TEXT PRIMARY KEY,
            name TEXT,
            face_encoding BLOB
        )
    ''')

    # Load student mapping from CSV
    student_mapping = {}
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                student_mapping[row['folder_id']] = {
                    'matric': row['matric_number'],
                    'name': row['name']
                }
    else:
        print("⚠️ Warning: students.csv not found. Using folder numbers as IDs.")

    print("Starting batch registration processing...")
    
    for folder_id in os.listdir(FACES_DIR):
        student_folder = os.path.join(FACES_DIR, folder_id)
        
        if not os.path.isdir(student_folder):
            continue
            
        print(f"\nProcessing Folder ID: {folder_id}...")
        encodings = []
        
        for img_name in os.listdir(student_folder):
            img_path = os.path.join(student_folder, img_name)
            
            try:
                encoding = detector.get_encoding(img_path)
                if encoding is not None:
                    encodings.append(encoding)
                else:
                    print(f"  -> ⚠️ No clear face found in {img_name}")
            except Exception as e:
                print(f"  -> ❌ Error processing {img_name}: {e}")
        
        if encodings:
            avg_encoding = np.mean(encodings, axis=0)
            encoding_bytes = avg_encoding.tobytes()
            
            # Lookup real name and matric number; default to folder ID if missing
            info = student_mapping.get(folder_id, {'matric': folder_id, 'name': f"Unknown {folder_id}"})
            matric_num = info['matric']
            real_name = info['name']
            
            cursor.execute('''
                INSERT OR REPLACE INTO registered_students (student_id, name, face_encoding)
                VALUES (?, ?, ?)
            ''', (matric_num, real_name, encoding_bytes))
            
            print(f"✅ Registered: {real_name} ({matric_num}) using {len(encodings)} valid faces.")
        else:
            print(f"❌ Failed: No valid faces found in folder {folder_id}.")

    conn.commit()
    conn.close()
    print("\nBatch registration complete.")

if __name__ == '__main__':
    run_batch_registration()