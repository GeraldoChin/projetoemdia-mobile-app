import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'pd_access_token';
const REFRESH_KEY = 'pd_refresh_token';

let accessToken: string | null = null;
let refreshToken: string | null = null;

/** Tokens em memória + (opcional) guardados de forma segura no telemóvel. */
export const tokenStore = {
  getAccess: () => accessToken,
  getRefresh: () => refreshToken,

  async load() {
    [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
  },

  /** persist=false → "Lembrar de mim" desligado: a sessão só dura enquanto a app estiver aberta. */
  async save(access: string, refresh: string, persist = true) {
    accessToken = access;
    refreshToken = refresh;
    if (persist) {
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_KEY, access),
        SecureStore.setItemAsync(REFRESH_KEY, refresh),
      ]);
    } else {
      await this.wipeStorage();
    }
  },

  /** Actualiza só os tokens guardados se já havia sessão persistida. */
  async rotate(access: string, refresh: string) {
    const wasPersisted = !!(await SecureStore.getItemAsync(REFRESH_KEY));
    await this.save(access, refresh, wasPersisted);
  },

  async clear() {
    accessToken = null;
    refreshToken = null;
    await this.wipeStorage();
  },

  async wipeStorage() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
