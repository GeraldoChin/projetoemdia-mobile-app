import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '@/theme';

export type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export function Icon({ name, size = 20, color = colors.onSurfaceVariant }: { name: IconName; size?: number; color?: string }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}
