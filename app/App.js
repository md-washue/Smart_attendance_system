import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert, Platform, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

const Stack = createNativeStackNavigator();
const BACKEND_URL = "http://192.168.0.18:8000/upload-frame/";
const DASHBOARD_URL = "http://192.168.0.18:8000/attendance";

// --- LOGIN SCREEN ---
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email === 'admin' && password === 'admin') {
      navigation.navigate('Dashboard');
    } else {
      Alert.alert('Login Failed', 'Invalid login ID or password.');
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <View style={styles.loginForm}>
        <MaterialCommunityIcons
          name="shield-lock-outline"
          size={60}
          color="#0D6EFD"
          style={{ alignSelf: 'center', marginBottom: 10 }}
        />

        <Text style={styles.logoText}>ATTENDANCE PRO</Text>
        <Text style={styles.subLogoText}>Teacher Attendance System</Text>

        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSub}>
            Sign in to manage your classes and attendance.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Login ID"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
          >
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
  
  // Practical Calculation Variables
  const TOTAL_STUDENTS = 42;
  const scannedCount = attendanceRecords.length;
  const attendancePercent = scannedCount > 0 ? Math.round((scannedCount / TOTAL_STUDENTS) * 100) : 0;
  const pendingCount = TOTAL_STUDENTS - scannedCount;

  useEffect(() => {
    fetch(DASHBOARD_URL)
      .then(response => response.json())
      .then(data => setAttendanceRecords(data.records))
      .catch(error => console.error("Network Error:", error));
  }, []);

  const handleComingSoon = () => {
    Alert.alert("Coming Soon", "This feature is currently under development.");
  };

  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerArea}>
          <View>
            <Text style={styles.greetingText}>Good Morning,</Text>
            <Text style={styles.nameText}>Dr. Shahrin👋</Text>
            <Text style={styles.dateText}>Saturday, September 5, 2026</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
                onPress={() => Alert.alert(
                  "Notifications",
                  "You have no new notifications."
                )}
                style={{ marginRight: 15 }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={26}
                  color="#212529"
                />
              </TouchableOpacity>

            
            {/* PROFILE PICTURE IMPLEMENTATION */}
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=Muhaiminur+Washue&background=212529&color=fff' }} 
              style={styles.profilePic} 
            />
          </View>
        </View>

        {/* Dynamic Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={styles.statTop}><Ionicons name="calendar" size={20} color="#0D6EFD" /><Text style={styles.statLabel}>Today's Classes</Text></View>
            <Text style={styles.statValue}>1</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.statTop}><Ionicons name="people" size={20} color="#6610f2" /><Text style={styles.statLabel}>Total Scanned</Text></View>
            <Text style={styles.statValue}>{scannedCount}</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.statTop}><Ionicons name="checkmark-circle" size={20} color="#198754" /><Text style={styles.statLabel}>Attendance</Text></View>
            <Text style={[styles.statValue, { color: '#198754' }]}>{attendancePercent}%</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.statTop}><Ionicons name="time" size={20} color="#fd7e14" /><Text style={styles.statLabel}>Pending</Text></View>
            <Text style={[styles.statValue, { color: '#fd7e14' }]}>{pendingCount}</Text>
          </View>
        </View>

        {/* Classes List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Classes</Text>
          <Text style={styles.viewAllText}>View all ➔</Text>
        </View>

        <View style={styles.classCard}>
          <View style={styles.classHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: '#0D6EFD' }]}><Ionicons name="git-network-outline" size={24} color="white" /></View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Artificial Intelligence</Text>
            </View>
          </View>
          
          <View style={styles.classDetails}>
            <Text style={styles.detailText}><Ionicons name="time-outline" size={12} /> 9:00 AM - 10:00 AM</Text>
            <Text style={styles.detailText}><Ionicons name="location-outline" size={12} /> Cyberjaya Lab 1</Text>
            <Text style={styles.detailText}><Ionicons name="people-outline" size={12} /> {TOTAL_STUDENTS} Students</Text>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${attendancePercent}%` }]} /></View>
            <Text style={styles.progressText}>{scannedCount} / {TOTAL_STUDENTS} Present</Text>
          </View>
          
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Scanner')}>
            <Text style={styles.actionBtnText}>TAKE ATTENDANCE</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Interactive Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#0D6EFD" />
          <Text style={[styles.navText, { color: '#0D6EFD' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}>
          <Ionicons name="book-outline" size={24} color="#6C757D" />
          <Text style={styles.navText}>Classes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}>
          <Ionicons name="checkmark-done-outline" size={24} color="#6C757D" />
          <Text style={styles.navText}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}>
          <Ionicons name="bar-chart-outline" size={24} color="#6C757D" />
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}>
          <Ionicons name="person-outline" size={24} color="#6C757D" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
        <TouchableOpacity style={styles.loginBtn} onPress={requestPermission}><Text style={styles.loginBtnText}>Grant Permission</Text></TouchableOpacity>
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
          setStatus(`Success: ID ${response.data.student_id}`);
          Alert.alert("Logged!", `Student ID: ${response.data.student_id}`);
        } else {
          setStatus("Failed: Face not recognized");
          Alert.alert("Failed", response.data.message);
        }
      } catch (error) { setStatus("Network error."); }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      <View style={styles.overlay}>
        <Text style={styles.statusText}>{status}</Text>
        <TouchableOpacity style={styles.scanBtn} onPress={takePictureAndSend}><Text style={styles.scanBtnText}>SCAN FACE</Text></TouchableOpacity>
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
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerTitle: 'Scan Student', headerBackTitle: 'Back' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  loginContainer: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center' },
  loginForm: { padding: 20 },
  logoText: { fontSize: 24, fontWeight: '900', color: '#0D6EFD', textAlign: 'center' },
  subLogoText: { fontSize: 14, color: '#6C757D', textAlign: 'center', marginBottom: 40 },
  card: { backgroundColor: 'white', padding: 25, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: '#212529', marginBottom: 5 },
  welcomeSub: { fontSize: 14, color: '#6C757D', marginBottom: 25 },
  input: { borderWidth: 1, borderColor: '#E9ECEF', padding: 15, borderRadius: 10, marginBottom: 15, backgroundColor: '#FAFAFA' },
  forgotText: { color: '#0D6EFD', textAlign: 'right', fontWeight: 'bold', marginBottom: 20 },
  loginBtn: { backgroundColor: '#0D6EFD', padding: 16, borderRadius: 10, alignItems: 'center' },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  dashboardContainer: { flex: 1, backgroundColor: '#F4F7FA' },
  headerArea: { flexDirection: 'row', justifyContent: 'space-between', padding: 25, paddingTop: Platform.OS === 'android' ? 50 : 25 },
  greetingText: { fontSize: 14, color: '#6C757D', fontWeight: '600' },
  nameText: { fontSize: 22, fontWeight: '900', color: '#212529', marginTop: 2 },
  dateText: { fontSize: 12, color: '#ADB5BD', marginTop: 4 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  profilePic: { width: 40, height: 40, borderRadius: 20 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  statBox: { width: '48%', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  statTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statLabel: { fontSize: 12, color: '#6C757D', marginLeft: 5, fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#212529' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, marginBottom: 15, alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
  viewAllText: { fontSize: 14, color: '#0D6EFD', fontWeight: '600' },
  
  classCard: { backgroundColor: 'white', marginHorizontal: 20, padding: 20, borderRadius: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  classHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconWrapper: { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  className: { fontSize: 16, fontWeight: 'bold', color: '#212529' },
  classDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  detailText: { fontSize: 11, color: '#6C757D', fontWeight: '500' },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#E9ECEF', borderRadius: 3, marginRight: 10 },
  progressBarFill: { height: 6, backgroundColor: '#198754', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#198754', fontWeight: 'bold' },
  actionBtn: { backgroundColor: '#0D6EFD', padding: 14, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 15, borderTopWidth: 1, borderColor: '#E9ECEF', paddingBottom: Platform.OS === 'ios' ? 25 : 15 },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, marginTop: 4, fontWeight: '500' },
  
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  camera: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  statusText: { backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: 10, borderRadius: 5, marginBottom: 20, fontSize: 16 },
  scanBtn: { backgroundColor: '#007BFF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  scanBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
});