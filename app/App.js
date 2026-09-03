import { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [status, setStatus] = useState("Ready to scan");

  // Configured for your specific Wi-Fi network
  const BACKEND_URL = "http://192.168.0.18:8000/upload-frame/";

  if (!permission) return <View />;
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need permission to use the camera</Text>
        <TouchableOpacity style={styles.captureButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePictureAndSend = async () => {
    if (cameraRef.current) {
      setStatus("Capturing...");
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: false });
        setStatus("Sending to server...");

        const formData = new FormData();
        formData.append('file', {
          uri: photo.uri,
          name: 'student_scan.jpg',
          type: 'image/jpeg',
        });

        const response = await axios.post(BACKEND_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data.status === 'success') {
          setStatus(`Success: Student ID ${response.data.student_id}`);
          Alert.alert("Attendance Logged!", `Matched Student ID: ${response.data.student_id}`);
        } else {
          setStatus("Failed: Face not recognized");
          Alert.alert("Scan Failed", response.data.message);
        }
      } catch (error) {
        setStatus("Network error. Check IP address.");
        console.error(error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.overlay}>
          <Text style={styles.statusText}>{status}</Text>
          <TouchableOpacity style={styles.captureButton} onPress={takePictureAndSend}>
            <Text style={styles.buttonText}>SCAN FACE</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  statusText: { backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: 10, borderRadius: 5, marginBottom: 20, fontSize: 16 },
  captureButton: { backgroundColor: '#007BFF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  buttonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  text: { textAlign: 'center', marginBottom: 20, fontSize: 16 }
});