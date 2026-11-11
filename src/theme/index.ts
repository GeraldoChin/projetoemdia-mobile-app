/** Tokens de design extraídos dos protótipos do Stitch (ver prototipos/design/tokens.json). */
export const colors = {
  primary: '#001633',
  primaryContainer: '#102B4E', // azul-marinho da marca
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#7B93BC',

  secondary: '#38618B',
  secondaryContainer: '#A8CFFF',
  secondaryFixed: '#D1E4FF',
  onSecondaryFixed: '#001D35',
  onSecondaryFixedVariant: '#1D4972',

  background: '#F8F9FB',
  surfaceLowest: '#FFFFFF',
  surfaceLow: '#F2F4F6',
  surface: '#EDEEF0',
  surfaceHigh: '#E7E8EA',
  surfaceHighest: '#E1E2E4',

  onSurface: '#191C1E',
  onSurfaceVariant: '#44474E',
  outline: '#74777F',
  outlineVariant: '#C4C6CF',

  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',

  success: '#2E9D72',
  successBg: '#EAF7F2',
  warning: '#E6A23C',
  warningBg: '#FEF6EC',
  info: '#244F78',
  infoBg: '#EAF2FA',
  danger: '#D95C5C',
  dangerBg: '#FDF0F0',
  neutral: '#778493',
  neutralBg: '#EDEEF0',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, screen: 20 } as const;
export const radius = { sm: 4, lg: 8, xl: 12, xxl: 16, sheet: 28, full: 9999 } as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export type TextVariant =
  | 'displayLg' | 'displaySm' | 'headlineLg' | 'headlineMd' | 'headlineSm'
  | 'bodyLg' | 'bodyMd' | 'bodySm' | 'labelLg' | 'labelMd' | 'labelSm';

/** tamanho, altura de linha, família e letterSpacing (em → px) */
export const typography: Record<TextVariant, { fontSize: number; lineHeight: number; fontFamily: string; letterSpacing: number }> = {
  displayLg: { fontSize: 32, lineHeight: 40, fontFamily: fonts.bold, letterSpacing: -0.64 },
  displaySm: { fontSize: 24, lineHeight: 32, fontFamily: fonts.semibold, letterSpacing: -0.36 },
  headlineLg: { fontSize: 20, lineHeight: 28, fontFamily: fonts.semibold, letterSpacing: -0.2 },
  headlineMd: { fontSize: 18, lineHeight: 24, fontFamily: fonts.semibold, letterSpacing: -0.09 },
  headlineSm: { fontSize: 16, lineHeight: 22, fontFamily: fonts.semibold, letterSpacing: 0 },
  bodyLg: { fontSize: 16, lineHeight: 24, fontFamily: fonts.regular, letterSpacing: 0 },
  bodyMd: { fontSize: 14, lineHeight: 20, fontFamily: fonts.regular, letterSpacing: 0 },
  bodySm: { fontSize: 13, lineHeight: 18, fontFamily: fonts.regular, letterSpacing: 0 },
  labelLg: { fontSize: 13, lineHeight: 16, fontFamily: fonts.semibold, letterSpacing: 0.13 },
  labelMd: { fontSize: 11, lineHeight: 14, fontFamily: fonts.semibold, letterSpacing: 0.22 },
  labelSm: { fontSize: 10, lineHeight: 12, fontFamily: fonts.medium, letterSpacing: 0.4 },
};

export const shadow = {
  card: { shadowColor: '#102B4E', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  float: { shadowColor: '#102B4E', shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
} as const;
