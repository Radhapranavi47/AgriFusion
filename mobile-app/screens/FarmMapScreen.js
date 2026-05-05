import React, { useCallback, useState } from 'react';
import { Alert, Button, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';

import { API_BASE_URL } from '@/constants/api';

const INITIAL_REGION = {
  latitude: 16.5062, // Andhra Pradesh default
  longitude: 80.6480,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function FarmMapScreen() {
  const [points, setPoints] = useState([]);

  const handleMapPress = useCallback((event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPoints((prev) => [...prev, { latitude, longitude }]);
  }, []);

  const handleClearPoints = useCallback(() => {
    setPoints([]);
  }, []);

  const handleSaveFarm = useCallback(async () => {
    if (points.length < 3) {
      Alert.alert("Error", "Select at least 3 points to create a farm.");
      return;
    }

    try {
      // Convert to [longitude, latitude]
      const convertedPoints = points.map(point => [
        point.longitude,
        point.latitude
      ]);

      // Close polygon by adding first point again
      convertedPoints.push(convertedPoints[0]);

      const geoJSON = {
        type: "Polygon",
        coordinates: [convertedPoints]
      };

      const response = await fetch(`${API_BASE_URL}/api/farms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          farmerName: "Ramesh",
          cropType: "Paddy",
          sowingDate: "2025-06-01",
          location: geoJSON
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save farm");
      }

      Alert.alert("Success", "Farm saved successfully!");
      setPoints([]);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message);
    }

  }, [points]);

  const isSaveDisabled = points.length < 3;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType="satellite"
        initialRegion={INITIAL_REGION}
        onPress={handleMapPress}
      >
        {points.map((point, idx) => (
          <Marker key={String(idx)} coordinate={point} />
        ))}

        {points.length >= 3 && (
          <Polygon
            coordinates={points}
            strokeColor="rgba(0, 255, 0, 0.9)"
            fillColor="rgba(0, 255, 0, 0.2)"
            strokeWidth={2}
          />
        )}
      </MapView>

      <View style={styles.buttonRow}>
        <View style={styles.button}>
          <Button title="Clear Points" onPress={handleClearPoints} />
        </View>
        <View style={styles.button}>
          <Button
            title="Save Farm"
            onPress={handleSaveFarm}
            disabled={isSaveDisabled}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
