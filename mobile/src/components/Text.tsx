import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { colors, TextVariant, typography } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  uppercase?: boolean;
}

/** Texto com os estilos tipográficos do design system (Inter). */
export function Text({ variant = 'bodyMd', color = colors.onSurface, uppercase, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[typography[variant], { color }, uppercase && { textTransform: 'uppercase' }, style]}
    />
  );
}
