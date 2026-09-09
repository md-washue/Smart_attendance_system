import sqlite3

def seed_database():
    conn = sqlite3.connect('data/attendance_records.sqlite')
    cursor = conn.cursor()
    
    # Clear existing data to prevent old mismatch errors
    cursor.execute("DELETE FROM students")
    cursor.execute("DELETE FROM attendance")
    
    test_students = [
        (1, "Loghan A/L Kantheeban"),
        (2, "KHALLEEFAH AMHIMMID"),
        (3, "Basheer Mohamed Basheer Bin Miskee"),
        (4, "Md Muhaimenur Rhaman Washue"),
        (5, "Islam Md Ariful")
    ]
    
    cursor.executemany("INSERT INTO students (student_id, name) VALUES (?, ?)", test_students)
    conn.commit()
    conn.close()
    print("Database seeded with correct students.")

if __name__ == '__main__':
    seed_database()