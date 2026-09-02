import sqlite3
import os

def create_database():
    os.makedirs('data', exist_ok=True)
    
    conn = sqlite3.connect('data/attendance_records.sqlite')
    cursor = conn.cursor()
    
    # Create Students table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            student_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES students(student_id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database created successfully at data/attendance_records.sqlite")

if __name__ == '__main__':
    create_database()