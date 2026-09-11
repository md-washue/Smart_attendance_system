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

## ⚙️ Backend Setup (Laptop)
1. Navigate to the project root and create a Python virtual environment: 
   ```bash
   python -m venv .venv