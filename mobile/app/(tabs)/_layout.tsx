import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { Icon, IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { colors, radius, shadow } from '@/theme';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Início', icon: 'home' },
  projects: { label: 'Projectos', icon: 'folder-open' },
  tasks: { label: 'Tarefas', icon: 'checklist' },
  profile: { label: 'Perfil', icon: 'person-outline' },
};

/** Barra inferior em "pílula" flutuante, como nos protótipos. O separador activo mostra o rótulo. */
function FloatingTabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const meta = TABS[route.name];
          if (!meta) return null;
          const focused = state.index === index;

          const onPress = () => {
            if (!focused) navigateToTab(route.key);
          };

          return (
            <Pressable key={route.key} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={meta.label} style={[styles.item, focused && styles.itemActive]}>
              <Icon name={meta.icon} size={20} color={focused ? colors.onPrimary : colors.onSurfaceVariant} />
              {focused ? <Text variant="labelMd" color={colors.onPrimary}>{meta.label}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="projects" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 4 },
  bar: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 4, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.outlineVariant, ...shadow.float },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, paddingHorizontal: 14, borderRadius: radius.full },
  itemActive: { backgroundColor: colors.primaryContainer },
});
