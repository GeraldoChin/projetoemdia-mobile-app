import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/theme';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: IconName;
  children: React.ReactNode;
}

/** Folha inferior com fundo escurecido, "pega" e teclado a empurrar o conteúdo. */
export function BottomSheet({ visible, onClose, title, subtitle, icon, children }: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const height = Dimensions.get('window').height;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: height * 0.92, paddingBottom: Math.max(insets.bottom, spacing.md) },
            { transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }] },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              {icon ? (
                <View style={styles.headerIcon}>
                  <Icon name={icon} size={20} color={colors.onSecondaryFixed} />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Text variant="headlineMd">{title}</Text>
                {subtitle ? <Text variant="labelSm" color={colors.onSurfaceVariant}>{subtitle}</Text> : null}
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Fechar" hitSlop={8}>
              <Icon name="close" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(25,28,30,0.45)' },
  sheet: { backgroundColor: colors.surfaceLowest, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
  handle: { alignSelf: 'center', width: 48, height: 5, borderRadius: 3, backgroundColor: colors.surfaceHighest, marginTop: 10, marginBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.secondaryFixed, alignItems: 'center', justifyContent: 'center' },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: 14 },
});
