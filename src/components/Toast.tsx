import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

type ToastKind = 'success' | 'error' | 'info';
interface ToastApi {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

const ICON = { success: 'check-circle', error: 'error', info: 'info' } as const;
const TINT = { success: colors.success, error: colors.danger, info: colors.secondaryContainer } as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, kind });
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
    }, 2600);
  }, [opacity]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: insets.bottom + 100 }]}>
          <Animated.View style={[styles.toast, shadow.float, { opacity }]}>
            <Icon name={ICON[toast.kind]} size={18} color={TINT[toast.kind]} />
            <Text variant="labelLg" color={colors.background} style={{ flexShrink: 1 }}>{toast.message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '88%', backgroundColor: colors.onSurface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full },
});
