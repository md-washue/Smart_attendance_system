# Smart Attendance System

A local facial recognition attendance system combining a React Native mobile interface with a high-performance FastAPI Python backend. This application replaces manual roll calls by capturing student faces on a mobile device and matching them against an LBPH face recogniser to automatically log attendance in an SQLite database.

## 🚀 Core Features
*   **Real-Time Facial Recognition:** Captures faces using Expo Camera and processes them instantly via OpenCV's `LBPHFaceRecognizer`.
*   **Automated Data Logging:** Securely records timestamped attendance matches directly into a local SQLite database using parameterised queries
*   **Mobile Dashboard:** Displays real-time class statistics, attendance percentages, and recent scan logs through a React Native frontend
*   **Native Network Handling:** Utilises `expo-file-system` to bypass React Native's Android `FormData` limitations, explicitly enabling local cleartext (`http://`) traffic for seamless local network communication.

## 🛠️ Tech Stack
*   **Frontend:** React Native, Expo, Expo Camera, Expo FileSystem.
*   **Backend:** Python, FastAPI, Uvicorn, `python-multipart`.
*   **AI / Computer Vision:** OpenCV (`opencv-contrib-python`), Haar Cascades.
*   **Database:** SQLite3.

## 📋 Prerequisites
*   Python 3.10+.
*   Node.js and npm.
*   Expo CLI.
*   A physical Android device for testing and scanning.

## ⚙️ Backend Setup 
1.  Navigate to the project root and create a Python virtual environment.
2.  **Initialize the Database:** Run `python database_setup.py` to create the `attendance_records.sqlite` database inside a `data/` directory and generate the necessary tables.
3.  **Seed Initial Data:** Run `python seed_db.py` to clear any old records and populate the database with correct test student data.
4.  **Train the AI Model:** Place valid `.jpg`, `.jpeg`, or `.png` images of students in the `../data/raw_student_faces/` directory, organised in folders named by their integer student ID. Run `python face_detector.py` to scan these images and output a trained `face_encodings.yml` model into the `../models/` directory.
5.  **Start the API Server:** Run the FastAPI application found in `api.py` (e.g., using `uvicorn api: app --host 0.0.0.0 --port 8000`) to initialise the `Smart Attendance API` on your local network.

## 📱 Frontend Setup & Execution
*   **Install Dependencies:** Verify that necessary Expo plugins (e.g., `expo-camera`, `expo-sharing`) are included exactly as defined in `app.json`.
*   **Start Development Server:** Execute `npx expo start` in your terminal and scan the resulting QR code with your physical device.
*   **Build Release Version:** To compile a standalone Android package, navigate to your project's `android` directory and run `.\gradlew assembleRelease`.
*   **Configure Network:** On the initial login screen, select **⚙️ Network Settings** to input your backend server's IPv4 address. The application will default to `172.20.10.2` if left unconfigured.
*   **System Login:** Access the main dashboard by entering the default system credentials (**admin** for both the Login ID and Password fields)
