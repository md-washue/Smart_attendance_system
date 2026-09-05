import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

const Stack = createNativeStackNavigator();
const BACKEND_URL = "http://192.168.0.18:8000/upload-frame/";
const DASHBOARD_URL = "http://192.168.0.18:8000/attendance";

// --- LOGIN SCREEN ---
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.loginContainer}>
      <View style={styles.loginForm}>
        <Text style={styles.logoText}>ATTENDANCE PRO</Text>
        <Text style={styles.subLogoText}>Teacher Attendance System</Text>
        
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSub}>Sign in to manage your classes and attendance.</Text>
          
          <TextInput style={styles.input} placeholder="Email / Teacher ID" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
          
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.loginBtnText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- DASHBOARD SCREEN ---
function DashboardScreen({ navigation }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    fetch(DASHBOARD_URL)
      .then(response => response.json())
      .then(data => setAttendanceRecords(data.records))
      .catch(error => console.error("Network Error:", error));
  }, []);

  const renderRow = ({ item, index }) => (
    <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
      <Text style={styles.studentName}>{item.name}</Text>
      <Text style={styles.timestamp}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <View style={styles.dashboardHeader}>
        <Text style={styles.headerTitle}>Good Morning, Teacher</Text>
        <Text style={styles.headerCount}>Total Scanned: {attendanceRecords.length}</Text>
      </View>

      <FlatList
        data={attendanceRecords}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderRow}
        style={styles.listArea}
      />

      <TouchableOpacity style={styles.takeAttendanceBtn} onPress={() => navigation.navigate('Scanner')}>
        <Text style={styles.takeAttendanceText}>TAKE ATTENDANCE</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- SCANNER SCREEN ---
function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [status, setStatus] = useState("Ready to scan");

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>We need permission to use the camera</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={requestPermission}>
          <Text style={styles.loginBtnText}>Grant Permission</Text>
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
        formData.append('file', { uri: photo.uri, name: 'student_scan.jpg', type: 'image/jpeg' });
        const response = await axios.post(BACKEND_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

        if (response.data.status === 'success') {
          setStatus(`Success: Student ID ${response.data.student_id}`);
          Alert.alert("Attendance Logged!", `Matched Student ID: ${response.data.student_id}`);
        } else {
          setStatus("Failed: Face not recognized");
          Alert.alert("Scan Failed", response.data.message);
        }
      } catch (error) {
        setStatus("Network error.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      <View style={styles.overlay}>
        <Text style={styles.statusText}>{status}</Text>
        <TouchableOpacity style={styles.scanBtn} onPress={takePictureAndSend}>
          <Text style={styles.scanBtnText}>SCAN FACE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- APP ROUTER ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerTitle: 'Scan Student' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  loginContainer: { flex: 1, backgroundColor: '#F4F7FA', justifyContent: 'center' },
  loginForm: { padding: 20 },
  logoText: { fontSize: 24, fontWeight: '900', color: '#0D6EFD', textAlign: 'center' },
  subLogoText: { fontSize: 14, color: '#6C757D', textAlign: 'center', marginBottom: 40 },
  card: { backgroundColor: 'white', padding: 25, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: '#212529', marginBottom: 5 },
  welcomeSub: { fontSize: 14, color: '#6C757D', marginBottom: 25 },
  input: { borderWidth: 1, borderColor: '#E9ECEF', padding: 15, borderRadius: 10, marginBottom: 15, backgroundColor: '#FAFAFA' },
  loginBtn: { backgroundColor: '#0D6EFD', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  dashboardContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  dashboardHeader: { padding: 25, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#E9ECEF', paddingTop: 60 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#212529' },
  headerCount: { color: '#0D6EFD', fontSize: 14, fontWeight: 'bold', marginTop: 5 },
  listArea: { flex: 1, width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderColor: '#E9ECEF' },
  rowEven: { backgroundColor: '#FFFFFF' },
  rowOdd: { backgroundColor: '#F8F9FA' },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#212529' },
  timestamp: { fontSize: 12, color: '#6C757D', marginTop: 2 },
  takeAttendanceBtn: { backgroundColor: '#0D6EFD', padding: 18, margin: 20, borderRadius: 12, alignItems: 'center' },
  takeAttendanceText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  camera: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  statusText: { backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: 10, borderRadius: 5, marginBottom: 20, fontSize: 16 },
  scanBtn: { backgroundColor: '#007BFF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  scanBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
});