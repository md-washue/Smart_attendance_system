import sqlite3

def seed_database():
    conn = sqlite3.connect('data/attendance_records.sqlite')
    cursor = conn.cursor()
    
    test_students = [
        (1, "Md Muhaiminur Rhaman Washue"),
        (2, "Jane Doe"),
        (3, "John Smith")
    ]
    
    cursor.executemany("INSERT OR IGNORE INTO students (student_id, name) VALUES (?, ?)", test_students)
    conn.commit()
    conn.close()
    print("Database seeded with test students.")

if __name__ == '__main__':
    seed_database()