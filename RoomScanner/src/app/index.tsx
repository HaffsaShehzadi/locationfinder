import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  StatusBar,
  LogBox
} from 'react-native';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';

// Screen par popups/warnings ko block karein
LogBox.ignoreAllLogs();

export default function Index() {
  const [roomNumber, setRoomNumber] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [floorNumber, setFloorNumber] = useState('1');

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [savedRooms, setSavedRooms] = useState<any[]>([]);

  // 📡 Live GPS Satellite se coordinates fetch karna
  const fetchRoomGPS = async () => {
    setLoading(true);
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== 'granted') {
          Alert.alert('Permission Denied', 'Mobile Settings mein ja kar Location Permission allow karein.');
          setLoading(false);
          return;
        }
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setAccuracy(loc.coords.accuracy);

      if (loc.coords.accuracy && loc.coords.accuracy > 15) {
        Alert.alert(
          'Wait 5-10 Seconds',
          `Abhi accuracy ±${loc.coords.accuracy.toFixed(1)}m hai. Kamray ke darwazay ya khirki ke paas 5 second kharay ho kar dobara dabayein taake aur behtar signal mil sake.`
        );
      }
    } catch (err: any) {
      Alert.alert('GPS Error', err.message || 'Location fetch karne mein masla aaya.');
    } finally {
      setLoading(false);
    }
  };

  // 💾 Room save karna
  const handleSaveRoom = () => {
    if (!roomNumber.trim()) {
      Alert.alert('Input Error', 'Room number enter karein (e.g. 101, Lab 2)');
      return;
    }
    if (!latitude || !longitude) {
      Alert.alert('Input Error', 'Pehle button daba kar GPS Coordinates fetch karein.');
      return;
    }

    const newRecord = {
      id: Date.now(),
      room_no: roomNumber.trim(),
      building: buildingName.trim() || 'Main Block',
      floor: floorNumber.trim() || '1',
      latitude: latitude,
      longitude: longitude,
      accuracy: accuracy ? accuracy.toFixed(1) : 'N/A',
      radius_meters: 25,
    };

    setSavedRooms([newRecord, ...savedRooms]);
    Alert.alert('Success ✅', `Room ${roomNumber} ke coordinates list mein save ho gaye! Niche "Copy Query" button se query copy karein.`);
    setRoomNumber('');
  };

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = async (query: string, id: number) => {
    try {
      await Clipboard.setStringAsync(query);
      setCopiedId(id);
      Alert.alert('Copied! 📋', 'SQL Query clipboard par copy ho gayi hai! Aap isay paste kar sakti hain.');
      setTimeout(() => {
        setCopiedId(null);
      }, 3000);
    } catch (err: any) {
      Alert.alert('Error', 'Clipboard copy karne mein masla aaya: ' + err.message);
    }
  };

  const copyAllToClipboard = async () => {
    try {
      const allQueries = savedRooms.map((item) =>
        `INSERT INTO rooms (room_no, latitude, longitude, radius_meters, building_name, floor_number) VALUES ('${item.room_no}', ${item.latitude}, ${item.longitude}, 25, '${item.building}', ${item.floor});`
      ).join('\n');
      await Clipboard.setStringAsync(allQueries);
      Alert.alert('All Copied! 📋', 'Tamam rooms ki SQL queries copy ho gayi hain!');
    } catch (err: any) {
      Alert.alert('Error', 'Clipboard copy karne mein masla aaya: ' + err.message);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 College Room GPS Finder</Text>
        <Text style={styles.headerSubtitle}>Class Monitoring System</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Input Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Room Number / Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Room 101, CS Lab, Room 204"
            value={roomNumber}
            onChangeText={setRoomNumber}
            placeholderTextColor="#999"
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Building Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Main Block"
                value={buildingName}
                onChangeText={setBuildingName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Floor Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1 or 2"
                value={floorNumber}
                onChangeText={setFloorNumber}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.fetchBtn, loading && styles.btnDisabled]} 
            onPress={fetchRoomGPS} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.fetchBtnText}>📡 Capture Live GPS Coordinates</Text>
            )}
          </TouchableOpacity>

          {latitude && longitude && (
            <View style={styles.coordsBox}>
              <Text style={styles.boxHeading}>Current Room GPS Data:</Text>

              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Latitude:</Text>
                <Text style={styles.coordValue}>{latitude}</Text>
              </View>

              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Longitude:</Text>
                <Text style={styles.coordValue}>{longitude}</Text>
              </View>

              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Accuracy:</Text>
                <Text style={[
                  styles.coordValue, 
                  { color: accuracy && accuracy <= 10 ? '#2E7D32' : accuracy && accuracy <= 20 ? '#F57C00' : '#D32F2F' }
                ]}>
                  ±{accuracy ? accuracy.toFixed(1) : '0'} meters {accuracy && accuracy <= 10 ? ' (Best ✅)' : ' (Wait 5s)'}
                </Text>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRoom}>
                <Text style={styles.saveBtnText}>💾 Save This Room</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Saved List */}
        {savedRooms.length > 0 && (
          <View style={styles.savedCard}>
            <View style={styles.savedHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.savedTitle}>📋 Saved Rooms ({savedRooms.length})</Text>
                <Text style={styles.savedSub}>Database 'rooms' table ke liye ready queries:</Text>
              </View>
              {savedRooms.length > 1 && (
                <TouchableOpacity style={styles.copyAllBtn} onPress={copyAllToClipboard}>
                  <Text style={styles.copyAllBtnText}>📋 Copy All</Text>
                </TouchableOpacity>
              )}
            </View>

            {savedRooms.map((item) => {
              const query = `INSERT INTO rooms (room_no, latitude, longitude, radius_meters, building_name, floor_number) VALUES ('${item.room_no}', ${item.latitude}, ${item.longitude}, 25, '${item.building}', ${item.floor});`;
              const isCopied = copiedId === item.id;

              return (
                <View key={item.id} style={styles.roomItem}>
                  <View style={styles.roomItemHeader}>
                    <Text style={styles.roomItemName}>Room {item.room_no}</Text>
                    <Text style={styles.roomItemBadge}>{item.building} • Floor {item.floor}</Text>
                  </View>

                  <Text style={styles.roomDetail}>Lat: {item.latitude} | Lng: {item.longitude}</Text>
                  <Text style={styles.roomDetail}>Radius: {item.radius_meters}m | Accuracy: ±{item.accuracy}m</Text>

                  <View style={styles.sqlBox}>
                    <Text style={styles.sqlText}>{query}</Text>
                    
                    <TouchableOpacity
                      style={[styles.copyBtn, isCopied && styles.copyBtnSuccess]}
                      onPress={() => copyToClipboard(query, item.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.copyBtnText}>
                        {isCopied ? '✅ Copied to Clipboard!' : '📋 Copy SQL Query'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { backgroundColor: '#1A237E', paddingTop: 45, paddingBottom: 18, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  headerSubtitle: { color: '#C5CAE9', fontSize: 13, marginTop: 2 },
  container: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 3 },
  label: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#DDD', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 14, backgroundColor: '#FAFAFA', color: '#222' },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  fetchBtn: { backgroundColor: '#1A237E', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  fetchBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },
  coordsBox: { marginTop: 18, backgroundColor: '#E8EAF6', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#C5CAE9' },
  boxHeading: { fontSize: 15, fontWeight: '800', color: '#1A237E', marginBottom: 10 },
  coordRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  coordLabel: { fontSize: 13, color: '#555', fontWeight: '600' },
  coordValue: { fontSize: 14, color: '#1A237E', fontWeight: '800' },
  saveBtn: { backgroundColor: '#2E7D32', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  savedCard: { marginTop: 20, backgroundColor: '#FFF', borderRadius: 16, padding: 18, elevation: 3 },
  savedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  copyAllBtn: { backgroundColor: '#1A237E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  copyAllBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  savedTitle: { fontSize: 17, fontWeight: '800', color: '#1A237E' },
  savedSub: { fontSize: 12, color: '#666', marginBottom: 14, marginTop: 2 },
  roomItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  roomItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  roomItemName: { fontSize: 16, fontWeight: '800', color: '#1A237E' },
  roomItemBadge: { fontSize: 11, color: '#666', backgroundColor: '#E0E0E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roomDetail: { fontSize: 12, color: '#444', marginTop: 2 },
  sqlBox: { marginTop: 8, backgroundColor: '#F1F8E9', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#C8E6C9' },
  sqlText: { fontSize: 11, color: '#2E7D32', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 16 },
  copyBtn: { backgroundColor: '#2E7D32', marginTop: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  copyBtnSuccess: { backgroundColor: '#1B5E20' },
  copyBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});