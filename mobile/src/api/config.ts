import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * URL base da API.
 * 1) EXPO_PUBLIC_API_URL (.env) tem prioridade.
 * 2) Em desenvolvimento usa o IP do computador que serve a app (Expo Go num telemóvel real).
 * 3) Emulador Android: 10.0.2.2 · Simulador iOS: localhost.
 */
export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri; // ex.: "192.168.1.10:8081"
  const devHost = hostUri?.split(':')[0];
  // Docker Compose publica a API na porta 3050 do computador (3050:3000).
  if (devHost) return `http://${devHost}:3050/api/v1`;

  return Platform.OS === 'android' ? 'http://10.0.2.2:3050/api/v1' : 'http://localhost:3050/api/v1';
}
