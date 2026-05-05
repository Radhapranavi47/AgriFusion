/**
 * Backend API base URL.
 * For physical devices: use your laptop's LAN IP (e.g. http://192.168.1.X:5000).
 * localhost does NOT work on physical devices.
 *
 * Set in mobile-app/.env (Expo requires EXPO_PUBLIC_* for client bundles):
 *   EXPO_PUBLIC_API_URL=http://192.168.X.X:5000
 * Optional: EXPO_PUBLIC_API_BASE_URL (same value)
 */
import axios from 'axios';

const DEFAULT_LAN_FALLBACK = 'http://192.168.1.5:5000';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  DEFAULT_LAN_FALLBACK;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
  console.log('Resolved API_BASE_URL:', API_BASE_URL);
}
