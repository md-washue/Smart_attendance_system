import * as FileSystem from 'expo-file-system/legacy';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert, Platform, Image, Modal, FlatList } from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import axios from 'axios';


const Stack = createNativeStackNavigator();

// --- LOGIN SCREEN ---
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverIP, setServerIP] = useState('192.168.0.18');
  const [isSettingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('serverIP').then(ip => {
      if (ip) setServerIP(ip);
    });
  }, []);

  const handleSaveIP = async () => {
    await AsyncStorage.setItem('serverIP', serverIP);
    setSettingsVisible(false);
    Alert.alert("Saved", "Network IP updated successfully.");
  };

  const handleLogin = () => {
    if (email === 'admin' && password === 'admin') {
      navigation.navigate('Dashboard', { serverIP });
    } else {
      Alert.alert('Login Failed', 'Invalid login ID or password.');
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <View style={styles.loginForm}>
        <MaterialCommunityIcons name="shield-lock-outline" size={60} color="#0D6EFD" style={{ alignSelf: 'center', marginBottom: 10 }} />
        <Text style={styles.logoText}>SMART ATTENDANCE</Text>
        <Text style={styles.subLogoText}>Teacher Attendance System</Text>

        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSub}>Sign in to manage your classes and attendance.</Text>
          <TextInput style={styles.input} placeholder="Login ID" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

          <TouchableOpacity onPress={() => setSettingsVisible(true)}>
            <Text style={styles.forgotText}>⚙️ Network Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={isSettingsVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Backend Configuration</Text>
            <Text style={styles.modalSub}>Enter your laptop's current IPv4 Address</Text>
            <TextInput style={styles.input} value={serverIP} onChangeText={setServerIP} keyboardType="numeric" />
            <TouchableOpacity style={styles.loginBtn} onPress={handleSaveIP}>
              <Text style={styles.loginBtnText}>SAVE IP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setSettingsVisible(false)}>
              <Text style={{ textAlign: 'center', color: '#6C757D' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- DASHBOARD SCREEN ---
function DashboardScreen({ route, navigation }) {
  const { serverIP } = route.params;
  const DASHBOARD_URL = `http://${serverIP}:8000/attendance`;
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [isRosterVisible, setRosterVisible] = useState(false);

  const fullStudentList = [
  { id: '1', matric: 'BIT2503-0887', name: 'Loghan A/L Kantheeban' },
  { id: '2', matric: 'BIT2503-0729', name: 'KHALLEEFAH AMHIMMID' },
  { id: '3', matric: 'BIT2503-0879', name: 'Basheer Mohamed Basheer Bin Miskee' },
  { id: '4', matric: 'BIT2503-1028', name: 'Md Muhaimenur Rhaman Washue' },
  { id: '5', matric: 'BIT2503-1037', name: 'Islam Md Ariful' }
];

  const handleExportCSV = async () => {
    // 1. Setup CSV Headers
    let csvString = "Name,Matric Number,Status,Time Scanned\n";

    // 2. Loop through roster to build rows
    rosterData.forEach(student => {
      // Find the scan time if they are present
      const record = attendanceRecords.find(r => r.name.includes(student.name.trim()));
      const scanTime = record ? record.time : "N/A";
      
      csvString += `${student.name},${student.matric},${student.status},${scanTime}\n`;
    });

    // 3. Save to device storage
    const fileUri = FileSystem.documentDirectory + "Attendance_Report.csv";

    try {
      await FileSystem.writeAsStringAsync(fileUri, csvString, { 
        encoding: FileSystem.EncodingType.UTF8 
      });
      // 4. Open the native Share sheet (WhatsApp, Email, etc.)
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert("Export Error", "Failed to generate report.");
    }
  };

  const handleClearAttendance = () => {
  Alert.alert(
    "Clear Attendance",
    "Are you sure you want to delete all scanned records for today?",
    [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Clear", 
        style: "destructive",
        onPress: () => {
          fetch(DASHBOARD_URL, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
              if(data.status === 'success') {
                setAttendanceRecords([]); // Instantly resets the dashboard to 0
                Alert.alert("Cleared", "All attendance records have been reset.");
              }
            })
            .catch(error => console.error("Error clearing:", error));
        }
      }
    ]
  );
};

  const rosterData = fullStudentList.map(student => {
    const isPresent = attendanceRecords.some(record => record.name.includes(student.name.trim()));
    return { ...student, status: isPresent ? 'Present' : 'Pending' };
  });


  
  const TOTAL_STUDENTS = 5;
  const scannedCount = attendanceRecords.length;
  const attendancePercent = scannedCount > 0 ? Math.round((scannedCount / TOTAL_STUDENTS) * 100) : 0;
  const pendingCount = TOTAL_STUDENTS - scannedCount;

  useFocusEffect(
    useCallback(() => {
      fetch(DASHBOARD_URL)
        .then(response => response.json())
        .then(data => setAttendanceRecords(data.records || []))
        .catch(error => console.error("Network Error:", error));
    }, [DASHBOARD_URL])
  );

  const handleComingSoon = () => Alert.alert("Coming Soon", "This feature is currently under development.");

  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <View>
            <Text style={styles.greetingText}>Good Morning,</Text>
            <Text style={styles.nameText}>Dr. Shahrin👋</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleClearAttendance} style={{ marginRight: 15 }}>
            <Ionicons name="trash-outline" size={26} color="#DC3545" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert("Notifications", "No new notifications.")} style={{ marginRight: 15 }}>
            <Ionicons name="notifications-outline" size={26} color="#212529" />
          </TouchableOpacity>
          <Image source={{ uri: 'https://ui-avatars.com/api/?name=Muhaiminur+Washue&background=212529&color=fff' }} style={styles.profilePic} />
        </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={styles.statTop}><Ionicons name="calendar" size={20} color="#0D6EFD" /><Text style={styles.statLabel}>Today's Classes</Text></View>
            <Text style={styles.statValue}>1</Text>
          </View>
          
          <TouchableOpacity style={styles.statBox} onPress={() => setRosterVisible(true)}>
            <View style={styles.statTop}><Ionicons name="people" size={20} color="#6610f2" /><Text style={styles.statLabel}>Total Scanned</Text></View>
            <Text style={styles.statValue}>{scannedCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} onPress={() => setRosterVisible(true)}>
            <View style={styles.statTop}><Ionicons name="checkmark-circle" size={20} color="#198754" /><Text style={styles.statLabel}>Attendance</Text></View>
            <Text style={[styles.statValue, { color: '#198754' }]}>{attendancePercent}%</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} onPress={() => setRosterVisible(true)}>
            <View style={styles.statTop}><Ionicons name="time" size={20} color="#fd7e14" /><Text style={styles.statLabel}>Pending</Text></View>
            <Text style={[styles.statValue, { color: '#fd7e14' }]}>{pendingCount}</Text>
          </TouchableOpacity>
          
        </View>

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
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Scanner', { serverIP })}>
            <Text style={styles.actionBtnText}>TAKE ATTENDANCE</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Scans List injected directly below classCard */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
        </View>
        
        {attendanceRecords.map((record, index) => (
          <View key={index} style={{ 
            backgroundColor: 'white', marginHorizontal: 20, padding: 15, borderRadius: 10, 
            marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between',
            shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1
          }}>
            <Text style={{ fontWeight: 'bold', color: '#212529', fontSize: 14 }}>
              <Ionicons name="person-circle-outline" size={16} color="#0D6EFD" /> {record.name}
            </Text>
            <Text style={{ color: '#198754', fontSize: 12, fontWeight: 'bold' }}>
              {record.time.split(' ')[1]}
            </Text>
          </View>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>

      <Modal visible={isRosterVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: '#F4F7FA', padding: 20, paddingTop: 50 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Class Roster</Text>
            
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <TouchableOpacity onPress={handleExportCSV} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E9ECEF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                <Ionicons name="download-outline" size={18} color="#212529" />
                <Text style={{ marginLeft: 5, fontWeight: 'bold', fontSize: 12 }}>CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setRosterVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#6C757D" />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={rosterData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ 
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10,
                shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 
              }}>
                <View>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
                  <Text style={{ color: '#6C757D', fontSize: 12 }}>{item.matric}</Text>
                </View>
                <View style={{ 
                  backgroundColor: item.status === 'Present' ? '#D1E7DD' : '#FFF3CD', 
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 
                }}>
                  <Text style={{ 
                    color: item.status === 'Present' ? '#0F5132' : '#856404', 
                    fontWeight: 'bold', fontSize: 12 
                  }}>
                    {item.status}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}><Ionicons name="home" size={24} color="#0D6EFD" /><Text style={[styles.navText, { color: '#0D6EFD' }]}>Home</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}><Ionicons name="book-outline" size={24} color="#6C757D" /><Text style={styles.navText}>Classes</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setRosterVisible(true)}>
          <Ionicons name="checkmark-done-outline" size={24} color="#6C757D" />
          <Text style={styles.navText}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}><Ionicons name="bar-chart-outline" size={24} color="#6C757D" /><Text style={styles.navText}>Reports</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleComingSoon}><Ionicons name="person-outline" size={24} color="#6C757D" /><Text style={styles.navText}>Profile</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- SCANNER SCREEN ---
function ScannerScreen({ route, navigation }) {
  const { serverIP } = route.params;
  const BACKEND_URL = `http://${serverIP}:8000/upload-frame/`;
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [status, setStatus] = useState("Ready to scan");

  // New state tracking for the loop
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);

  const toggleAutoScan = () => {
    const newState = !isScanning;
    setIsScanning(newState);
    isScanningRef.current = newState;
    
    if (newState) {
      setStatus("Starting auto-scan...");
      runScanLoop();
    } else {
      setStatus("Scanner paused.");
    }
  };

  const runScanLoop = async () => {
    if (!isScanningRef.current) return;

    if (cameraRef.current) {
      try {
        // Lower quality for faster network processing
        const photo = await cameraRef.current.takePictureAsync({ base64: false, quality: 0.3 });
        
        const response = await FileSystem.uploadAsync(BACKEND_URL, photo.uri, {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: 1,
        });

        const data = JSON.parse(response.body);

        // Update text instead of blocking alerts
        if (data.status === 'success') {
          setStatus(`✅ Logged: ${data.student_name}`);
          
          // Pause for 3 seconds after success so the student can walk by
          setTimeout(() => {
              if (isScanningRef.current) runScanLoop();
          }, 3000);
          return; 
        } else {
          setStatus("👀 Scanning for faces...");
        }
      } catch (error) { 
        setStatus("Network error, retrying..."); 
      }
    }

    // If no face found or error, try again in 1.5 seconds
    if (isScanningRef.current) {
      setTimeout(runScanLoop, 1500);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>We need permission to use the camera</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={requestPermission}><Text style={styles.loginBtnText}>Grant Permission</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      <View style={styles.overlay}>
        <Text style={styles.statusText}>{status}</Text>
        <TouchableOpacity 
          style={[styles.scanBtn, { backgroundColor: isScanning ? '#DC3545' : '#007BFF' }]} 
          onPress={toggleAutoScan}
        >
          <Text style={styles.scanBtnText}>
            {isScanning ? "STOP AUTO-SCAN" : "START AUTO-SCAN"}
          </Text>
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
  forgotText: { color: '#6C757D', textAlign: 'right', fontWeight: 'bold', marginBottom: 20 },
  loginBtn: { backgroundColor: '#0D6EFD', padding: 16, borderRadius: 10, alignItems: 'center' },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: 'white', padding: 25, borderRadius: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalSub: { fontSize: 13, color: '#6C757D', marginBottom: 20, textAlign: 'center' },
  
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