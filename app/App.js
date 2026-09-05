import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, SafeAreaView, FlatList } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [status, setStatus] = useState("Ready to scan");
  const [currentView, setCurrentView] = useState('scanner');
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Configured for your specific Wi-Fi network
  const BACKEND_URL = "http://192.168.0.18:8000/upload-frame/";
  const DASHBOARD_URL = "http://192.168.0.18:8000/attendance";

  // Fetch data when switching to the dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      fetch(DASHBOARD_URL)
        .then(response => response.json())
        .then(data => setAttendanceRecords(data.records))
        .catch(error => console.error("Network Error:", error));
    }
  }, [currentView]);

  if (!permission) return <View />;
  
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
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

  const renderRow = ({ item, index }) => (
    <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
      <Text style={styles.studentName}>{item.name}</Text>
      <Text style={styles.timestamp}>{item.time}</Text>
    </View>
  );

  // ---------------- DASHBOARD VIEW ----------------
  if (currentView === 'dashboard') {
    return (
      <SafeAreaView style={styles.dashboardContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today's Attendance</Text>
          <Text style={styles.headerCount}>Total Scanned: {attendanceRecords.length}</Text>
        </View>

        <FlatList
          data={attendanceRecords}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderRow}
          style={styles.listArea}
        />

        <TouchableOpacity style={styles.navButton} onPress={() => setCurrentView('scanner')}>
          <Text style={styles.navButtonText}>← RETURN TO SCANNER</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ---------------- SCANNER VIEW ----------------
  return (
    <View style={styles.container}>
      {/* CameraView is now completely empty to fix the Expo warning */}
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      
      {/* Overlay UI is positioned absolutely on top of the camera */}
      <View style={styles.overlay}>
        <Text style={styles.statusText}>{status}</Text>
        
        <TouchableOpacity style={styles.captureButton} onPress={takePictureAndSend}>
          <Text style={styles.buttonText}>SCAN FACE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dashboardToggle} onPress={() => setCurrentView('dashboard')}>
          <Text style={styles.dashboardToggleText}>VIEW DASHBOARD</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  statusText: { backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: 10, borderRadius: 5, marginBottom: 20, fontSize: 16 },
  captureButton: { backgroundColor: '#007BFF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10, marginBottom: 15 },
  buttonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  text: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  
  dashboardToggle: { backgroundColor: '#212529', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  dashboardToggleText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  dashboardContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: '#0D6EFD', padding: 20, alignItems: 'center', paddingTop: 50 },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  headerCount: { color: '#E9ECEF', fontSize: 16, marginTop: 5 },
  listArea: { flex: 1, width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderColor: '#E9ECEF' },
  rowEven: { backgroundColor: '#FFFFFF' },
  rowOdd: { backgroundColor: '#F8F9FA' },
  studentName: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
  timestamp: { fontSize: 14, color: '#6C757D', marginTop: 2 },
  navButton: { backgroundColor: '#212529', padding: 20, margin: 15, borderRadius: 8, alignItems: 'center' },
  navButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});